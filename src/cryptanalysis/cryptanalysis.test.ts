import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createMachine, encipherWith, initialState, toIndex, toLetter, type MachineConfig } from '@/engine';
import { createRng } from '@/exercises/random.ts';
import { buildMenu, crashes, menuLetters, menuLoops, runBombe } from './bombe.ts';
import { BOMBE_CIPHER, BOMBE_CRIB, BOMBE_KEY } from './example.ts';
import { chains, characteristic, indicatorProducts, intercepts, partialProduct } from './rejewski.ts';
import { machineMap, statesAfter } from './scrambler.ts';

const day: MachineConfig = { model: 'I', rotors: ['I', 'II', 'III'], rings: 'AAA', positions: 'KDT', reflector: 'A' };
const plugged: MachineConfig = { ...day, plugboard: ['AB', 'CO', 'DF', 'HU', 'JW', 'LZ'] };

describe('sostituzione completa della macchina', () => {
  it('coincide con la cifratura lettera per lettera', () => {
    const machine = createMachine(plugged);
    const [state] = statesAfter(machine, initialState(machine), 1);
    const map = machineMap(machine, state!);
    const expected = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((l) => toIndex(encipherWith(plugged, l)));
    expect(map).toEqual(expected);
  });
});

describe('metodo delle caratteristiche di Rejewski', () => {
  it('i cicli dei prodotti vanno a coppie di uguale lunghezza', () => {
    for (const lengths of characteristic(day)) {
      const counts = new Map<number, number>();
      for (const l of lengths) counts.set(l, (counts.get(l) ?? 0) + 1);
      for (const count of counts.values()) expect(count % 2).toBe(0);
      expect(lengths.reduce((a, b) => a + b, 0)).toBe(26);
    }
  });

  it('la caratteristica non dipende dal pannello a spine', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 17575 }), (n) => {
        const positions = [n / 676, (n / 26) % 26, n % 26].map((x) => toLetter(Math.floor(x))).join('');
        expect(characteristic({ ...plugged, positions })).toEqual(characteristic({ ...day, positions }));
      }),
      { numRuns: 50 },
    );
  });

  it('dagli indicatori si ricostruiscono i prodotti AD, BE, CF', () => {
    const indicators = intercepts(plugged, createRng(7), 300).map((i) => i.indicator);
    indicatorProducts(plugged).forEach((product, k) => {
      expect(partialProduct(indicators, k)).toEqual(product);
    });
  });

  it('gli indicatori sono la chiave cifrata due volte', () => {
    for (const { key, indicator } of intercepts(day, createRng(1), 5)) {
      expect(encipherWith(day, indicator)).toBe(key + key);
    }
  });

  it('separa i cicli completi dai tratti aperti', () => {
    const table: (number | null)[] = new Array<number | null>(26).fill(null);
    // A → B → A (ciclo), C → D (tratto aperto)
    table[0] = 1;
    table[1] = 0;
    table[2] = 3;
    expect(chains(table)).toEqual([
      { letters: [2, 3], closed: false },
      { letters: [0, 1], closed: true },
    ]);
  });
});

describe('crib, menu e Bombe', () => {
  it('trova le posizioni del crib in cui una lettera cifrerebbe sé stessa', () => {
    // XB su AB: la B resterebbe B. Sulle altre posizioni nessuna lettera coincide.
    expect(crashes('ABCDE', 'XB')).toEqual([1, -1, -1, -1]);
  });

  it('conta i loop come collegamenti − lettere + parti connesse', () => {
    const edges = buildMenu(BOMBE_CRIB, BOMBE_CIPHER);
    const letters = menuLetters(edges);
    // Parti connesse, con una ricerca a partire da ogni lettera non ancora visitata.
    const seen = new Set<number>();
    let parts = 0;
    for (const start of letters) {
      if (seen.has(start)) continue;
      parts++;
      const queue = [start];
      seen.add(start);
      while (queue.length > 0) {
        const x = queue.pop() as number;
        for (const { a, b } of edges) {
          const other = a === x ? b : b === x ? a : null;
          if (other !== null && !seen.has(other)) {
            seen.add(other);
            queue.push(other);
          }
        }
      }
    }
    expect(menuLoops(edges)).toHaveLength(edges.length - letters.length + parts);
    for (const loop of menuLoops(edges)) {
      // Ogni lettera del loop compare in due collegamenti.
      const degree = new Map<number, number>();
      for (const { a, b } of loop) for (const x of [a, b]) degree.set(x, (degree.get(x) ?? 0) + 1);
      for (const d of degree.values()) expect(d).toBe(2);
    }
  });

  it('si ferma sulla posizione vera e trova la compagna della lettera di prova', () => {
    expect(crashes(BOMBE_CIPHER, BOMBE_CRIB)[0]).toBe(-1);
    const edges = buildMenu(BOMBE_CRIB, BOMBE_CIPHER);
    const test = toLetter(menuLetters(edges)[0] ?? 0);
    const stops = runBombe({ key: BOMBE_KEY, edges, offset: 0 }, 0, 17576);
    const pair = BOMBE_KEY.plugboard.find((p) => p.includes(test)) ?? `${test}${test}`;
    const partner = pair[0] === test ? pair[1] : pair[0];
    expect(stops).toContainEqual({ positions: BOMBE_KEY.positions, partner: toIndex(partner ?? test) });
  }, 30_000);
});
