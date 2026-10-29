import {
  ALPHABET,
  createMachine,
  encipher,
  encipherWith,
  groupLetters,
  initialState,
  MODELS,
  prepareText,
  pressKey,
  step,
  toLetter,
  windowLetters,
  type MachineConfig,
} from '@/engine';
import { t, tf } from '@/i18n';
import { randomMessage } from './messages.ts';
import { createRng, int, MAX_SEED, shuffle, type Rng } from './random.ts';

/**
 * Catalogo degli esercizi autocorretti. Ogni esercizio genera una variante da un seme; la
 * risposta attesa la calcola sempre il motore. Il testo è fatto di blocchi strutturati, che
 * l’interfaccia rende (e che un domani serviranno anche per le schede stampabili).
 */

export type Level = 1 | 2;

export interface KeySheet {
  rotors: string[];
  rings: string;
  plugboard: string[];
  /** Grundstellung, quando fa parte della chiave. */
  positions?: string;
  /** Anelli scritti come numeri da 01 a 26, come sui rotori dell’Enigma I. */
  ringsAsNumbers?: boolean;
}

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'key'; sheet: KeySheet }
  | { kind: 'message'; label: string; text: string }
  | { kind: 'wiring'; rows: { name: string; wiring: string }[] }
  | { kind: 'compare'; plain: string; cipher: string };

export interface Answer {
  kind: 'letters' | 'number';
  label: string;
  /** Già normalizzata: solo lettere maiuscole, oppure un numero senza zeri iniziali. */
  expected: string;
}

export interface Variant {
  seed: number;
  blocks: Block[];
  answer: Answer;
  solution: string[];
  /** Configurazione e testo per rivedere la soluzione nel simulatore. */
  replay?: { config: MachineConfig; message: string };
}

export interface Exercise {
  id: string;
  level: Level;
  title: string;
  summary: string;
  /** Mostra il simulatore accanto all’esercizio (negli esercizi “a mano” resta nascosto). */
  simulator: boolean;
  generate: (seed: number) => Variant;
}

const MILITARY_ROTORS = ['I', 'II', 'III', 'IV', 'V'];

const randomLetters = (rng: Rng, count: number) =>
  Array.from({ length: count }, () => toLetter(int(rng, 0, 25))).join('');

function randomPairs(rng: Rng, count: number): string[] {
  const letters = shuffle(rng, [...ALPHABET]).slice(0, 2 * count);
  const pairs: string[] = [];
  for (let i = 0; i < letters.length; i += 2) pairs.push([letters[i], letters[i + 1]].sort().join(''));
  return pairs.sort();
}

/** Chiave casuale per l’Enigma I con riflettore B. */
function randomKey(rng: Rng, cables: number, rings = true): MachineConfig {
  return {
    model: 'I',
    rotors: shuffle(rng, MILITARY_ROTORS).slice(0, 3),
    rings: rings ? randomLetters(rng, 3) : 'AAA',
    positions: randomLetters(rng, 3),
    reflector: 'B',
    plugboard: randomPairs(rng, cables),
  };
}

const sheetOf = (config: MachineConfig, extra: Partial<KeySheet> = {}): KeySheet => ({
  rotors: [...config.rotors],
  rings: config.rings,
  plugboard: [...(config.plugboard ?? [])],
  ...extra,
});

/** Normalizza la risposta digitata: le lettere come sulla tastiera di Enigma, i numeri senza zeri. */
export function normalizeAnswer(kind: Answer['kind'], input: string): string {
  if (kind === 'letters') return prepareText(input);
  const digits = input.trim();
  return /^\d+$/.test(digits) ? String(Number(digits)) : digits;
}

export function isCorrect(variant: Variant, input: string): boolean {
  return normalizeAnswer(variant.answer.kind, input) === variant.answer.expected;
}

const cifra: Exercise = {
  id: 'cifra',
  level: 1,
  title: t('ex.cifra.title'),
  summary: t('ex.cifra.summary'),
  simulator: true,
  generate(seed) {
    const rng = createRng(seed);
    const config = randomKey(rng, 4);
    const text = randomMessage(rng, 'short');
    const plain = prepareText(text);
    const cipher = encipherWith(config, plain);
    return {
      seed,
      blocks: [
        { kind: 'text', text: t('ex.cifra.intro') },
        { kind: 'key', sheet: sheetOf(config, { positions: config.positions }) },
        { kind: 'message', label: t('ex.label.plain'), text },
      ],
      answer: { kind: 'letters', label: t('ex.answer.cipher'), expected: cipher },
      solution: [tf('ex.solution.cipher', { text: groupLetters(cipher) })],
      replay: { config, message: plain },
    };
  },
};

