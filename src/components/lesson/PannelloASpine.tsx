import { useState } from 'react';
import { plugboardSettings } from '@/engine';
import { t, tf } from '@/i18n';
import { parsePairs } from '@/components/simulator/config-edit.ts';
import PairEditor from '@/components/simulator/PairEditor.tsx';

interface Props {
  /** Coppie iniziali, per esempio `AZ BN GI`. */
  coppie?: string;
}

/** Raggruppa le cifre a tre a tre con uno spazio che non va a capo, come nel testo delle lezioni. */
const groupDigits = (value: bigint) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * Pannello a spine da solo: si collegano i cavi e si vede quali lettere si scambiano e quante
 * configurazioni diverse ammette lo stesso numero di cavi.
 */
export default function PannelloASpine({ coppie = '' }: Props) {
  const [pairs, setPairs] = useState(() => parsePairs(coppie).pairs);
  const cables = pairs.length;

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <PairEditor
          label={t('sim.plugboard.label')}
          gridLabel={t('sim.plugboard.grid')}
          hint={t('sim.plugboard.hint')}
          pairs={pairs}
          onChange={setPairs}
          status={tf('sim.plugboard.count', { count: cables })}
        />
        <p className="rounded-md bg-surface-muted px-3 py-2" aria-live="polite">
          {cables === 0
            ? t('lesson.plugboard.none')
            : tf(cables === 1 ? 'lesson.plugboard.countOne' : 'lesson.plugboard.count', {
                cables,
                settings: groupDigits(plugboardSettings(cables)),
                free: 26 - 2 * cables,
              })}
        </p>
      </div>
    </figure>
  );
}
