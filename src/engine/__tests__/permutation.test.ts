import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createMachine,
  cycles,
  cycleType,
  defaultConfig,
  initialState,
  stageMap,
  toIndex,
  toLetter,
} from '../index.ts';

const letters = (map: number[][]) => map.map((cycle) => cycle.map(toLetter).join(''));
const wiring = (text: string) => [...text].map(toIndex);

describe('cicli di una permutazione', () => {
  it('scompone il rotore I e il riflettore B', () => {
    const rotorI = wiring('EKMFLGDQVZNTOWYHXUSPAIBRCJ');
    expect(letters(cycles(rotorI))).toEqual(['AELTPHQXRU', 'BKNW', 'CMOY', 'DFG', 'IV', 'JZ', 'S']);
    expect(cycleType(rotorI)).toEqual([10, 4, 4, 3, 2, 2, 1]);
    expect(cycleType(wiring('YRUHQSLDPXNGOKMIEBFZCWVJAT'))).toEqual(Array(13).fill(2));
  });

  it('un rotore conserva la struttura in cicli in ogni posizione e con ogni anello (coniugio)', () => {
    const machine = createMachine(defaultConfig('I'));
    const reference = cycleType(
      stageMap(machine, initialState(machine), { kind: 'rotor', direction: 'forward', slot: 2 }),
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 25 }), fc.integer({ min: 0, max: 25 }), (position, ring) => {
        const shifted = createMachine({ ...defaultConfig('I'), rings: `AA${toLetter(ring)}` });
        const map = stageMap(
          shifted,
          { positions: [0, 0, position], reflectorPosition: 0 },
          {
            kind: 'rotor',
            direction: 'forward',
            slot: 2,
          },
        );
        expect(cycleType(map)).toEqual(reference);
      }),
    );
  });
});
