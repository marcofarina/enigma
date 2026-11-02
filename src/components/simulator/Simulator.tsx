import { useEffect, useRef, useState } from 'react';
import { defaultConfig, encodeConfig } from '@/engine';
import { t } from '@/i18n';
import MachineView from '@/components/views/machine/MachineView.tsx';
import SchematicView from '@/components/views/schematic/SchematicView.tsx';
import ConfigPanel from './ConfigPanel.tsx';
import { Issues, Keyboard, Lampboard, Windows } from './Machine.tsx';
import { createSession, pressAll } from './session.ts';
import { readSharedLink } from './share.ts';
import ShareLink from './ShareLink.tsx';
import { createSimulatorStore, handlePhysicalKey, SimulatorContext } from './store.ts';
import Tape, { TextInput } from './Tape.tsx';
import TracePanel from './TracePanel.tsx';

/** Apre la configurazione del link (con l’eventuale messaggio già digitato) o quella di base. */
function initialStore() {
  const link = readSharedLink(window.location.search);
  const session =
    link.kind === 'ok' ? pressAll(createSession(link.config), link.message) : createSession(defaultConfig('I'));
  return { store: createSimulatorStore(session), invalidLink: link.kind === 'invalid' };
}

type View = 'schematic' | 'machine' | 'both';
const VIEWS: View[] = ['schematic', 'machine', 'both'];
const VIEW_KEY = 'enigma.simulatore.vista';

/** La vista scelta l’ultima volta in questo browser (una comodità: se lo storage manca, si parte dallo schema). */
function savedView(): View {
  try {
    const value = window.localStorage.getItem(VIEW_KEY);
    return VIEWS.includes(value as View) ? (value as View) : 'schematic';
  } catch {
    return 'schematic';
  }
}

function ViewSwitcher({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const labels: Record<View, string> = {
    schematic: t('sim.view.schematic'),
    machine: t('sim.view.machine'),
    both: t('sim.view.both'),
  };
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{t('sim.view.label')}</legend>
      <span aria-hidden="true" className="me-1 text-sm text-text-muted">
        {t('sim.view.label')}
      </span>
      {VIEWS.map((option) => (
        <label
          key={option}
          className="flex min-h-11 cursor-pointer items-center rounded-md border-2 border-border bg-surface px-3 font-semibold has-checked:border-accent has-checked:bg-surface-muted has-focus-visible:outline-3 has-focus-visible:outline-focus"
        >
          <input
            type="radio"
            name="vista-simulatore"
            value={option}
            checked={view === option}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {labels[option]}
        </label>
      ))}
    </fieldset>
  );
}

export default function Simulator() {
  const [{ store, invalidLink }] = useState(initialStore);
  const [view, setView] = useState<View>(savedView);
  const changeView = (next: View) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Senza storage la scelta vale solo per questa visita.
    }
  };

  // Tastiera fisica: lettere e Backspace, ma non mentre si scrive in un campo del pannello.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handlePhysicalKey(store, event);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store]);

  // L’indirizzo della pagina segue la configurazione, così ricaricando non la si perde.
  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (state.session.config === previous.session.config || !state.session.machine) return;
        window.history.replaceState(null, '', `?${encodeConfig(state.session.config)}${window.location.hash}`);
      }),
    [store],
  );

  // Modalità LIM: schermo intero dove il browser lo consente, altrimenti un livello che copre la
  // pagina. Si esce con il pulsante, con Esc o uscendo dallo schermo intero.
  const rootRef = useRef<HTMLDivElement>(null);
  const [lim, setLim] = useState(false);
  const enterLim = () => {
    setLim(true);
    rootRef.current?.requestFullscreen?.().catch(() => undefined);
  };
  const exitLim = () => {
    setLim(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };
  useEffect(() => {
    if (!lim) return;
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setLim(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setLim(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [lim]);

  return (
    <SimulatorContext value={store}>
      <div
        ref={rootRef}
        data-lim={lim || undefined}
        className="lim:fixed lim:inset-0 lim:z-50 lim:overflow-auto lim:bg-bg lim:p-4 lim:text-lg lim:lg:p-8"
      >
        {invalidLink && (
          <p role="status" className="mb-4 rounded-lg border-2 border-accent bg-surface px-4 py-3">
            {t('sim.share.invalid')}
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          {lim && <p className="me-auto text-sm text-text-muted">{t('sim.lim.hint')}</p>}
          <button
            type="button"
            onClick={lim ? exitLim : enterLim}
            className="min-h-12 rounded-md border-2 border-border bg-surface px-4 font-semibold hover:border-accent"
          >
            {lim ? t('sim.lim.exit') : t('sim.lim.enter')}
          </button>
        </div>
        <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lim:block">
          <div className="order-2 lg:order-1 lim:hidden">
            <ConfigPanel />
          </div>
          <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
            <Issues />
            <div className="flex flex-col gap-6 lim:xl:grid lim:xl:grid-cols-[auto_minmax(0,1fr)] lim:xl:items-start">
              <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface px-2 py-5 lim:lg:[zoom:1.3]">
                <Windows />
                <Lampboard />
                <Keyboard />
              </div>
              <div className="flex min-w-0 flex-col gap-6 lim:lg:[zoom:1.15]">
                <Tape />
                <TracePanel />
              </div>
            </div>
            <ViewSwitcher view={view} onChange={changeView} />
            {/* Lo schema si allarga con lo spazio: sulla lavagna lo si tiene entro un’altezza leggibile. */}
            <div
              className={
                view === 'both'
                  ? 'grid gap-6 xl:grid-cols-2 xl:items-start lim:mx-auto lim:w-full lim:max-w-6xl'
                  : 'lim:mx-auto lim:w-full lim:max-w-5xl'
              }
            >
              {view !== 'schematic' && <MachineView />}
              {view !== 'machine' && <SchematicView />}
            </div>
            <div className="lim:hidden">
              <TextInput />
            </div>
            <ShareLink />
          </div>
        </div>
      </div>
    </SimulatorContext>
  );
}
