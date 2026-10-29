import { invert, isLetter, LETTER_COUNT, mod, toIndex, toLetter } from './alphabet.ts';
import { InvalidConfigError, validateConfig, type MachineConfig } from './config.ts';
import { MODELS, UKW_D_FIXED_PAIR, type ModelSpec } from './models.ts';
import { uhrMaps } from './uhr.ts';

interface CompiledRotor {
  name: string;
  forward: number[];
  backward: number[];
  notches: ReadonlySet<number>;
  ring: number;
}

/** Macchina pronta all’uso: cablaggi convertiti in tabelle numeriche. Immutabile. */
export interface Machine {
  readonly config: MachineConfig;
  readonly model: ModelSpec;
  readonly rotors: readonly CompiledRotor[];
  readonly reflector: readonly number[];
  readonly entry: { readonly forward: readonly number[]; readonly backward: readonly number[] };
  /** Pannello a spine (o Uhr): andata verso i rotori e ritorno verso le lampade. */
  readonly plugboard: { readonly forward: readonly number[]; readonly backward: readonly number[] };
}

/** Stato variabile della macchina: le posizioni dei rotori e del riflettore. */
export interface MachineState {
  /** Indici 0–25 delle lettere nelle finestrelle, da sinistra a destra. */
  readonly positions: readonly number[];
  readonly reflectorPosition: number;
}

export type StageKind = 'plugboard' | 'entry' | 'rotor' | 'reflector';

/**
 * Un passaggio del segnale attraverso un componente. I contatti `input`/`output` sono indici
 * 0–25 sullo statore (la carcassa fissa). Per rotori e riflettore `coreInput`/`coreOutput` sono
 * i contatti sul componente che ruota.
 */
export interface Stage {
  kind: StageKind;
  direction: 'forward' | 'reflect' | 'backward';
  /** Slot del rotore, da sinistra (0) a destra. */
  slot?: number;
  input: number;
  output: number;
  coreInput?: number;
  coreOutput?: number;
}

export interface StepResult {
  state: MachineState;
  /** Per ogni slot, se il rotore è avanzato. */
  moved: boolean[];
  reflectorMoved: boolean;
}

export interface KeyPress {
  state: MachineState;
  input: string;
  output: string;
  step: StepResult;
  stages: Stage[];
}

function pairsToMap(pairs: readonly string[]): number[] {
  const map = Array.from({ length: LETTER_COUNT }, (_, i) => i);
  for (const pair of pairs) {
    const a = toIndex(pair[0] ?? '');
    const b = toIndex(pair[1] ?? '');
    map[a] = b;
    map[b] = a;
  }
  return map;
}

function wiringToMap(wiring: string): number[] {
  return [...wiring].map(toIndex);
}

/** Converte le 12 coppie dell’UKW-D nel cablaggio completo (con la coppia fissa J–Y). */
export function ukwDWiring(pairs: readonly string[]): string {
  return pairsToMap([...pairs, UKW_D_FIXED_PAIR])
    .map((target) => toLetter(target))
    .join('');
}

/** Costruisce una macchina. Lancia `InvalidConfigError` se la configurazione non è realizzabile. */
export function createMachine(config: MachineConfig): Machine {
  const issues = validateConfig(config);
  if (issues.length > 0) throw new InvalidConfigError(issues);

  const model = MODELS[config.model];
  const reflectorSpec = model.reflectors[config.reflector];
  if (!reflectorSpec) throw new InvalidConfigError([{ field: 'reflector', message: 'Riflettore mancante.' }]);

  const rotors = config.rotors.map((name, slot) => {
    const spec = model.rotors[name];
    if (!spec) throw new InvalidConfigError([{ field: 'rotors', message: `Rotore «${name}» mancante.` }]);
    const forward = wiringToMap(spec.wiring);
    return {
      name,
      forward,
      backward: invert(forward),
      notches: new Set([...spec.notches].map(toIndex)),
      ring: toIndex(config.rings[slot] ?? 'A'),
    };
  });

  const reflectorWiring = config.ukwD && reflectorSpec.rewirable ? ukwDWiring(config.ukwD) : reflectorSpec.wiring;
  const entryBackward = wiringToMap(model.entryWheel);
  const pairs = config.plugboard ?? [];
  const plugboard =
    config.uhr === undefined ? { forward: pairsToMap(pairs), backward: pairsToMap(pairs) } : uhrMaps(pairs, config.uhr);

  return {
    config,
    model,
    rotors,
    reflector: wiringToMap(reflectorWiring),
    // La lettera in posizione i della ruota d’ingresso è collegata al contatto i.
    entry: { forward: invert(entryBackward), backward: entryBackward },
    plugboard,
  };
}

export function initialState(machine: Machine): MachineState {
  return {
    positions: [...machine.config.positions].map(toIndex),
    reflectorPosition: toIndex(machine.config.reflectorPosition ?? 'A'),
  };
}

/** Compone uno stato con lettere al posto degli indici, utile per l’interfaccia. */
export function windowLetters(state: MachineState): string {
  return state.positions.map(toLetter).join('');
}

