import { describe, expect, it } from 'vitest';
import { decodeConfig, encodeConfig, groupLetters, prepareText, type MachineConfig } from '../index.ts';

describe('prepareText', () => {
  it('rimuove accenti, apostrofi, spazi e punteggiatura', () => {
    expect(prepareText('L’Enigma è “quasi” perfetta, però… no!')).toBe('LENIGMAEQUASIPERFETTAPERONO');
    expect(prepareText("Un'altra prova: più città.")).toBe('UNALTRAPROVAPIUCITTA');
  });

  it('può sostituire la fine delle frasi con X e scrivere le cifre in lettere', () => {
    expect(prepareText('Ore 14. Attacco!', { punctuation: 'x', digits: 'spell' })).toBe('OREUNOQUATTROXATTACCOX');
    expect(prepareText('Straße 7')).toBe('STRASSE');
  });

  it('raggruppa in blocchi da cinque', () => {
    expect(groupLetters('ABCDEFGHIJKL')).toBe('ABCDE FGHIJ KL');
  });
});

describe('link condivisibili', () => {
  const configs: MachineConfig[] = [
    {
      model: 'M3',
      rotors: ['II', 'IV', 'V'],
      rings: 'BUL',
      positions: 'BLA',
      reflector: 'B',
      plugboard: ['AV', 'BS', 'CG'],
    },
    { model: 'M4', rotors: ['Beta', 'II', 'IV', 'I'], rings: 'AAAV', positions: 'VJNA', reflector: 'B-thin' },
    {
      model: 'G31',
      rotors: ['III', 'I', 'II'],
      rings: 'ABC',
      positions: 'XYZ',
      reflector: 'UKW',
      reflectorPosition: 'Q',
    },
    {
      model: 'I',
      rotors: ['I', 'II', 'III'],
      rings: 'AAA',
      positions: 'AAA',
      reflector: 'D',
      plugboard: ['AZ', 'BY', 'CX', 'DW', 'EV', 'FU', 'GT', 'HS', 'IR', 'JQ'],
      uhr: 27,
      ukwD: ['AB', 'CD', 'EF', 'GH', 'IK', 'LM', 'NO', 'PQ', 'RS', 'TU', 'VW', 'XZ'],
    },
  ];

  it.each(configs)('andata e ritorno: $model', (config) => {
    expect(decodeConfig(encodeConfig(config))).toEqual({ ok: true, config });
  });

  it('è leggibile', () => {
    expect(encodeConfig(configs[1] as MachineConfig)).toBe('v=1&m=M4&w=Beta-II-IV-I&r=AAAV&p=VJNA&u=B-thin');
  });

  it('rifiuta link non validi con un messaggio', () => {
    const result = decodeConfig('?v=1&m=M3&w=I-I-III&r=AAA&p=AAA&u=B');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toMatch(/due volte/);
    expect(decodeConfig('v=9&m=M3').ok).toBe(false);
    expect(decodeConfig('v=1&m=Z9').ok).toBe(false);
  });
});
