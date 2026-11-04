import { useEffect, useState } from 'react';
import { defaultConfig, encodeConfig } from '@/engine';
import { t } from '@/i18n';
import Header from './bench/Header.tsx';
import BenchKeyboard from './bench/Keyboard.tsx';
import { PlugPanel, SharePanel, UkwDPanel, OptionsPanel } from './bench/Panels.tsx';
import Sheet from './bench/Sheet.tsx';
import { useBench } from './bench/ui.ts';
import Well, { useSignalMode } from './bench/Well.tsx';
import { createSession, pressAll } from './session.ts';
import { readSharedLink } from './share.ts';
import { createSimulatorStore, handlePhysicalKey, SimulatorContext } from './store.ts';

/** Apre la configurazione del link (con l’eventuale messaggio già digitato) o quella di base. */
function initialStore() {
  const link = readSharedLink(window.location.search);
  const session =
    link.kind === 'ok' ? pressAll(createSession(link.config), link.message) : createSession(defaultConfig('I'));
  return { store: createSimulatorStore(session), invalidLink: link.kind === 'invalid' };
}

/**
 * La home: il simulatore a schermata unica (docs/design.md). Intestazione con i controlli della
 * macchina, a sinistra lampade, tastiera e foglio, a destra il vano dello schema.
 */
export default function Simulator() {
  const [{ store, invalidLink }] = useState(initialStore);
  const [lim, setLim] = useState(false);
  const mode = useSignalMode();

  // Tastiera fisica: lettere e Backspace, ma non mentre si scrive in un campo. Esc chiude il
  // pannello aperto; qualunque tasto ferma «Digita».
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && useBench.getState().panel) {
        useBench.getState().closePanel();
        return;
      }
      if (store.getState().typing && event.key !== 'Tab') store.getState().stopTyping();
      handlePhysicalKey(store, event);
    };
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

  // Modalità LIM: contrasto da lavagna e schermo intero dove il browser lo consente. La griglia è
  // la stessa, scalata alla finestra. Si esce con lo stesso pulsante o uscendo dallo schermo intero.
  const toggleLim = () => {
    if (lim) {
      setLim(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      return;
    }
    setLim(true);
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  };
  useEffect(() => {
    if (!lim) return;
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setLim(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [lim]);

  return (
    <SimulatorContext value={store}>
      <div className="bench machine machine-paint" data-lim={lim || undefined} data-mode={mode}>
        <h1 className="sr-only">{t('bench.title')}</h1>
        <Header lim={lim} onLim={toggleLim} />
        <main id="contenuto" className="bench-main">
          <div className="bench-left">
            <BenchKeyboard />
            <Sheet invalidLink={invalidLink} />
          </div>
          <Well />
        </main>
        <PlugPanel />
        <UkwDPanel />
        <OptionsPanel />
        <SharePanel />
      </div>
    </SimulatorContext>
  );
}
