import { describe, expect, it } from 'vitest';
import { defaultConfig, encipherWith, type MachineConfig } from '@/engine';
import {
  changeModel,
  changeReflector,
  changeRotor,
  changeUhr,
  defaultUkwDPairs,
  parsePairs,
  togglePlug,
} from '../config-edit.ts';
import { isEditableTarget, keyAction } from '../keys.ts';
import { readSharedLink, shareQuery } from '../share.ts';
import {
  createSession,
  currentState,
  press,
  pressAll,
  redo,
  setReflectorWindow,
  setWindow,
  tapeLetters,
  undo,
  windows,
} from '../session.ts';

const config: MachineConfig = {
  model: 'I',
  rotors: ['II', 'IV', 'V'],
  rings: 'BUL',
  positions: 'BLA',
  reflector: 'B',
  plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
};

describe('sessione', () => {
  it('cifra come il motore e annulla riportando i rotori indietro', () => {
    let session = pressAll(createSession(config), 'ENIGMA');
    expect(tapeLetters(session).output).toBe(encipherWith(config, 'ENIGMA'));
    expect(windows(session).rotors).toBe('BLG');

    session = undo(undo(session));
    expect(tapeLetters(session).input).toBe('ENIG');
    expect(windows(session).rotors).toBe('BLE');

    session = redo(session);
    expect(tapeLetters(session).input).toBe('ENIGM');

    session = press(session, 'X');
    expect(session.undone).toHaveLength(0);
    expect(redo(session)).toBe(session);
  });

  it('ignora i caratteri non validi senza muovere i rotori', () => {
    const session = createSession(config);
    for (const char of ['a', 'È', '.', "'", '', 'AB']) expect(press(session, char)).toBe(session);
  });

  it('blocca la tastiera finché la configurazione non è completa', () => {
    const session = createSession(changeUhr(changePlugboardTo(config, ['AB', 'CD']), 0));
    expect(session.machine).toBeNull();
    expect(session.issues.map((i) => i.field)).toContain('uhr');
    expect(press(session, 'A')).toBe(session);
    expect(currentState(session)).toBeNull();
  });

  it('girando un rotore la posizione raggiunta diventa quella iniziale', () => {
    const session = setWindow(pressAll(createSession(config), 'AAAAA'), 0, 'Z');
    expect(session.presses).toHaveLength(0);
    expect(session.config.positions).toBe('ZLF');
  });

  it('nei modelli G conserva anche la posizione raggiunta dal riflettore', () => {
    const g = { ...defaultConfig('G31'), reflectorPosition: 'C' };
    // Con le tacche multiple della G, AAA fa scattare tutta la catena fino al riflettore.
    const typed = pressAll(createSession(g), 'A');
    expect(windows(typed).reflector).toBe('D');
    const session = setWindow(typed, 2, 'B');
    expect(session.config.reflectorPosition).toBe('D');
    expect(setReflectorWindow(session, 'A').config.reflectorPosition).toBeUndefined();
  });
});

function changePlugboardTo(c: MachineConfig, plugboard: string[]): MachineConfig {
  return { ...c, plugboard };
}