/**
 * Fa avanzare i rotori come alla pressione di un tasto, prima che il circuito si chiuda.
 *
 * - Leve e nottolini (modelli militari e commerciali): il rotore destro avanza sempre; un nottolino
 *   che trova la tacca del rotore alla sua destra spinge in avanti sia quel rotore sia quello alla
 *   sua sinistra. Da qui il “doppio passo” del rotore centrale.
 * - Ingranaggi (A-865 e serie G): funziona come un contachilometri, senza doppio passo, e alla fine
 *   della catena avanza anche il riflettore.
 */
export function step(machine: Machine, state: MachineState): StepResult {
  const positions = [...state.positions];
  const count = positions.length;
  const moved = positions.map(() => false);
  let reflectorPosition = state.reflectorPosition;
  let reflectorMoved = false;

  const atNotch = (slot: number) => machine.rotors[slot]?.notches.has(positions[slot] ?? -1) ?? false;
  const advance = (slot: number) => {
    positions[slot] = mod((positions[slot] ?? 0) + 1);
    moved[slot] = true;
  };

  const fast = count - 1;
  const middle = count - 2;
  const slow = count - 3;

  if (machine.model.stepping === 'gear') {
    const middleCarries = atNotch(fast);
    const slowCarries = middleCarries && atNotch(middle);
    const reflectorCarries = slowCarries && atNotch(slow);
    if (reflectorCarries && machine.model.reflectorRotates) {
      reflectorPosition = mod(reflectorPosition + 1);
      reflectorMoved = true;
    }
    if (slowCarries) advance(slow);
    if (middleCarries) advance(middle);
    advance(fast);
  } else {
    if (atNotch(middle)) {
      advance(slow);
      advance(middle);
    } else if (atNotch(fast)) {
      advance(middle);
    }
    advance(fast);
  }

  return { state: { positions, reflectorPosition }, moved, reflectorMoved };
}

/** Percorso del segnale con la macchina ferma nello stato indicato (nessun avanzamento). */
export function traceSignal(
  machine: Machine,
  state: MachineState,
  letter: string,
): { output: number; stages: Stage[] } {
  const stages: Stage[] = [];
  let contact = toIndex(letter);

  const pass = (kind: StageKind, direction: Stage['direction'], map: readonly number[]) => {
    const output = map[contact] ?? contact;
    stages.push({ kind, direction, input: contact, output });
    contact = output;
  };

  pass('plugboard', 'forward', machine.plugboard.forward);
  pass('entry', 'forward', machine.entry.forward);

  const throughRotor = (slot: number, direction: 'forward' | 'backward') => {
    const rotor = machine.rotors[slot];
    if (!rotor) return;
    const offset = (state.positions[slot] ?? 0) - rotor.ring;
    const coreInput = mod(contact + offset);
    const coreOutput = (direction === 'forward' ? rotor.forward : rotor.backward)[coreInput] ?? coreInput;
    const output = mod(coreOutput - offset);
    stages.push({ kind: 'rotor', direction, slot, input: contact, output, coreInput, coreOutput });
    contact = output;
  };

  for (let slot = machine.rotors.length - 1; slot >= 0; slot--) throughRotor(slot, 'forward');

  const reflectorOffset = state.reflectorPosition;
  const coreInput = mod(contact + reflectorOffset);
  const coreOutput = machine.reflector[coreInput] ?? coreInput;
  const reflected = mod(coreOutput - reflectorOffset);
  stages.push({ kind: 'reflector', direction: 'reflect', input: contact, output: reflected, coreInput, coreOutput });
  contact = reflected;

  for (let slot = 0; slot < machine.rotors.length; slot++) throughRotor(slot, 'backward');

  pass('entry', 'backward', machine.entry.backward);
  pass('plugboard', 'backward', machine.plugboard.backward);

  return { output: contact, stages };
}

/**
 * Preme un tasto: prima avanzano i rotori, poi passa la corrente.
 * Accetta solo lettere da A a Z; per qualunque altro carattere lancia un errore senza cambiare stato.
 */
export function pressKey(machine: Machine, state: MachineState, letter: string): KeyPress {
  if (!isLetter(letter)) throw new RangeError(`Il tasto «${letter}» non esiste sulla tastiera di Enigma.`);
  const stepped = step(machine, state);
  const { output, stages } = traceSignal(machine, stepped.state, letter);
  return { state: stepped.state, input: letter, output: toLetter(output), step: stepped, stages };
}

/** Cifra (o decifra) una sequenza di lettere A–Z. Usa `prepareText` per normalizzare un testo libero. */
export function encipher(
  machine: Machine,
  state: MachineState,
  letters: string,
): { state: MachineState; output: string } {
  let current = state;
  let output = '';
  for (const letter of letters) {
    const press = pressKey(machine, current, letter);
    current = press.state;
    output += press.output;
  }
  return { state: current, output };
}

/** Comodità per i casi semplici: crea la macchina, cifra il testo dalla posizione iniziale. */
export function encipherWith(config: MachineConfig, letters: string): string {
  const machine = createMachine(config);
  return encipher(machine, initialState(machine), letters).output;
}
