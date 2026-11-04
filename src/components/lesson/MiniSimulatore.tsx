import { useState } from 'react';
import { decodeConfigOrThrow } from '@/engine';
import { t } from '@/i18n';
import { Issues, Keyboard, Lampboard, Windows } from '@/components/simulator/Machine.tsx';
import { createSession } from '@/components/simulator/session.ts';
import { createSimulatorStore, SimulatorContext, useKeyCapture } from '@/components/simulator/store.ts';
import Tape from '@/components/simulator/Tape.tsx';
import TracePanel from '@/components/simulator/TracePanel.tsx';
import SchematicView from '@/components/views/schematic/SchematicView.tsx';

interface Props {
  /** Configurazione nel formato dei link condivisibili, per esempio `v=1&m=I&w=I-II-III&r=AAA&p=AAA&u=B`. */
  config: string;
  /** Mostra lo schema del circuito sotto la tastiera. */
  schema?: boolean;
  /** Mostra il nastro con le lettere digitate. */
  nastro?: boolean;
  /** Mostra i comandi della traccia passo-passo, sopra lo schema. */
  traccia?: boolean;
  didascalia?: string;
}

/**
 * Simulatore ridotto da inserire nelle lezioni. Ogni istanza ha il suo stato; la tastiera del
 * computer agisce solo quando il focus è dentro il simulatore (per esempio dopo un clic su un tasto).
 */
export default function MiniSimulatore({ config, schema = false, nastro = true, traccia = false, didascalia }: Props) {
  // Una configurazione sbagliata in una lezione fa fallire la build, invece di arrivare al lettore.
  const [store] = useState(() => createSimulatorStore(createSession(decodeConfigOrThrow(config))));
  const keys = useKeyCapture(store);

  return (
    <SimulatorContext value={store}>
      <figure className="my-8 font-sans text-base">
        <div
          ref={keys}
          role="group"
          aria-label={t('sim.title')}
          className="flex flex-col gap-5 rounded-xl border border-border bg-surface px-2 py-5 sm:px-4"
        >
          <Issues />
          <Windows />
          <Lampboard />
          <Keyboard />
          {nastro && <Tape heading={false} />}
          {traccia && <TracePanel heading={false} />}
          {schema && <SchematicView heading={false} />}
        </div>
        <figcaption className="mt-2 text-sm text-text-muted">
          {didascalia ? `${didascalia} ` : ''}
          {t('lesson.mini.hint')}
        </figcaption>
      </figure>
    </SimulatorContext>
  );
}
