import { useState } from 'react';
import { decodeConfigOrThrow } from '@/engine';
import { t } from '@/i18n';
import { Issues, Keyboard, Lampboard, Windows } from '@/components/simulator/Machine.tsx';
import { createSession } from '@/components/simulator/session.ts';
import { createSimulatorStore, handlePhysicalKey, SimulatorContext } from '@/components/simulator/store.ts';
import Tape from '@/components/simulator/Tape.tsx';
import SchematicView from '@/components/views/schematic/SchematicView.tsx';

interface Props {
  /** Configurazione nel formato dei link condivisibili, per esempio `v=1&m=I&w=I-II-III&r=AAA&p=AAA&u=B`. */
  config: string;
  /** Mostra lo schema del circuito sotto la tastiera. */
  schema?: boolean;
  /** Mostra il nastro con le lettere digitate. */
  nastro?: boolean;
  didascalia?: string;
}

/**
 * Simulatore ridotto da inserire nelle lezioni. Ogni istanza ha il suo stato; la tastiera del
 * computer agisce solo quando il focus è dentro il simulatore (per esempio dopo un clic su un tasto).
 */
export default function MiniSimulatore({ config, schema = false, nastro = true, didascalia }: Props) {
  // Una configurazione sbagliata in una lezione fa fallire la build, invece di arrivare al lettore.
  const [store] = useState(() => createSimulatorStore(createSession(decodeConfigOrThrow(config))));

  return (
    <SimulatorContext value={store}>
      <figure className="my-8 font-sans text-base">
        {/* Il contenitore raccoglie i tasti premuti mentre il focus è su uno dei suoi controlli. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="flex flex-col gap-5 rounded-xl border border-border bg-surface px-2 py-5 sm:px-4"
          onKeyDown={(event) => handlePhysicalKey(store, event)}
        >
          <Issues />
          <Windows />
          <Lampboard />
          <Keyboard />
          {nastro && <Tape heading={false} />}
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
