import { describe, expect, it } from 'vitest';
import { plugboardSettings } from '../index.ts';

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
