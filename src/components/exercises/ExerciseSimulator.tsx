import { useState, type ReactNode } from 'react';
import { defaultConfig, type MachineConfig } from '@/engine';
import { t } from '@/i18n';
import ConfigPanel from '@/components/simulator/ConfigPanel.tsx';
import { Issues, Keyboard, Lampboard, Windows } from '@/components/simulator/Machine.tsx';
import { createSession } from '@/components/simulator/session.ts';
import { createSimulatorStore, handlePhysicalKey, SimulatorContext } from '@/components/simulator/store.ts';
import Tape, { TextInput } from '@/components/simulator/Tape.tsx';

interface Props {
  /** Configurazione di partenza: quella di base, se impostare la chiave fa parte dell’esercizio. */
  initial?: MachineConfig;
  title?: string;
  hint?: string;
  /** Aggiunge il campo per digitare un testo intero. */
  textInput?: boolean;
  /** Contenuto mostrato sotto il nastro, dentro lo stesso store (per esempio una verifica). */
  children?: ReactNode;
}

/** Simulatore completo da impostare a mano, accanto a un esercizio o a una missione. */
export default function ExerciseSimulator({
  initial,
  title = t('ex.simulator'),
  hint = t('ex.simulatorHint'),
  textInput = false,
  children,
}: Props) {
  const [store] = useState(() => createSimulatorStore(createSession(initial ?? defaultConfig('I'))));
  return (
    <SimulatorContext value={store}>
      <section aria-labelledby="exercise-simulator" className="flex flex-col gap-3">
        <h2 id="exercise-simulator" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="text-sm text-text-muted">{hint}</p>
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <ConfigPanel />
          {/* Il contenitore raccoglie i tasti premuti mentre il focus è su uno dei suoi controlli. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div className="flex min-w-0 flex-col gap-5" onKeyDown={(event) => handlePhysicalKey(store, event)}>
            <Issues />
            <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface px-2 py-5">
              <Windows />
              <Lampboard />
              <Keyboard />
            </div>
            {children}
            <Tape />
            {textInput && <TextInput />}
          </div>
        </div>
      </section>
    </SimulatorContext>
  );
}
