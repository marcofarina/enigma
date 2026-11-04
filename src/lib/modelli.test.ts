import { describe, expect, it } from 'vitest';
import { MODEL_IDS, MODELS } from '@/engine';
import {
  entryWheel,
  family,
  hasRewirableReflector,
  notchSummary,
  reflectorKind,
  rotorCount,
  timelineBars,
  undatedModels,
  yearOffset,
} from './modelli.ts';

describe('dati della lezione «Modelli a confronto»', () => {
  it('divide i modelli in tre famiglie', () => {
    const byFamily = (f: string) => MODEL_IDS.filter((id) => family(MODELS[id]) === f);
    expect(byFamily('military')).toEqual(['I', 'M3', 'M4', 'Norway']);
    expect(byFamily('commercial')).toEqual(['D', 'K', 'SwissK', 'KD', 'Railway', 'T']);
    expect(byFamily('counter')).toEqual(['A865', 'G31', 'G111', 'G260', 'G312']);
  });

  it('riassume le tacche per rotore', () => {
    expect(notchSummary(MODELS.I)).toBe('1');
    expect(notchSummary(MODELS.M3)).toBe('1 (I–V); 2 (VI–VIII)');
    expect(notchSummary(MODELS.M4)).toBe('1 (I–V); 2 (VI–VIII)');
    expect(notchSummary(MODELS.T)).toBe('5');
    expect(notchSummary(MODELS.KD)).toBe('9');
    expect(notchSummary(MODELS.G31)).toBe('17 (I); 15 (II); 11 (III)');
    expect(notchSummary(MODELS.G111)).toBe('17 (I); 15 (II); 7 (V)');
  });

  it('conta i rotori e riconosce riflettore e ruota d’ingresso', () => {
    expect(rotorCount(MODELS.M4)).toEqual({ regular: 8, thin: 2 });
    expect(rotorCount(MODELS.K)).toEqual({ regular: 3, thin: 0 });
    expect(reflectorKind(MODELS.I)).toBe('fixed');
    expect(reflectorKind(MODELS.K)).toBe('settable');
    expect(reflectorKind(MODELS.G31)).toBe('moving');
    expect(hasRewirableReflector(MODELS.I)).toBe(true);
    expect(hasRewirableReflector(MODELS.M3)).toBe(false);
    expect(entryWheel(MODELS.I)).toBe('alphabetic');
    expect(entryWheel(MODELS.K)).toBe('keyboard');
    expect(entryWheel(MODELS.T)).toBe('own');
  });

  it('mette sulla linea del tempo solo i modelli con anni documentati', () => {
    const bars = timelineBars();
    expect(bars).toHaveLength(12);
    expect(bars[0]?.id).toBe('D');
    expect(undatedModels().map((m) => m.id)).toEqual(['G111', 'G260', 'G312']);
    const norway = bars.find((bar) => bar.id === 'Norway');
    expect(norway?.open).toBe(true);
    expect((norway?.left ?? 0) + (norway?.width ?? 0)).toBeCloseTo(100);
    const enigmaI = bars.find((bar) => bar.id === 'I');
    expect(enigmaI?.left).toBeCloseTo(yearOffset(1930));
    expect(enigmaI?.width).toBeCloseTo(yearOffset(1946) - yearOffset(1930));
  });
});