describe('modifiche alla configurazione', () => {
  it('le configurazioni di base sono valide per tutti i modelli', () => {
    for (const id of ['I', 'M3', 'M4', 'Norway', 'D', 'K', 'SwissK', 'KD', 'Railway', 'T', 'A865', 'G31'] as const) {
      expect(createSession(defaultConfig(id)).issues).toEqual([]);
    }
    expect(defaultConfig('M4')).toMatchObject({ rotors: ['Beta', 'I', 'II', 'III'], reflector: 'B-thin' });
  });

  it('cambiando modello tiene i cavi solo se il modello ha il pannello', () => {
    expect(changeModel(config, 'M3').plugboard).toEqual(config.plugboard);
    expect(changeModel(config, 'K').plugboard).toBeUndefined();
    expect(changeModel(changeUhr(config, 4), 'M3').uhr).toBeUndefined();
  });

  it('sulla M4 l’UKW-D toglie il rotore sottile e il riflettore sottile lo rimette', () => {
    const m4 = { ...defaultConfig('M4'), rings: 'ABCD', positions: 'WXYZ' };
    const d = changeReflector(m4, 'D');
    expect(d).toMatchObject({ rotors: ['I', 'II', 'III'], rings: 'BCD', positions: 'XYZ' });
    expect(d.ukwD).toEqual(defaultUkwDPairs());
    expect(createSession(d).issues).toEqual([]);
    const back = changeReflector(d, 'C-thin');
    expect(back).toMatchObject({ rotors: ['Beta', 'I', 'II', 'III'], rings: 'ABCD', positions: 'AXYZ' });
    expect(back.ukwD).toBeUndefined();
  });

  it('il cablaggio di riferimento dell’UKW-D ha 12 coppie senza J e Y', () => {
    const pairs = defaultUkwDPairs();
    expect(pairs).toHaveLength(12);
    expect(pairs.join('')).not.toMatch(/[JY]/);
  });

  it('un rotore già montato si scambia con quello dello slot scelto', () => {
    expect(changeRotor(config, 0, 'V').rotors).toEqual(['V', 'IV', 'II']);
    expect(changeRotor(config, 1, 'I').rotors).toEqual(['II', 'I', 'V']);
  });

  it('legge le coppie scritte a mano', () => {
    expect(parsePairs('ab cd')).toEqual({ pairs: ['AB', 'CD'], pending: '' });
    expect(parsePairs('AB.CD-è')).toEqual({ pairs: ['AB', 'CD'], pending: 'E' });
    expect(parsePairs('ABCDE')).toEqual({ pairs: ['AB', 'CD'], pending: 'E' });
  });

  it('collega e scollega le prese con due clic', () => {
    let state = togglePlug([], null, 'A');
    expect(state).toEqual({ pairs: [], pending: 'A' });
    state = togglePlug(state.pairs, state.pending, 'Q');
    expect(state).toEqual({ pairs: ['AQ'], pending: null });
    expect(togglePlug(state.pairs, null, 'Q')).toEqual({ pairs: [], pending: null });
    expect(togglePlug(['AQ'], 'B', 'B')).toEqual({ pairs: ['AQ'], pending: null });
  });
});

describe('tastiera fisica', () => {
  const key = (k: string, extra: Partial<KeyboardEvent> = {}) =>
    keyAction({ key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...extra });

  it('accetta lettere, maiuscole e accentate', () => {
    expect(key('a')).toEqual({ type: 'letter', letter: 'A' });
    expect(key('Q')).toEqual({ type: 'letter', letter: 'Q' });
    expect(key('è')).toEqual({ type: 'letter', letter: 'E' });
    expect(key('Backspace')).toEqual({ type: 'undo' });
  });

  it('ignora modificatori, tasti speciali, punteggiatura e ripetizione', () => {
    for (const k of ['Shift', 'Control', 'ArrowLeft', 'F1', 'Enter', ' ', ',', '1', 'ß', 'Tab'])
      expect(key(k)).toBeNull();
    expect(key('c', { ctrlKey: true })).toBeNull();
    expect(key('a', { repeat: true })).toBeNull();
    expect(key('Backspace', { metaKey: true })).toBeNull();
  });

  it('non intercetta nulla fuori dal DOM', () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe('link condivisibili', () => {
  it('andata e ritorno con il messaggio', () => {
    const link = readSharedLink(`?${shareQuery(config, 'ENIGMA')}`);
    expect(link).toEqual({ kind: 'ok', config, message: 'ENIGMA' });
  });

  it('distingue una pagina senza link da un link non valido', () => {
    expect(readSharedLink('')).toEqual({ kind: 'none' });
    expect(readSharedLink('?utm_source=libro')).toEqual({ kind: 'none' });
    const invalid = readSharedLink('?v=1&m=I&w=I-I-II&r=AAA&p=AAA&u=B');
    expect(invalid.kind).toBe('invalid');
  });

  it('ripulisce il messaggio da caratteri non digitabili', () => {
    const link = readSharedLink(`?${shareQuery(config)}&t=ciao%20mondo!`);
    expect(link.kind === 'ok' && link.message).toBe('CIAOMONDO');
  });
});
