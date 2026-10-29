import { describe, expect, it } from 'vitest';
import {
  createMachine,
  encipher,
  encipherWith,
  initialState,
  InvalidConfigError,
  MODEL_IDS,
  MODELS,
  pressKey,
  rotorNames,
  step,
  uhrMaps,
  windowLetters,
  type MachineConfig,
} from '../index.ts';

const basic: MachineConfig = {
  model: 'M3',
  rotors: ['I', 'II', 'III'],
  rings: 'AAA',
  positions: 'AAA',
  reflector: 'B',
};

describe('cifratura di base', () => {
  it.each([
    ['A', 'B'],
    ['AAA', 'BDZ'],
    ['BDZ', 'AAA'],
    ['BBB', 'AJL'],
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'BJELRQZVJWARXSNBXORSTNCFME'],
  ])('I-II-III con UKW-B: %s → %s', (input, output) => {
    expect(encipherWith(basic, input)).toBe(output);
  });

  it('rotori VI-III-VII con UKW-C', () => {
    expect(encipherWith({ ...basic, rotors: ['VI', 'III', 'VII'], reflector: 'C' }, 'AAA')).toBe('NUC');
  });

  it('pannello a spine', () => {
    expect(encipherWith({ ...basic, plugboard: ['BT'] }, 'AAA')).toBe('TDZ');
  });

  it('M4 con anelli, posizioni e spine', () => {
    const config: MachineConfig = {
      model: 'M4',
      rotors: ['Beta', 'IV', 'VIII', 'II'],
      rings: 'TXCL',
      positions: 'EGQN',
      reflector: 'C-thin',
      plugboard: ['AT', 'BP', 'CY', 'EO', 'FX', 'HI', 'JS', 'KL', 'MZ', 'UV'],
    };
    expect(encipherWith(config, 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG')).toBe('BPVJRKDUZEZVOTYZNYCEFVFFDSLZGYQWJPF');
  });

  it('M4 con UKW-D usa tre rotori normali', () => {
    expect(
      encipherWith({ model: 'M4', rotors: ['I', 'II', 'III'], rings: 'AAA', positions: 'AAA', reflector: 'D' }, 'A'),
    ).toBe('E');
  });
});

describe('modelli', () => {
  // Prima lettera cifrata con i rotori I, II, III (I, II, V per il G-111) a posizioni e anelli in A,
  // dai test del simulatore originale.
  const expected: Record<string, [string, string[]]> = {
    D: ['H', ['I', 'II', 'III']],
    I: ['S', ['I', 'II', 'III']],
    Norway: ['Q', ['I', 'II', 'III']],
    A865: ['H', ['I', 'II', 'III']],
    G31: ['H', ['I', 'II', 'III']],
    G111: ['J', ['I', 'II', 'V']],
    G260: ['F', ['I', 'II', 'III']],
    G312: ['E', ['I', 'II', 'III']],
    K: ['H', ['I', 'II', 'III']],
    SwissK: ['Y', ['I', 'II', 'III']],
    KD: ['L', ['I', 'II', 'III']],
    Railway: ['Z', ['I', 'II', 'III']],
    T: ['F', ['I', 'II', 'III']],
  };

  for (const [model, [output, rotors]] of Object.entries(expected)) {
    it(`${model}: A → ${output}`, () => {
      const spec = MODELS[model as keyof typeof MODELS];
      const reflector = model === 'I' ? 'A' : (Object.keys(spec.reflectors)[0] ?? '');
      expect(encipherWith({ model: spec.id, rotors, rings: 'AAA', positions: 'AAA', reflector }, 'A')).toBe(output);
    });
  }

  it('ogni cablaggio è una permutazione e ogni riflettore è un’involuzione senza punti fissi', () => {
    for (const id of MODEL_IDS) {
      const model = MODELS[id];
      for (const wiring of [model.entryWheel, ...Object.values(model.rotors).map((r) => r.wiring)]) {
        expect(new Set(wiring).size).toBe(26);
      }
      for (const { wiring } of Object.values(model.reflectors)) {
        [...wiring].forEach((letter, i) => {
          expect(letter).not.toBe(String.fromCharCode(65 + i));
          expect(wiring[letter.charCodeAt(0) - 65]).toBe(String.fromCharCode(65 + i));
        });
      }
      expect(rotorNames(model).regular.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('avanzamento dei rotori', () => {
  const positionsAfter = (config: MachineConfig, presses: number) => {
    const machine = createMachine(config);
    let state = initialState(machine);
    const seen: string[] = [];
    for (let i = 0; i < presses; i++) {
      state = step(machine, state).state;
      seen.push(windowLetters(state));
    }
    return seen;
  };

  it('doppio passo del rotore centrale', () => {
    expect(positionsAfter({ ...basic, positions: 'ADU' }, 4)).toEqual(['ADV', 'AEW', 'BFX', 'BFY']);
  });

  it('il passo dipende dalla lettera nella finestrella, non dall’anello', () => {
    expect(positionsAfter({ ...basic, rings: 'XYZ', positions: 'ADU' }, 3)).toEqual(['ADV', 'AEW', 'BFX']);
  });

  it('i rotori VI–VIII hanno due tacche', () => {
    expect(positionsAfter({ ...basic, rotors: ['I', 'II', 'VI'], positions: 'AAL' }, 2)).toEqual(['AAM', 'ABN']);
    expect(positionsAfter({ ...basic, rotors: ['I', 'II', 'VI'], positions: 'AAY' }, 2)).toEqual(['AAZ', 'ABA']);
  });

  it('sulla M4 il rotore sottile non avanza mai', () => {
    const config: MachineConfig = {
      model: 'M4',
      rotors: ['Beta', 'I', 'II', 'III'],
      rings: 'AAAA',
      positions: 'ZQDU',
      reflector: 'B-thin',
    };
    expect(positionsAfter(config, 3)).toEqual(['ZQDV', 'ZQEW', 'ZRFX']);
  });

  it('a ingranaggi: niente doppio passo e il riflettore avanza alla fine della catena', () => {
    const machine = createMachine({
      model: 'G31',
      rotors: ['I', 'II', 'III'],
      rings: 'AAA',
      positions: 'BBB',
      reflector: 'UKW',
      reflectorPosition: 'B',
    });
    let state = initialState(machine);
    state = step(machine, state).state;
    expect([state.reflectorPosition, ...state.positions]).toEqual([1, 1, 1, 2]);
    for (let i = 0; i < 3; i++) state = step(machine, state).state;
    expect([state.reflectorPosition, ...state.positions]).toEqual([1, 1, 2, 5]);
    const last = step(machine, state);
    expect([last.state.reflectorPosition, ...last.state.positions]).toEqual([2, 2, 3, 6]);
    expect(last.reflectorMoved).toBe(true);
  });
});

describe('tastiera', () => {
  it('premere un tasto restituisce lo stato nuovo senza modificare quello vecchio', () => {
    const machine = createMachine(basic);
    const start = initialState(machine);
    const press = pressKey(machine, start, 'A');
    expect(press.output).toBe('B');
    expect(windowLetters(start)).toBe('AAA');
    expect(windowLetters(press.state)).toBe('AAB');
  });

  it.each(['a', '.', "'", 'È', ' ', '', 'AB', '\b'])('il tasto %j non esiste e non fa avanzare nulla', (key) => {
    const machine = createMachine(basic);
    const start = initialState(machine);
    expect(() => pressKey(machine, start, key)).toThrow(RangeError);
    expect(windowLetters(start)).toBe('AAA');
  });

  it('la traccia registra tutti gli stadi e termina sulla lettera accesa', () => {
    const machine = createMachine(basic);
    const press = pressKey(machine, initialState(machine), 'A');
    expect(press.stages.map((s) => `${s.kind}:${s.direction}${s.slot ?? ''}`)).toEqual([
      'plugboard:forward',
      'entry:forward',
      'rotor:forward2',
      'rotor:forward1',
      'rotor:forward0',
      'reflector:reflect',
      'rotor:backward0',
      'rotor:backward1',
      'rotor:backward2',
      'entry:backward',
      'plugboard:backward',
    ]);
    press.stages.slice(1).forEach((stage, i) => expect(stage.input).toBe(press.stages[i]?.output));
    expect(press.stages.at(-1)?.output).toBe(1);
  });

  it('decifrare un testo lungo restituisce il testo in chiaro e lo stato finale', () => {
    const machine = createMachine(basic);
    const { output, state } = encipher(machine, initialState(machine), 'ENIGMAREVEALED');
    expect(encipher(machine, initialState(machine), output).output).toBe('ENIGMAREVEALED');
    expect(windowLetters(state)).toBe('AAO');
  });
});

describe('Uhr', () => {
  const pairs = ['AZ', 'BY', 'CX', 'DW', 'EV', 'FU', 'GT', 'HS', 'IR', 'JQ'];
  const letter = (index: number | undefined) => String.fromCharCode(65 + (index ?? 0));

  it('alla posizione 0 equivale al pannello a spine', () => {
    const { forward, backward } = uhrMaps(pairs, 0);
    expect(letter(forward[0])).toBe('Z');
    expect(letter(forward[25])).toBe('A');
    expect(backward).toEqual(forward);
  });

  it('valori di riferimento del simulatore originale alla posizione 3', () => {
    expect(letter(uhrMaps(pairs, 3).forward[0])).toBe('V');
    expect(letter(uhrMaps(pairs, 3).forward[25])).toBe('F');
    const swapped = ['BY', 'AZ', ...pairs.slice(2)];
    expect(letter(uhrMaps(swapped, 3).forward[0])).toBe('R');
    expect(letter(uhrMaps(swapped, 3).forward[25])).toBe('H');
    const reversed = ['ZA', ...pairs.slice(1)];
    expect(letter(uhrMaps(reversed, 3).forward[0])).toBe('F');
    expect(letter(uhrMaps(reversed, 3).forward[25])).toBe('V');
  });

  it('è reciproca solo nelle posizioni multiple di 4 e il ritorno inverte sempre l’andata', () => {
    for (let setting = 0; setting < 40; setting++) {
      const { forward, backward } = uhrMaps(pairs, setting);
      const reciprocal = forward.every((target, source) => forward[target] === source);
      expect(reciprocal, `posizione ${setting}`).toBe(setting % 4 === 0);
      forward.forEach((target, source) => expect(backward[target]).toBe(source));
      expect(new Set(forward).size).toBe(26);
    }
  });

  it('con l’Uhr la macchina resta reciproca', () => {
    const config: MachineConfig = {
      model: 'I',
      rotors: ['I', 'II', 'III'],
      rings: 'AAA',
      positions: 'AAA',
      reflector: 'B',
      plugboard: pairs,
      uhr: 27,
    };
    const ciphertext = encipherWith(config, 'ANGRIFFUMNULLUHR');
    expect(encipherWith(config, ciphertext)).toBe('ANGRIFFUMNULLUHR');
  });
});

describe('UKW-D', () => {
  const base: MachineConfig = {
    model: 'I',
    rotors: ['I', 'II', 'III'],
    rings: 'AAA',
    positions: 'AAA',
    reflector: 'D',
  };
  const defaultPairs = ['AZ', 'BX', 'CW', 'DV', 'EU', 'FT', 'GS', 'HR', 'IQ', 'KP', 'LO', 'MN'];

  it('le coppie predefinite equivalgono al cablaggio di riferimento', () => {
    expect(encipherWith({ ...base, ukwD: defaultPairs }, 'HELLOWORLD')).toBe(encipherWith(base, 'HELLOWORLD'));
  });

  it('un cablaggio diverso cambia il risultato e resta reciproco', () => {
    const rewired = { ...base, ukwD: ['AB', 'CD', 'EF', 'GH', 'IK', 'LM', 'NO', 'PQ', 'RS', 'TU', 'VW', 'XZ'] };
    const ciphertext = encipherWith(rewired, 'HELLOWORLD');
    expect(ciphertext).not.toBe(encipherWith(base, 'HELLOWORLD'));
    expect(encipherWith(rewired, ciphertext)).toBe('HELLOWORLD');
  });
});

describe('validazione', () => {
  const fieldsOf = (config: MachineConfig) => {
    try {
      createMachine(config);
      return [];
    } catch (error) {
      if (error instanceof InvalidConfigError) return error.issues.map((issue) => issue.field);
      throw error;
    }
  };

  it('accetta una configurazione corretta', () => {
    expect(fieldsOf(basic)).toEqual([]);
  });

  it.each<[string, Partial<MachineConfig>, string[]]>([
    ['rotore duplicato', { rotors: ['I', 'I', 'III'] }, ['rotors']],
    ['rotore inesistente per il modello', { model: 'I', rotors: ['I', 'II', 'VI'] }, ['rotors']],
    ['numero di rotori sbagliato', { rotors: ['I', 'II'] }, ['rotors']],
    ['anelli non validi', { rings: 'A1A' }, ['rings']],
    ['posizioni minuscole', { positions: 'aaa' }, ['positions']],
    ['lettera ripetuta nel pannello', { plugboard: ['AB', 'BC'] }, ['plugboard']],
    [
      'Uhr su un modello che non la usava',
      { plugboard: ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'], uhr: 4 },
      ['uhr'],
    ],
    ['riflettore regolabile dove non lo era', { reflectorPosition: 'C' }, ['reflectorPosition']],
  ])('rifiuta: %s', (_, change, fields) => {
    expect(fieldsOf({ ...basic, ...change })).toEqual(fields);
  });

  it('l’Uhr richiede 10 cavi', () => {
    expect(fieldsOf({ ...basic, model: 'I', plugboard: ['AZ'], uhr: 3 })).toEqual(['uhr']);
  });

  it('pannello a spine assente sui modelli commerciali', () => {
    expect(
      fieldsOf({
        model: 'K',
        rotors: ['I', 'II', 'III'],
        rings: 'AAA',
        positions: 'AAA',
        reflector: 'UKW',
        plugboard: ['AB'],
      }),
    ).toEqual(['plugboard']);
  });

  it('il riflettore delle macchine commerciali si regola ma non avanza', () => {
    const config: MachineConfig = {
      model: 'K',
      rotors: ['I', 'II', 'III'],
      rings: 'AAA',
      positions: 'AAA',
      reflector: 'UKW',
      reflectorPosition: 'Q',
    };
    const machine = createMachine(config);
    const start = initialState(machine);
    expect(start.reflectorPosition).toBe(16);
    expect(
      encipher(machine, start, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').state.reflectorPosition,
    ).toBe(16);
    expect(encipherWith(config, 'A')).not.toBe(encipherWith({ ...config, reflectorPosition: 'A' }, 'A'));
  });

  it('M4: rotore sottile obbligatorio a sinistra con riflettore sottile', () => {
    expect(
      fieldsOf({
        model: 'M4',
        rotors: ['I', 'II', 'III', 'IV'],
        rings: 'AAAA',
        positions: 'AAAA',
        reflector: 'B-thin',
      }),
    ).toEqual(['rotors']);
    expect(
      fieldsOf({ model: 'M4', rotors: ['Beta', 'II', 'III'], rings: 'AAA', positions: 'AAA', reflector: 'D' }),
    ).toEqual(['rotors']);
  });

  it('UKW-D: J–Y fissa e 12 coppie', () => {
    const base: MachineConfig = { ...basic, model: 'I', reflector: 'D' };
    expect(fieldsOf({ ...base, ukwD: ['JA'] })).toEqual(['ukwD']);
    expect(fieldsOf({ ...base, ukwD: ['AB'] })).toEqual(['ukwD']);
  });
});
