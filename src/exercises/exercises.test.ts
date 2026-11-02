import { describe, expect, it } from 'vitest';
import { ALPHABET, encipherWith, pairings, prepareText } from '@/engine';
import { EXERCISES, exerciseById, isCorrect, normalizeAnswer } from './catalog.ts';
import { matchingRightLetters, rotorOrders } from './math.ts';
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
  it('hanno identificativi unici e tre livelli', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    expect(new Set(EXERCISES.map((e) => e.level))).toEqual(new Set([1, 2, 3]));
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
    // Numeri grandi: niente perdita di precisione e separatori delle migliaia ammessi.
    expect(normalizeAnswer('number', '150 738 274 937 250')).toBe('150738274937250');
    expect(normalizeAnswer('number', '7.905.853.580.625')).toBe('7905853580625');
    expect(normalizeAnswer('number', '12345678901234567890')).toBe('12345678901234567890');
    expect(normalizeAnswer('number', '1.5')).toBe('1.5');
  });
});

describe('esercizi di matematica', () => {
  it('gli ordini dei rotori con un vincolo coincidono con le formule', () => {
    for (const n of [5, 8]) {
      const all = n * (n - 1) * (n - 2);
      expect(rotorOrders(n, 'destro', ['I', 'II', 'III'])).toHaveLength((n - 1) ** 2 * (n - 2));
      expect(rotorOrders(n, 'nessuno', ['I', 'II', 'III'])).toHaveLength(all - 3 * (n - 1) * (n - 2) + 3 * (n - 2) - 1);
    }
    expect(rotorOrders(8, 'navale')).toHaveLength(336 - 60);
  });

  it('lo spazio delle chiavi è un multiplo delle posizioni iniziali', () => {
    for (const seed of seeds) {
      const expected = BigInt(exerciseById('spazio-chiavi')!.generate(seed).answer.expected);
      expect(expected % 17_576n).toBe(0n);
    }
  });

  it('il pannello usa il conteggio delle coppie', () => {
    for (const seed of seeds) {
      const variant = exerciseById('pannello')!.generate(seed);
      const letters = /C\((\d+),/.exec(variant.solution[0] ?? '')?.[1] ?? '';
      const cables = Number(/C\(\d+, (\d+)\)/.exec(variant.solution[0] ?? '')?.[1]) / 2;
      expect(variant.answer.expected).toBe(pairings(Number(letters), Number(cables)).toString());
    }
  });

  it('una sola tabella è reciproca e senza lettere fisse', () => {
    const isEnigmaLike = (wiring: string) =>
      [...wiring].every((out, i) => out !== ALPHABET[i] && wiring[ALPHABET.indexOf(out)] === ALPHABET[i]);
    for (const seed of seeds) {
      const variant = exerciseById('involuzione')!.generate(seed);
      const block = variant.blocks.find((b) => b.kind === 'wiring');
      if (block?.kind !== 'wiring') throw new Error('blocco mancante');
      const good = block.rows.flatMap((row, i) => (isEnigmaLike(row.wiring) ? ['ABC'[i]] : []));
      expect(good).toEqual([variant.answer.expected]);
      for (const row of block.rows) expect(new Set(row.wiring).size).toBe(26);
    }
  });

  it('la posizione iniziale cercata è l’unica compatibile con la parola nota', () => {
    for (const seed of seeds.slice(0, 40)) {
      const variant = exerciseById('posizione-iniziale')!.generate(seed);
      const { config, message } = variant.replay!;
      const crib = /parola (\w+)/.exec(variant.blocks[0]?.kind === 'text' ? variant.blocks[0].text : '')?.[1] ?? '';
      expect(matchingRightLetters(config, message, crib)).toEqual([config.positions[2]]);
      expect(variant.answer.expected).toBe(config.positions);
      expect(encipherWith(config, message).startsWith(crib)).toBe(true);
    }
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
