import { describe, expect, it } from 'vitest';
import { encipherWith, prepareText } from '@/engine';
import { EXERCISES, exerciseById, isCorrect, normalizeAnswer } from './catalog.ts';
import { loadProgress, markSolved } from './progress.ts';
import { createRng, isSeed } from './random.ts';

const seeds = Array.from({ length: 150 }, (_, i) => i * 6_661 + 1);

describe('generatore con seme', () => {
  it('ripete la stessa sequenza con lo stesso seme', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
    expect(createRng(43)()).not.toBe(createRng(42)());
  });

  it('accetta solo semi interi da 1 a 999 999', () => {
    expect(isSeed(1)).toBe(true);
    expect(isSeed(999_999)).toBe(true);
    expect(isSeed(0)).toBe(false);
    expect(isSeed(1.5)).toBe(false);
  });
});

describe('esercizi', () => {
  it('hanno identificativi unici e due livelli', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    expect(new Set(EXERCISES.map((e) => e.level))).toEqual(new Set([1, 2]));
  });

  for (const exercise of EXERCISES) {
    it(`${exercise.id}: varianti ripetibili, risposta accettata e soluzione presente`, () => {
      for (const seed of seeds) {
        const variant = exercise.generate(seed);
        expect(exercise.generate(seed)).toEqual(variant);
        expect(variant.answer.expected.length).toBeGreaterThan(0);
        expect(isCorrect(variant, variant.answer.expected)).toBe(true);
        expect(variant.solution.length).toBeGreaterThan(0);
        // La soluzione rivista nel simulatore deve essere una configurazione valida.
        if (variant.replay) expect(() => encipherWith(variant.replay!.config, variant.replay!.message)).not.toThrow();
      }
    });
  }

  it('cifra e decifra sono coerenti con il motore', () => {
    for (const seed of seeds) {
      const variant = exerciseById('cifra')!.generate(seed);
      const { config, message } = variant.replay!;
      expect(encipherWith(config, variant.answer.expected)).toBe(message);
    }
  });

  it('l’indicatore decifrato contiene due volte la chiave del messaggio', () => {
    for (const seed of seeds) {
      const variant = exerciseById('indicatore')!.generate(seed);
      const sheet = variant.blocks.find((b) => b.kind === 'key');
      const indicator = variant.blocks.find((b) => b.kind === 'message');
      if (sheet?.kind !== 'key' || indicator?.kind !== 'message') throw new Error('blocchi mancanti');
      const config = { ...variant.replay!.config, positions: sheet.sheet.positions ?? 'AAA' };
      const doubled = encipherWith(config, indicator.text);
      expect(doubled.slice(0, 3)).toBe(doubled.slice(3));
      expect(doubled.slice(0, 3)).toBe(variant.replay!.config.positions);
    }
  });

  it('il crittogramma impossibile ha una sola lettera cifrata in sé stessa', () => {
    for (const seed of seeds) {
      const variant = exerciseById('impossibile')!.generate(seed);
      const block = variant.blocks.find((b) => b.kind === 'compare');
      if (block?.kind !== 'compare') throw new Error('blocco mancante');
      const same = [...block.plain].flatMap((letter, i) => (block.cipher[i] === letter ? [i + 1] : []));
      expect(same).toEqual([Number(variant.answer.expected)]);
    }
  });

  it('le posizioni previste comprendono spesso un doppio passo', () => {
    const doubles = seeds.filter((seed) => {
      const variant = exerciseById('posizioni')!.generate(seed);
      const path = variant.solution[0]?.match(/[A-Z]{3}/g) ?? [];
      return path.some((pos, i) => i > 0 && pos[1] !== path[i - 1]?.[1] && pos[0] !== path[i - 1]?.[0]);
    });
    expect(doubles.length).toBeGreaterThan(seeds.length / 3);
  });

  it('normalizza le risposte', () => {
    expect(normalizeAnswer('letters', 'Convoglio  in arrivo!')).toBe(prepareText('CONVOGLIOINARRIVO'));
    expect(normalizeAnswer('number', ' 007 ')).toBe('7');
    expect(normalizeAnswer('number', 'sette')).toBe('sette');
  });
});

describe('progressi', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  };

  it('ricorda le varianti risolte senza ripeterle', () => {
    const storage = memory();
    markSolved('cifra', 12, storage);
    markSolved('cifra', 12, storage);
    markSolved('decifra', 7, storage);
    expect(loadProgress(storage)).toEqual({ cifra: [12], decifra: [7] });
  });

  it('riparte da zero con dati rovinati o senza archiviazione', () => {
    const storage = memory();
    storage.setItem('enigma-esercizi', '{non è json');
    expect(loadProgress(storage)).toEqual({});
    expect(loadProgress(null)).toEqual({});
    const throwing = {
      getItem: () => {
        throw new Error('bloccato');
      },
      setItem: () => {
        throw new Error('bloccato');
      },
    };
    expect(markSolved('cifra', 1, throwing)).toEqual({ cifra: [1] });
  });
});
