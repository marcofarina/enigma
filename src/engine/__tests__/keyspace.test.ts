import { describe, expect, it } from 'vitest';
import { createMachine, defaultConfig, keySpace, log2, plugboardSettings, step } from '../index.ts';

describe('configurazioni del pannello a spine', () => {
  // Valori della tabella di Crypto Museum, ricalcolati da Olaf Ostwald.
  it.each([
    [0, 1n],
    [1, 325n],
    [6, 100_391_791_500n],
    [10, 150_738_274_937_250n],
    [11, 205_552_193_096_250n],
    [13, 7_905_853_580_625n],
  ])('con %i cavi', (cables, expected) => {
    expect(plugboardSettings(cables)).toBe(expected);
  });

  it('il massimo si ha con 11 cavi', () => {
    const counts = Array.from({ length: 14 }, (_, n) => plugboardSettings(n));
    const best = counts.reduce((max, value, n) => (value > (counts[max] ?? 0n) ? n : max), 0);
    expect(best).toBe(11);
  });

  it('la somma su tutti i numeri di cavi', () => {
    const total = Array.from({ length: 14 }, (_, n) => plugboardSettings(n)).reduce((a, b) => a + b, 0n);
    expect(total).toBe(532_985_208_200_576n);
  });

  it('rifiuta numeri di cavi impossibili', () => {
    expect(() => plugboardSettings(14)).toThrow(RangeError);
    expect(() => plugboardSettings(-1)).toThrow(RangeError);
  });
});

describe('spazio delle chiavi', () => {
  const enigmaI = { rotors: 5, reflectors: 1, thinRotors: 0, rings: 2, cables: 10, doubleStep: false };
  const m4 = { rotors: 8, reflectors: 2, thinRotors: 2, rings: 2, cables: 10, doubleStep: false };

  // I totali senza correzione coincidono con la pagina “How does an Enigma machine work?” di
  // Crypto Museum. Con la correzione del doppio passo la pagina sbaglia: per l’Enigma I scrive
  // 685 518 560 invece di 60 × 676 × 16 926 = 686 518 560; per la M4 toglie 650 posizioni una
  // volta sola, mentre si ripetono per ciascuna delle 26 posizioni del rotore sottile (verificato
  // contando gli stati raggiunti con `step`: 440 076).
  it.each([
    ['Enigma I', enigmaI, 107_458_687_327_250_619_360_000n],
    ['Enigma I senza le posizioni equivalenti', { ...enigmaI, doubleStep: true }, 103_484_623_446_804_960_360_000n],
    ['M4', m4, 62_583_939_499_390_760_715_264_000n],
    ['M4 senza le posizioni equivalenti', { ...m4, doubleStep: true }, 60_269_444_695_419_208_913_664_000n],
  ])('%s', (_, options, expected) => {
    expect(keySpace(options).total).toBe(expected);
  });

  it('elenca i fattori nell’ordine della tabella', () => {
    expect(keySpace(enigmaI).factors.map(({ id, value }) => [id, value])).toEqual([
      ['rotorOrder', 60n],
      ['reflector', 1n],
      ['thinRotor', 1n],
      ['rings', 676n],
      ['positions', 17_576n],
      ['plugboard', 150_738_274_937_250n],
    ]);
  });

  it('calcola il logaritmo in base 2 anche dei numeri enormi', () => {
    expect(log2(1n)).toBe(0);
    expect(log2(2n ** 100n)).toBeCloseTo(100, 10);
    expect(log2(keySpace(enigmaI).total)).toBeCloseTo(76.5, 1);
    expect(log2(keySpace(m4).total)).toBeCloseTo(85.7, 1);
  });
});

describe('posizioni iniziali distinte', () => {
  it('con rotori a una tacca il doppio passo ne rende equivalenti 650', () => {
    const machine = createMachine(defaultConfig('I'));
    const reached = new Set<string>();
    for (let i = 0; i < 26 ** 3; i++) {
      const positions = [Math.floor(i / 676), Math.floor(i / 26) % 26, i % 26];
      reached.add(step(machine, { positions, reflectorPosition: 0 }).state.positions.join());
    }
    expect(reached.size).toBe(17_576 - 650);
  });
});
