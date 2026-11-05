import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { groupLetters, windowLetters } from '@/engine';
import { t, tf, type UiKey } from '@/i18n';
import { modello3d } from '@/lib/modello3d';
import { url } from '@/lib/url';
import { currentState } from '../simulator/session.ts';
import { FASI, posizioneSelettore } from './geometria.ts';
import { createSimulatorStore, useKeyCapture } from '../simulator/store.ts';
import { queryPerIlSimulatore, sessioneDallaQuery } from './configurazione.ts';

/** three.js, React Three Fiber, drei e il `.glb` arrivano solo con questo import, dopo il pulsante. */
const Scena = lazy(() => import('./Scena.tsx'));

/**
 * Peso indicativo di ciò che la vista scarica (modello e libreria), da ricontrollare quando il modello
 * cambia: dalla 4l il `.glb` con l’esterno di ASHISH pesa circa 5,4 MB (D23).
 */
const PESO_VISTA = '6 MB';

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

/** Il testo del selettore: la fase in parole, oppure «da … a …» quando sta a metà fra due. */
function testoSelettore(valore: number): string {
  const posizione = posizioneSelettore(valore);
  const fase = (n: number) => t(`machine3d.phase.${n}` as UiKey);
  return 'fase' in posizione
    ? fase(posizione.fase)
    : tf('machine3d.phaseBetween', { from: fase(posizione.da), to: fase(posizione.a) });
}

/**
 * Un tasto rifiutato perché la macchina è smontata: quante volte, a quale tasto (`pulse`) era la
 * macchina, e se il selettore è già tornato a zero (`ritirato`: il messaggio visibile sparisce, ma
 * l'annuncio resta com'è e non si ripete).
 */
type Blocco = { n: number; pulse: number; ritirato: boolean } | null;

function initialStore() {
  const { session, avviso } = sessioneDallaQuery(window.location.search);
  return { store: createSimulatorStore(session), avviso };
}

/**
 * La pagina `/macchina/`: l’anteprima statica e, dopo «Avvia la vista 3D», la macchina in 3D. La
 * configurazione viene dalla query come nella home; lo store è quello del simulatore, quindi il
 * motore è uno solo.
 */
export default function Macchina() {
  const [{ store, avviso }] = useState(initialStore);
  const [fase, setFase] = useState<Fase>('anteprima');
  const [ridotto] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [smontaggio, setSmontaggio] = useState(0);
  const [blocco, setBlocco] = useState<Blocco>(null);
  const smontata = smontaggio > 0;
  const session = useStore(store, (s) => s.session);
  const pulse = useStore(store, (s) => s.pulse);
  // A macchina smontata la tastiera non cifra: né quella fisica né i tasti del modello. Il rifiuto si annuncia.
  const rifiuta = useCallback(() => setBlocco((b) => ({ n: (b?.n ?? 0) + 1, pulse, ritirato: false })), [pulse]);
  const palco = useKeyCapture(store, () => {
    if (!smontata) return false;
    rifiuta();
    return true;
  });
  const attiva = fase === 'caricamento' || fase === 'pronta';

  const muoviSelettore = (valore: number) => {
    setSmontaggio(valore);
    if (valore === 0) setBlocco((b) => (b ? { ...b, ritirato: true } : b));
  };

  const avvia = () => setFase(haWebGL2() ? 'caricamento' : 'senza-webgl');
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

  return (
    <div className="macchina">
      {avviso.tipo === 'link-non-valido' && <Avviso>{t('sim.share.invalid')}</Avviso>}
      {avviso.tipo === 'altro-modello' && (
        <Avviso>
          {tf('machine3d.otherModel', { model: avviso.modello })}{' '}
          <a href={`${url()}?${avviso.query}`}>{t('machine3d.otherModelLink')}</a>
        </Avviso>
      )}

      <div
        ref={palco}
        className="macchina-palco machine"
        // La scena riceve le lettere come la tastiera della macchina: il lettore di schermo le lascia passare.
        role={attiva ? 'application' : undefined}
        tabIndex={attiva ? 0 : undefined}
        aria-label={attiva ? t('machine3d.sceneLabel') : undefined}
        data-fase={fase}
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
                smontaggio={smontaggio}
                ridotto={ridotto}
                bloccata={smontata}
                onBloccata={rifiuta}
                onPronto={onPronto}
              />
            </Suspense>
          </Confine>
        )}
        {fase === 'anteprima' && (
          <div className="macchina-avvio">
            <button type="button" className="macchina-pulsante" onClick={avvia}>
              {t('machine3d.start')}
            </button>
            <span>{tf('machine3d.startNote', { size: PESO_VISTA })}</span>
          </div>
        )}
        {fase === 'caricamento' && (
          <p className="macchina-stato" role="status">
            {t('machine3d.loading')}
          </p>
        )}
      </div>

      {fase === 'pronta' && (
        <div className="macchina-smontaggio">
          <label htmlFor="smontaggio">{t('machine3d.explode.label')}</label>
          <input
            id="smontaggio"
            type="range"
            min={0}
            max={FASI}
            step="any"
            value={smontaggio}
            aria-valuetext={testoSelettore(smontaggio)}
            onChange={(event) => muoviSelettore(Number(event.target.value))}
            onKeyDown={(event) => {
              // Con `step="any"` i tasti freccia non hanno un passo: ogni pressione va alla fase vicina.
              const verso = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
              if (verso === undefined) return;
              event.preventDefault();
              const vicina = verso > 0 ? Math.floor(smontaggio + 0.01) + 1 : Math.ceil(smontaggio - 0.01) - 1;
              muoviSelettore(Math.min(Math.max(vicina, 0), FASI));
            }}
          />
          <span className="macchina-fase" aria-hidden="true">
            {testoSelettore(smontaggio)}
          </span>
          <button type="button" className="btn" disabled={!smontata} onClick={() => muoviSelettore(0)}>
            {t('machine3d.reassemble')}
          </button>
        </div>
      )}
      {smontata && blocco && !blocco.ritirato && (
        <p className="macchina-avviso" data-blocco>
          {t('machine3d.locked')}
        </p>
      )}

      {(fase === 'senza-webgl' || fase === 'errore') && (
        <Avviso>
          {t(fase === 'errore' ? 'machine3d.error' : 'machine3d.noWebgl')}{' '}
          <a href={alSimulatore}>{t('machine3d.toSimulator')}</a>
        </Avviso>
      )}

      {/* Annuncio per chi usa un lettore di schermo, e appiglio per i test: una riga nuova a ogni tasto. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true" data-annuncio>
        {blocco && blocco.pulse === pulse ? (
          <span key={`blocco-${blocco.n}`}>{t('machine3d.locked')}</span>
        ) : (
          ultimo && pulse > 0 && <span key={pulse}>{tf('machine3d.live', { letter: ultimo.output })}</span>
        )}
      </p>

      <dl className="macchina-nastro">
        <div>
          <dt>{t('machine3d.windows')}</dt>
          <dd>{stato ? windowLetters(stato).split('').join(' ') : ''}</dd>
        </div>
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
    </div>
  );
}
