import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { groupLetters, windowLetters } from '@/engine';
import { t, tf } from '@/i18n';
import { modello3d } from '@/lib/modello3d';
import { url } from '@/lib/url';
import { currentState } from '../simulator/session.ts';
import { createSimulatorStore, useKeyCapture } from '../simulator/store.ts';
import { queryPerIlSimulatore, sessioneDallaQuery } from './configurazione.ts';

/** three.js, React Three Fiber, drei e il `.glb` arrivano solo con questo import, dopo il pulsante. */
const Scena = lazy(() => import('./Scena.tsx'));

/** Peso indicativo di ciò che la vista scarica (modello e libreria), da ricontrollare quando il modello cambia. */
const PESO_VISTA = '900 KB';

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
  const palco = useKeyCapture(store);
  const session = useStore(store, (s) => s.session);
  const pulse = useStore(store, (s) => s.pulse);
  const attiva = fase === 'caricamento' || fase === 'pronta';

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
              <Scena store={store} ridotto={ridotto} onPronto={onPronto} />
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

      {(fase === 'senza-webgl' || fase === 'errore') && (
        <Avviso>
          {t(fase === 'errore' ? 'machine3d.error' : 'machine3d.noWebgl')}{' '}
          <a href={alSimulatore}>{t('machine3d.toSimulator')}</a>
        </Avviso>
      )}

      {/* Annuncio per chi usa un lettore di schermo, e appiglio per i test: una riga nuova a ogni tasto. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true" data-annuncio>
        {ultimo && pulse > 0 && <span key={pulse}>{tf('machine3d.live', { letter: ultimo.output })}</span>}
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
