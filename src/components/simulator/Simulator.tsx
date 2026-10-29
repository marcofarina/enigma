import { useEffect, useState } from 'react';
import { defaultConfig, encodeConfig } from '@/engine';
import { t } from '@/i18n';
import SchematicView from '@/components/views/schematic/SchematicView.tsx';
import ConfigPanel from './ConfigPanel.tsx';
import { Issues, Keyboard, Lampboard, Windows } from './Machine.tsx';
import { createSession, pressAll } from './session.ts';
import { readSharedLink } from './share.ts';
import ShareLink from './ShareLink.tsx';
import { createSimulatorStore, handlePhysicalKey, SimulatorContext } from './store.ts';
import Tape, { TextInput } from './Tape.tsx';

/** Apre la configurazione del link (con l’eventuale messaggio già digitato) o quella di base. */
function initialStore() {
  const link = readSharedLink(window.location.search);
  const session =
    link.kind === 'ok' ? pressAll(createSession(link.config), link.message) : createSession(defaultConfig('I'));
  return { store: createSimulatorStore(session), invalidLink: link.kind === 'invalid' };
}

export default function Simulator() {
  const [{ store, invalidLink }] = useState(initialStore);

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

  return (
    <SimulatorContext value={store}>
      {invalidLink && (
        <p role="status" className="mb-4 rounded-lg border-2 border-accent bg-surface px-4 py-3">
          {t('sim.share.invalid')}
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <ConfigPanel />
        </div>
        <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
          <Issues />
          <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface px-2 py-5">
            <Windows />
            <Lampboard />
            <Keyboard />
          </div>
          <Tape />
          <SchematicView />
          <TextInput />
          <ShareLink />
        </div>
      </div>
    </SimulatorContext>
  );
}