const decifra: Exercise = {
  id: 'decifra',
  level: 1,
  title: t('ex.decifra.title'),
  summary: t('ex.decifra.summary'),
  simulator: true,
  generate(seed) {
    const rng = createRng(seed);
    const config = randomKey(rng, 4);
    const text = randomMessage(rng, 'short');
    const cipher = encipherWith(config, prepareText(text));
    return {
      seed,
      blocks: [
        { kind: 'text', text: t('ex.decifra.intro') },
        { kind: 'key', sheet: sheetOf(config, { positions: config.positions }) },
        { kind: 'message', label: t('ex.label.cipher'), text: groupLetters(cipher) },
      ],
      answer: { kind: 'letters', label: t('ex.answer.plain'), expected: prepareText(text) },
      solution: [tf('ex.solution.plain', { text })],
      replay: { config, message: cipher },
    };
  },
};

const foglioChiave: Exercise = {
  id: 'foglio-chiave',
  level: 1,
  title: t('ex.foglio.title'),
  summary: t('ex.foglio.summary'),
  simulator: true,
  generate(seed) {
    const rng = createRng(seed);
    const config = randomKey(rng, 10);
    const text = randomMessage(rng, 'long');
    const cipher = encipherWith(config, prepareText(text));
    return {
      seed,
      blocks: [
        { kind: 'text', text: t('ex.foglio.intro') },
        { kind: 'key', sheet: sheetOf(config, { positions: config.positions, ringsAsNumbers: true }) },
        { kind: 'message', label: t('ex.label.cipher'), text: groupLetters(cipher) },
      ],
      answer: { kind: 'letters', label: t('ex.answer.plain'), expected: prepareText(text) },
      solution: [
        tf('ex.foglio.solutionRings', {
          rings: [...config.rings].map((letter) => `${letter} = ${ALPHABET.indexOf(letter) + 1}`).join(', '),
        }),
        tf('ex.solution.plain', { text }),
      ],
      replay: { config, message: cipher },
    };
  },
};

const indicatore: Exercise = {
  id: 'indicatore',
  level: 1,
  title: t('ex.indicatore.title'),
  summary: t('ex.indicatore.summary'),
  simulator: true,
  generate(seed) {
    const rng = createRng(seed);
    const config = randomKey(rng, 6);
    const messageKey = randomLetters(rng, 3);
    const text = randomMessage(rng, 'short');
    const indicator = encipherWith(config, messageKey + messageKey);
    const messageConfig = { ...config, positions: messageKey };
    const cipher = encipherWith(messageConfig, prepareText(text));
    return {
      seed,
      blocks: [
        { kind: 'text', text: t('ex.indicatore.intro') },
        { kind: 'key', sheet: sheetOf(config, { positions: config.positions }) },
        { kind: 'message', label: t('ex.label.indicator'), text: indicator },
        { kind: 'message', label: t('ex.label.cipher'), text: groupLetters(cipher) },
      ],
      answer: { kind: 'letters', label: t('ex.answer.plain'), expected: prepareText(text) },
      solution: [
        tf('ex.indicatore.solutionKey', { positions: config.positions, indicator, doubled: messageKey + messageKey }),
        tf('ex.indicatore.solutionMessage', { key: messageKey }),
        tf('ex.solution.plain', { text }),
      ],
      replay: { config: messageConfig, message: cipher },
    };
  },
};

