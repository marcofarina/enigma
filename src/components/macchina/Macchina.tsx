import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { groupLetters, toIndex, windowLetters } from '@/engine';
import { t, tf, type UiKey } from '@/i18n';
import type { Copione, Durate } from '@/lib/lezione-3d';
import { modello3d } from '@/lib/modello3d';
import { url } from '@/lib/url';
import { currentState } from '../simulator/session.ts';
import { FASI, VISTE, type ComandiCamera, type IdVista, type StatoZoom } from './geometria.ts';
import { createSimulatorStore, useKeyCapture } from '../simulator/store.ts';
import { queryPerIlSimulatore, sessioneDallaQuery } from './configurazione.ts';
import { creaStoreLezione, inProva, preparaLezione, quadroDi } from './lezione.ts';
import { ElencoPezzi, SchedaPezzo } from './Pezzi.tsx';
import type { Pezzo } from './pezzi.ts';

/** three.js, React Three Fiber, drei e il `.glb` arrivano solo con questo import, dopo il pulsante. */
const Scena = lazy(() => import('./Scena.tsx'));

/** Il lettore della lezione animata arriva solo con «Guarda come funziona» (fase 5d). */
const LezioneAnimata = lazy(() => import('../lesson/LezioneAnimata.tsx'));

/** Quante lettere del nastro mostra la pagina: le ultime sei gruppi da cinque. */
const LETTERE_NASTRO = 30;

type Fase = 'anteprima' | 'caricamento' | 'pronta' | 'senza-webgl' | 'errore';

/** three.js dalla r163 richiede WebGL 2. */
function haWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/** Un errore della scena (modulo che non arriva, contesto WebGL che non parte) diventa un avviso. */
class Confine extends Component<{ onErrore: () => void; children: ReactNode }, { errore: boolean }> {
  override state = { errore: false };
  static getDerivedStateFromError() {
    return { errore: true };
  }
  override componentDidCatch() {
    this.props.onErrore();
  }
  override render() {
    return this.state.errore ? null : this.props.children;
  }
}

function Avviso({ children }: { children: ReactNode }) {
  return (
    <p className="macchina-avviso" role="note">
      {children}
    </p>
  );
}

/**
 * Un tasto rifiutato perché la macchina è smontata: quante volte, a quale tasto (`pulse`) era la
 * macchina, e se l'elenco è già tornato su «macchina chiusa» (`ritirato`: il messaggio visibile
 * sparisce, ma l'annuncio resta com'è e non si ripete).
 */
type Blocco = { n: number; pulse: number; ritirato: boolean } | null;

function initialStore() {
  const { session, avviso } = sessioneDallaQuery(window.location.search);
  return { store: createSimulatorStore(session), avviso };
}

/**
 * Che cosa mostra il foglio sotto lo smontaggio: il messaggio, l’elenco dei pezzi o la scheda di un
 * pezzo (fase 5c). `da` dice chi ha aperto la scheda, perché alla chiusura il fuoco torni lì.
 */
type Pannello = { tipo: 'messaggio' } | { tipo: 'elenco' } | { tipo: 'scheda'; id: string; da: 'elenco' | 'scena' };

/** Dove va il fuoco dopo un cambio di pannello: un elemento con `data-fuoco`, oppure la scena. */
type Fuoco = string | 'palco';

/** La vista attiva: una predefinita, l'inquadratura della fase (all'avvio, dopo «Ripristina» e a ogni cambio di fase), oppure la camera mossa a mano. */
type VistaAttiva = IdVista | 'fase' | 'libera';

const ETICHETTA_VISTA: Record<IdVista, UiKey> = {
  fronte: 'machine3d.view.front',
  alto: 'machine3d.view.top',
  rotori: 'machine3d.view.rotors',
  pannello: 'machine3d.view.panel',
};

const FASI_ELENCO = Array.from({ length: FASI + 1 }, (_, n) => n);

/** Le lettere degli anelli come le scrive la macchina: 01 … 26. */
const anelliInCifre = (anelli: string) =>
  anelli
    .split('')
    .map((lettera) => String(toIndex(lettera) + 1).padStart(2, '0'))
    .join(' ');

