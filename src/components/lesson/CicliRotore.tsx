import { useState } from 'react';
import { ALPHABET, createMachine, cycles, defaultConfig, stageMap, toLetter } from '@/engine';
import { t, tf } from '@/i18n';

const ROTORS = ['I', 'II', 'III', 'IV', 'V'] as const;

interface Props {
  rotore?: (typeof ROTORS)[number];
}

/**
 * Cicli della sostituzione di un rotore, vista dai contatti fissi. Girando il rotore i cicli
 * cambiano lettere ma non lunghezze: la nuova sostituzione è coniugata della precedente.
 */
export default function CicliRotore({ rotore = 'I' }: Props) {
  const [rotor, setRotor] = useState<string>(rotore);
  const [position, setPosition] = useState(0);
  // Il rotore scelto va a destra; gli altri due servono solo a completare una configurazione valida.
  const others = ROTORS.filter((name) => name !== rotor).slice(0, 2);
  const machine = createMachine({ ...defaultConfig('I'), rotors: [...others, rotor] });
  const map = stageMap(
    machine,
    { positions: [0, 0, position], reflectorPosition: 0 },
    {
      kind: 'rotor',
      direction: 'forward',
      slot: 2,
    },
  );
  const parts = cycles(map).sort((a, b) => b.length - a.length);
  const lengths = parts.map((cycle) => cycle.length).join(', ');
  const select = 'rounded-md border border-border bg-surface px-2 py-2 font-mono';

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            {t('lesson.cycles.rotor')}
            <select className={select} value={rotor} onChange={(e) => setRotor(e.target.value)}>
              {ROTORS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            {t('lesson.rotor.position')}
            <select className={select} value={position} onChange={(e) => setPosition(Number(e.target.value))}>
              {[...ALPHABET].map((letter, i) => (
                <option key={letter} value={i}>
                  {letter}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="flex flex-wrap gap-x-1 gap-y-2 font-mono text-lg">
          {parts.map((cycle) => (
            <span key={cycle[0]} className="rounded-md bg-surface-muted px-1.5">
              ({cycle.map(toLetter).join('')})
            </span>
          ))}
        </p>
        <p aria-live="polite" className="text-sm text-text-muted">
          {tf('lesson.cycles.summary', { rotor, position: toLetter(position), count: parts.length, lengths })}
        </p>
      </div>
    </figure>
  );
}
