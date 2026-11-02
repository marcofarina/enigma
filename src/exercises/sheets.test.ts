import { describe, expect, it } from 'vitest';
import { encipherWith, prepareText } from '@/engine';
import { classSeeds, configFor, DAYS, generateSheet } from './sheets.ts';

const options = { messages: 3, extras: ['posizioni', 'pannello'] };

describe('schede stampabili', () => {
  it('sono ripetibili e cambiano con il seme', () => {
    expect(generateSheet(4827, options)).toEqual(generateSheet(4827, options));
    expect(generateSheet(4828, options).keys).not.toEqual(generateSheet(4827, options).keys);
  });

  it('il foglio chiave va dal 31 all’1 con dieci cavi e rotori distinti', () => {
    const { keys } = generateSheet(12, options);
    expect(keys.map((key) => key.day)).toEqual(Array.from({ length: DAYS }, (_, i) => DAYS - i));
    for (const key of keys) {
      expect(new Set(key.rotors).size).toBe(3);
      expect(key.plugboard).toHaveLength(10);
      expect(new Set(key.plugboard.join('')).size).toBe(20);
      expect(key.rings.every((ring) => ring >= 1 && ring <= 26)).toBe(true);
      expect(key.identifiers).toHaveLength(4);
    }
  });

  it('i messaggi si decifrano con la chiave del loro giorno', () => {
    for (const seed of [1, 99, 4827, 999_999]) {
      const sheet = generateSheet(seed, options);
      expect(sheet.messages).toHaveLength(3);
      for (const message of sheet.messages) {
        const key = sheet.keys.find((k) => k.day === message.day)!;
        expect(encipherWith(configFor(key, message.start), message.encryptedKey)).toBe(message.messageKey);
        const plain = encipherWith(configFor(key, message.messageKey), message.cipher.replaceAll(' ', ''));
        expect(plain).toBe(prepareText(message.plain));
      }
    }
  });

  it('aggiunge gli esercizi scelti con lo stesso seme', () => {
    const sheet = generateSheet(77, options);
    expect(sheet.extras.map((extra) => extra.id)).toEqual(['posizioni', 'pannello']);
    expect(generateSheet(77, { messages: 0, extras: [] })).toMatchObject({ messages: [], extras: [] });
  });

  it('una serie per la classe usa semi consecutivi', () => {
    expect(classSeeds(10, 3)).toEqual([10, 11, 12]);
    expect(classSeeds(999_998, 3)).toEqual([999_998, 999_999, 1]);
    expect(classSeeds(0, 2)).toEqual([1, 2]);
  });
});