/**
 * La pagina `/macchina/`: l’anteprima statica e, dopo «Avvia la vista 3D», la macchina in 3D. La
 * configurazione viene dalla query come nella home; lo store è quello del simulatore, quindi il
 * motore è uno solo. A sinistra il vano con la scena e, nel piede, la pulsantiera della camera; a
 * destra il foglio con l’elenco delle fasi dello smontaggio e il messaggio (docs/design.md,
 * «Pagina 3D»).
 */
export default function Macchina({
  peso,
  pezzi,
  lezione,
}: {
  /** Quanto scarica la vista, letto alla build da `pesoVista()`. */
  peso: string;
  /** Le schede dei pezzi, da `src/content/pezzi.yaml`, con lezione e fonti già risolte. */
  pezzi: readonly Pezzo[];
  /** La lezione animata (fase 5d): il copione, le durate dell’audio e la cartella dei file audio. */
  lezione: { copione: Copione; durate: Durate; audio: string };
}) {
  const [{ store, avviso }] = useState(initialStore);
  const [fase, setFase] = useState<Fase>('anteprima');
  const [ridotto] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [smontaggio, setSmontaggio] = useState(0);
  const [blocco, setBlocco] = useState<Blocco>(null);
  const [vista, setVista] = useState<VistaAttiva>('fase');
  const [zoom, setZoom] = useState<StatoZoom>({ puoAvvicinare: true, puoAllontanare: true });
  const comandi = useRef<ComandiCamera | null>(null);
  const [pannello, setPannello] = useState<Pannello>({ tipo: 'messaggio' });
  const [fasiPezzi, setFasiPezzi] = useState<Readonly<Record<string, number | null>>>({});
  const foglio = useRef<HTMLDivElement>(null);
  const fuoco = useRef<Fuoco | null>(null);
  const smontata = smontaggio > 0;
  const session = useStore(store, (s) => s.session);
  const pulse = useStore(store, (s) => s.pulse);

  // La lezione animata (fase 5d): il lettore scrive passo e tempo in `statoLezione`, la scena li legge.
  // Da «ora prova tu» la scena torna allo store e la tastiera cifra di nuovo.
  const [lezioneAperta, setLezioneAperta] = useState(false);
  const [statoLezione] = useState(creaStoreLezione);
  const datiLezione = useMemo(() => preparaLezione(lezione.copione, lezione.durate), [lezione]);
  const provaLezione = useStore(statoLezione, (s) => inProva(datiLezione, s.indice));
  const lampadaLezione = useStore(statoLezione, (s) => quadroDi(datiLezione, s).lampada);
  const lezioneInScena = lezioneAperta && !provaLezione;
  const inScena = useMemo(
    () => (lezioneInScena ? { lezione: datiLezione, stato: statoLezione } : null),
    [lezioneInScena, datiLezione, statoLezione],
  );
  // A macchina smontata la tastiera non cifra: né quella fisica né i tasti del modello. Il rifiuto si annuncia.
  const rifiuta = useCallback(() => setBlocco((b) => ({ n: (b?.n ?? 0) + 1, pulse, ritirato: false })), [pulse]);
  const palco = useKeyCapture(store, () => {
    // Durante la lezione la tastiera è ferma: la scena la guida il copione.
    if (lezioneInScena) return true;
    if (!smontata) return false;
    rifiuta();
    return true;
  });
  const attiva = fase === 'caricamento' || fase === 'pronta';

  // Scegliere una fase porta i pezzi lì e la camera sulla sua inquadratura: la vista predefinita si azzera.
  const scegliFase = (valore: number) => {
    setSmontaggio(valore);
    setVista('fase');
    if (valore === 0) setBlocco((b) => (b ? { ...b, ritirato: true } : b));
  };
  const scegliVista = (id: IdVista) => {
    comandi.current?.vista(id);
    setVista(id);
  };
  const ripristina = () => {
    comandi.current?.ripristina();
    setVista('fase');
  };
  const onCameraLibera = useCallback(() => setVista('libera'), []);

  // Elenco e scheda: a ogni apertura e chiusura il fuoco va dove serve (docs/design.md, «Pagina 3D»).
  const apri = (nuovo: Pannello, dove: Fuoco) => {
    fuoco.current = dove;
    setPannello(nuovo);
  };
  const apriElenco = () => apri({ tipo: 'elenco' }, 'elenco');
  const chiudiElenco = () => apri({ tipo: 'messaggio' }, 'pezzi');
  const apriScheda = (id: string, da: 'elenco' | 'scena') => apri({ tipo: 'scheda', id, da }, 'scheda');
  const chiudiScheda = () => {
    if (pannello.tipo !== 'scheda') return;
    if (pannello.da === 'elenco') apri({ tipo: 'elenco' }, `voce:${pannello.id}`);
    else apri({ tipo: 'messaggio' }, 'palco');
  };
  // Il clic su un pezzo del modello: la scena chiama questa, stabile fra un render e l’altro.
  const onPezzo = useCallback((id: string) => {
    fuoco.current = 'scheda';
    setPannello({ tipo: 'scheda', id, da: 'scena' });
  }, []);
  useEffect(() => {
    const dove = fuoco.current;
    if (!dove) return;
    fuoco.current = null;
    if (dove === 'palco') palco.current?.focus({ preventScroll: true });
    else foglio.current?.querySelector<HTMLElement>(`[data-fuoco="${dove}"]`)?.focus();
  }, [pannello, palco, lezioneAperta]);
  const schedaAperta = pannello.tipo === 'scheda' ? pezzi.find((p) => p.id === pannello.id) : undefined;

  const avvia = () => setFase(haWebGL2() ? 'caricamento' : 'senza-webgl');

  // «Guarda come funziona» chiude scheda ed elenco, rimonta la macchina e, se serve, avvia la vista 3D.
  const apriLezione = () => {
    statoLezione.setState({ indice: 0, t: 0 });
    scegliFase(0);
    setPannello({ tipo: 'messaggio' });
    if (fase === 'anteprima') avvia();
    setLezioneAperta(true);
  };
  const chiudiLezione = () => {
    fuoco.current = 'lezione';
    setLezioneAperta(false);
  };
  // «Ora prova tu»: lo store prende la configurazione del copione con il tasto già battuto, così la
  // scena resta com'era e la prossima lettera si cifra da lì.
  useEffect(() => {
    if (!lezioneAperta || !provaLezione) return;
    const stato = store.getState();
    stato.configure(() => datiLezione.config);
    stato.press(datiLezione.copione.lettera);
  }, [lezioneAperta, provaLezione, store, datiLezione]);
  const onPronto = useCallback(() => setFase('pronta'), []);
  const onErrore = useCallback(() => setFase('errore'), []);

  // Il pulsante sparisce: il fuoco passa alla scena, così si può battere subito.
  useEffect(() => {
    if (fase === 'caricamento') palco.current?.focus({ preventScroll: true });
  }, [fase, palco]);

  const ultimo = session.presses.at(-1);
  const stato = currentState(session);
  const tasti = session.presses.map((p) => p.input).join('');
  const lampade = session.presses.map((p) => p.output).join('');
  const nastro = (testo: string) => groupLetters(testo.slice(-LETTERE_NASTRO));
  const alSimulatore = `${url()}?${queryPerIlSimulatore(session)}`;
  const pronta = fase === 'pronta';

  return (
    <div className="macchina">
      <div className="macchina-vano">
        <div
          ref={palco}
          className="macchina-palco machine"
          // La scena riceve le lettere come la tastiera della macchina: il lettore di schermo le lascia passare.
          role={attiva ? 'application' : undefined}
          tabIndex={attiva ? 0 : undefined}
          aria-label={attiva ? t('machine3d.sceneLabel') : undefined}
          data-fase={fase}
          data-vista={vista}
        >
          {fase !== 'pronta' && (
            <img
              className="macchina-anteprima"
              src={modello3d.anteprima}
              width={modello3d.larghezzaAnteprima}
              height={modello3d.altezzaAnteprima}
              alt={t('machine3d.previewAlt')}
            />
          )}
          {attiva && (
            <Confine onErrore={onErrore}>
              <Suspense fallback={null}>
                <Scena
                  store={store}
                  fase={smontaggio}
                  ridotto={ridotto}
                  bloccata={smontata}
                  onBloccata={rifiuta}
                  onPronto={onPronto}
                  comandiRef={comandi}
                  onCameraLibera={onCameraLibera}
                  onZoom={setZoom}
                  pezzi={pezzi}
                  evidenziati={schedaAperta?.nodi ?? null}
                  onPezzo={onPezzo}
                  onFasiPezzi={setFasiPezzi}
                  lezione={inScena}
                />
              </Suspense>
            </Confine>
          )}
          {fase === 'anteprima' && (
            <div className="macchina-avvio">
              <button type="button" className="macchina-pulsante" onClick={avvia}>
                {tf('machine3d.startWithSize', { size: peso })}
              </button>
            </div>
          )}
          {fase === 'caricamento' && (
            <p className="macchina-stato" role="status">
              {t('machine3d.loading')}
            </p>
          )}
          {(fase === 'senza-webgl' || fase === 'errore') && (
            <Avviso>
              {t(fase === 'errore' ? 'machine3d.error' : 'machine3d.noWebgl')}{' '}
              <a href={alSimulatore}>{t('machine3d.toSimulator')}</a>
            </Avviso>
          )}
        </div>

        <div className="macchina-piede" role="group" aria-label={t('machine3d.camera')} data-pulsantiera>
          {pronta && (
            <>
              <div className="macchina-viste">
                {VISTE.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="macchina-comando"
                    aria-pressed={vista === v.id}
                    onClick={() => scegliVista(v.id)}
                  >
                    {t(ETICHETTA_VISTA[v.id])}
                  </button>
                ))}
              </div>
              {/* Sul telefono le quattro viste diventano un menu. */}
              <div className="macchina-menu-vista">
                <select
                  aria-label={t('machine3d.view.label')}
                  value={vista}
                  onChange={(event) => {
                    const scelta = event.target.value;
                    if (scelta === 'fase') ripristina();
                    else if (VISTE.some((v) => v.id === scelta)) scegliVista(scelta as IdVista);
                  }}
                >
                  <option value="fase">{t('machine3d.view.all')}</option>
                  {VISTE.map((v) => (
                    <option key={v.id} value={v.id}>
                      {t(ETICHETTA_VISTA[v.id])}
                    </option>
                  ))}
                  <option value="libera" disabled hidden>
                    {t('machine3d.view.free')}
                  </option>
                </select>
              </div>
              <div className="macchina-zoom">
                <button
                  type="button"
                  className="macchina-comando macchina-quadrato"
                  aria-label={t('machine3d.zoomOut')}
                  title={t('machine3d.zoomOut')}
                  disabled={!zoom.puoAllontanare}
                  onClick={() => comandi.current?.zoom(-1)}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <button
                  type="button"
                  className="macchina-comando macchina-quadrato"
                  aria-label={t('machine3d.zoomIn')}
                  title={t('machine3d.zoomIn')}
                  disabled={!zoom.puoAvvicinare}
                  onClick={() => comandi.current?.zoom(1)}
                >
                  <span aria-hidden="true">+</span>
                </button>
                <button
                  type="button"
                  className="macchina-comando macchina-quadrato"
                  aria-label={t('machine3d.viewReset')}
                  title={t('machine3d.viewReset')}
                  onClick={ripristina}
                >
                  <span aria-hidden="true">⟲</span>
                </button>
              </div>
            </>
          )}
          <p className="macchina-gesti">
            <span className="macchina-gesti-mouse">{t('machine3d.gestures')}</span>
            <span className="macchina-gesti-tocco">{t('machine3d.gesturesTouch')}</span>
          </p>
        </div>
      </div>

      <div className="macchina-foglio" ref={foglio}>
        {avviso.tipo === 'link-non-valido' && <Avviso>{t('sim.share.invalid')}</Avviso>}
        {avviso.tipo === 'altro-modello' && (
          <Avviso>
            {tf('machine3d.otherModel', { model: avviso.modello })}{' '}
            <a href={`${url()}?${avviso.query}`}>{t('machine3d.otherModelLink')}</a>
          </Avviso>
        )}

        <h1 className="macchina-titolo">{t('machine3d.title')}</h1>
        <p className="macchina-config">
          {tf('machine3d.config', {
            rotors: session.config.rotors.join(' '),
            rings: anelliInCifre(session.config.rings),
          })}
        </p>
        <div className="macchina-pulsanti">
          <button
            type="button"
            className="btn macchina-guarda"
            data-fuoco="lezione"
            onClick={lezioneAperta ? chiudiLezione : apriLezione}
          >
            {t(lezioneAperta ? 'machine3d.lesson.exit' : 'machine3d.lesson.start')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={lezioneAperta}
            aria-expanded={pannello.tipo === 'elenco'}
            aria-controls={pannello.tipo === 'messaggio' ? undefined : 'macchina-pannello-pezzi'}
            data-fuoco="pezzi"
            onClick={pannello.tipo === 'elenco' ? chiudiElenco : apriElenco}
          >
            {t('machine3d.parts')}
          </button>
        </div>

        {lezioneAperta && (
          <Suspense fallback={null}>
            <LezioneAnimata
              copione={lezione.copione}
              durate={lezione.durate}
              audio={lezione.audio}
              stato={statoLezione}
              senzaVoce={ridotto}
              pronta={fase !== 'anteprima' && fase !== 'caricamento'}
            />
          </Suspense>
        )}

        {pronta && !lezioneAperta && (
          <section aria-labelledby="macchina-smontaggio" className="macchina-sezione">
            <h2 id="macchina-smontaggio">{t('machine3d.explode.label')}</h2>
            <div role="radiogroup" aria-labelledby="macchina-smontaggio" className="macchina-fasi">
              {FASI_ELENCO.map((n) => (
                <label key={n} className="macchina-fase" data-scelta={n === smontaggio}>
                  <input
                    type="radio"
                    name="smontaggio"
                    value={n}
                    checked={n === smontaggio}
                    onChange={() => scegliFase(n)}
                  />
                  <span className="macchina-pallino" aria-hidden="true" />
                  <span className="macchina-numero" aria-hidden="true">
                    {n}
                  </span>
                  <span className="macchina-nome">{t(`machine3d.phase.${n}` as UiKey)}</span>
                </label>
              ))}
            </div>
            {smontata && blocco && !blocco.ritirato && (
              <p className="macchina-blocco" data-blocco>
                {t('machine3d.locked')}
              </p>
            )}
          </section>
        )}

        {/* Annuncio per chi usa un lettore di schermo, e appiglio per i test: una riga nuova a ogni tasto. */}
        <p className="sr-only" aria-live="polite" aria-atomic="true" data-annuncio>
          {lezioneInScena ? (
            lampadaLezione && <span key="lezione">{tf('machine3d.live', { letter: datiLezione.press.output })}</span>
          ) : blocco && blocco.pulse === pulse ? (
            <span key={`blocco-${blocco.n}`}>{t('machine3d.locked')}</span>
          ) : (
            ultimo && pulse > 0 && <span key={pulse}>{tf('machine3d.live', { letter: ultimo.output })}</span>
          )}
        </p>

        {pannello.tipo === 'elenco' && (
          <ElencoPezzi pezzi={pezzi} onScegli={(id) => apriScheda(id, 'elenco')} onChiudi={chiudiElenco} />
        )}
        {schedaAperta && (
          <SchedaPezzo
            pezzo={schedaAperta}
            fase={pronta ? (fasiPezzi[schedaAperta.id] ?? null) : null}
            onMostra={scegliFase}
            onChiudi={chiudiScheda}
          />
        )}

        <section
          aria-labelledby="macchina-messaggio"
          className="macchina-sezione"
          // Durante la lezione il messaggio torna solo con «ora prova tu», quando la tastiera cifra di nuovo.
          hidden={pannello.tipo !== 'messaggio' || lezioneInScena}
        >
          <div className="macchina-intestazione">
            <h2 id="macchina-messaggio">{t('machine3d.message')}</h2>
            <p className="macchina-finestrelle">
              <span className="sr-only">{t('machine3d.windows')}: </span>
              <span data-finestrelle>{stato ? windowLetters(stato).split('').join(' ') : ''}</span>
            </p>
          </div>
          <dl className="macchina-nastro">
            <div>
              <dt>{t('machine3d.typed')}</dt>
              <dd data-nastro="tasti">{nastro(tasti)}</dd>
            </div>
            <div>
              <dt>{t('machine3d.lit')}</dt>
              <dd data-nastro="lampade">{nastro(lampade)}</dd>
            </div>
          </dl>
          <div className="macchina-azioni">
            <button
              type="button"
              className="btn"
              disabled={session.presses.length === 0}
              onClick={() => store.getState().reset()}
            >
              {t('machine3d.reset')}
            </button>
            <a className="btn" href={alSimulatore}>
              {t('machine3d.openInSimulator')}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