const posizioni: Exercise = {
  id: 'posizioni',
  level: 2,
  title: t('ex.posizioni.title'),
  summary: t('ex.posizioni.summary'),
  simulator: false,
  generate(seed) {
    const rng = createRng(seed);
    const rotors = shuffle(rng, MILITARY_ROTORS).slice(0, 3);
    const notch = (name: string) => ALPHABET.indexOf(MODELS.I.rotors[name]?.notches ?? 'A');
    // Partenza vicino alle tacche, così nei tasti previsti cade spesso un doppio passo.
    const right = toLetter(notch(rotors[2] ?? 'I') - int(rng, 0, 4) + 26);
    const middle = toLetter(notch(rotors[1] ?? 'I') - int(rng, 0, 1) + 26);
    const start = `${randomLetters(rng, 1)}${middle}${right}`;
    const presses = int(rng, 5, 12);
    const config: MachineConfig = { model: 'I', rotors, rings: 'AAA', positions: start, reflector: 'B' };
    const machine = createMachine(config);
    let state = initialState(machine);
    const path = [windowLetters(state)];
    for (let i = 0; i < presses; i++) {
      state = step(machine, state).state;
      path.push(windowLetters(state));
    }
    const notches = rotors.map((name) => `${name}: ${MODELS.I.rotors[name]?.notches ?? ''}`).join(', ');
    return {
      seed,
      blocks: [
        { kind: 'text', text: tf('ex.posizioni.intro', { rotors: rotors.join(' – '), start, presses, notches }) },
      ],
      answer: { kind: 'letters', label: t('ex.answer.windows'), expected: windowLetters(state) },
      solution: [tf('ex.posizioni.solution', { path: path.join(' → ') })],
      replay: { config, message: 'A'.repeat(presses) },
    };
  },
};

const aMano: Exercise = {
  id: 'a-mano',
  level: 2,
  title: t('ex.amano.title'),
  summary: t('ex.amano.summary'),
  simulator: false,
  generate(seed) {
    const rng = createRng(seed);
    const config = randomKey(rng, 0, false);
    const letter = toLetter(int(rng, 0, 25));
    const machine = createMachine(config);
    const press = pressKey(machine, initialState(machine), letter);
    const rows = [
      ...config.rotors.map((name) => ({
        name: tf('ex.amano.rotor', { name }),
        wiring: MODELS.I.rotors[name]?.wiring ?? '',
      })),
      { name: t('ex.amano.reflector'), wiring: MODELS.I.reflectors.B?.wiring ?? '' },
    ];
    const stages = press.stages
      .filter((stage) => stage.kind === 'rotor' || stage.kind === 'reflector')
      .map((stage) =>
        tf(stage.kind === 'reflector' ? 'ex.amano.stageReflector' : 'ex.amano.stageRotor', {
          name: stage.kind === 'rotor' ? (config.rotors[stage.slot ?? 0] ?? '') : 'B',
          input: toLetter(stage.input),
          output: toLetter(stage.output),
        }),
      );
    return {
      seed,
      blocks: [
        {
          kind: 'text',
          text: tf('ex.amano.intro', { rotors: config.rotors.join(' – '), positions: config.positions, letter }),
        },
        { kind: 'wiring', rows },
      ],
      answer: { kind: 'letters', label: t('ex.answer.lamp'), expected: press.output },
      solution: [
        tf('ex.amano.solutionStep', { before: config.positions, after: windowLetters(press.state) }),
        ...stages,
        tf('ex.amano.solutionLamp', { letter, output: press.output }),
      ],
      replay: { config, message: letter },
    };
  },
};

const impossibile: Exercise = {
  id: 'impossibile',
  level: 2,
  title: t('ex.impossibile.title'),
  summary: t('ex.impossibile.summary'),
  simulator: false,
  generate(seed) {
    const rng = createRng(seed);
    const config = randomKey(rng, 10);
    const plain = prepareText(randomMessage(rng, 'long'));
    const machine = createMachine(config);
    const real = encipher(machine, initialState(machine), plain).output;
    // Una sola lettera falsificata: resta uguale a quella in chiaro, cosa che Enigma non fa mai.
    const position = int(rng, 0, plain.length - 1);
    const cipher = real.slice(0, position) + plain[position] + real.slice(position + 1);
    return {
      seed,
      blocks: [
        { kind: 'text', text: t('ex.impossibile.intro') },
        { kind: 'compare', plain, cipher },
      ],
      answer: { kind: 'number', label: t('ex.answer.position'), expected: String(position + 1) },
      solution: [tf('ex.impossibile.solution', { position: position + 1, letter: plain[position] ?? '' })],
    };
  },
};

export const EXERCISES: readonly Exercise[] = [cifra, decifra, foglioChiave, indicatore, posizioni, aMano, impossibile];

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

/** Un seme qualsiasi tra quelli ammessi; nell’interfaccia `random` è `Math.random`. */
export const randomSeedFrom = (random: () => number) => 1 + Math.floor(random() * MAX_SEED);
