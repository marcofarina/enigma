import { ALPHABET, toLetter, type MachineConfig } from '@/engine';
import { int, shuffle, type Rng } from './random.ts';
import type { KeySheet } from './types.ts';

/** Chiavi casuali per gli esercizi e per le schede: sempre Enigma I con riflettore B. */

export const MILITARY_ROTORS = ['I', 'II', 'III', 'IV', 'V'];

export const randomLetters = (rng: Rng, count: number) =>
  Array.from({ length: count }, () => toLetter(int(rng, 0, 25))).join('');

export function randomPairs(rng: Rng, count: number): string[] {
  const letters = shuffle(rng, [...ALPHABET]).slice(0, 2 * count);
  const pairs: string[] = [];
  for (let i = 0; i < letters.length; i += 2) pairs.push([letters[i], letters[i + 1]].sort().join(''));
  return pairs.sort();
}

/** Chiave casuale per l’Enigma I con riflettore B. */
export function randomKey(rng: Rng, cables: number, rings = true): MachineConfig {
  return {
    model: 'I',
    rotors: shuffle(rng, MILITARY_ROTORS).slice(0, 3),
    rings: rings ? randomLetters(rng, 3) : 'AAA',
    positions: randomLetters(rng, 3),
    reflector: 'B',
    plugboard: randomPairs(rng, cables),
  };
}

export const sheetOf = (config: MachineConfig, extra: Partial<KeySheet> = {}): KeySheet => ({
  rotors: [...config.rotors],
  rings: config.rings,
  plugboard: [...(config.plugboard ?? [])],
  ...extra,
});
