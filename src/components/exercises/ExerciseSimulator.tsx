import { useState } from 'react';
import { defaultConfig } from '@/engine';
import { t } from '@/i18n';
import ConfigPanel from '@/components/simulator/ConfigPanel.tsx';
import { Issues, Keyboard, Lampboard, Windows } from '@/components/simulator/Machine.tsx';
import { createSession } from '@/components/simulator/session.ts';
import { createSimulatorStore, handlePhysicalKey, SimulatorContext } from '@/components/simulator/store.ts';
import Tape from '@/components/simulator/Tape.tsx';

/**
 * Simulatore completo da impostare a mano, accanto all’esercizio: parte sempre dalla
 * configurazione di base, perché impostare la chiave fa parte dell’esercizio.
 */
export default function ExerciseSimulator() {
  const [store] = useState(() => createSimulatorStore(createSession(defaultConfig('I'))));
  return (
    <SimulatorContext value={store}>
      <section aria-labelledby="exercise-simulator" className="flex flex-col gap-3">
        <h2 id="exercise-simulator" className="text-xl font-semibold">
          {t('ex.simulator')}
        </h2>
        <p className="text-sm text-text-muted">{t('ex.simulatorHint')}</p>
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
            <Tape />
          </div>
        </div>
      </section>
    </SimulatorContext>
  );
}
