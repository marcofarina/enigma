import {
  defaultConfig,
  defaultRotors,
  expectedRotorCount,
  MODELS,
  UKW_D_DEFAULT_WIRING,
  UKW_D_FIXED_PAIR,
  type MachineConfig,
  type ModelId,
} from '@/engine';

/**
 * Modifiche alla configurazione fatte dal pannello. Sono funzioni pure: restituiscono una
 * configurazione nuova, che può essere incompleta (per esempio l’Uhr con meno di 10 cavi);
 * è `validateConfig` a decidere se la macchina può cifrare.
 */

type OptionalKey = 'reflectorPosition' | 'plugboard' | 'uhr' | 'ukwD';

function without(config: MachineConfig, ...keys: OptionalKey[]): MachineConfig {
  const copy: MachineConfig = { ...config };
  for (const key of keys) delete copy[key];
  return copy;
}

/** Cambia modello ripartendo dalla sua configurazione di base; i cavi restano se il modello ha il pannello. */
export function changeModel(config: MachineConfig, id: ModelId): MachineConfig {
  const next = defaultConfig(id);
  const plugboard = config.plugboard ?? [];
  if (!MODELS[id].plugboard || plugboard.length === 0) return next;
  return { ...next, plugboard, ...(config.uhr !== undefined && MODELS[id].uhr ? { uhr: config.uhr } : {}) };
}

/** Le 12 coppie del cablaggio di riferimento dell’UKW-D (J–Y esclusa). */
export function defaultUkwDPairs(): string[] {
  const pairs: string[] = [];
  [...UKW_D_DEFAULT_WIRING].forEach((target, i) => {
    const source = String.fromCharCode(65 + i);
    if (source < target && !UKW_D_FIXED_PAIR.includes(source)) pairs.push(source + target);
  });
  return pairs;
}

/** Cambia riflettore. Sulla M4 passare dal riflettore sottile all’UKW-D toglie il rotore sottile, e viceversa. */
export function changeReflector(config: MachineConfig, reflector: string): MachineConfig {
  const model = MODELS[config.model];
  const spec = model.reflectors[reflector];
  const before = config.rotors.length;
  const count = expectedRotorCount(model, reflector);
  let next: MachineConfig = without({ ...config, reflector }, 'ukwD');
  if (count !== before) {
    const rotors =
      count < before
        ? config.rotors.slice(before - count)
        : [...defaultRotors(model, reflector).slice(0, 1), ...config.rotors];
    const resize = (value: string) => (count < before ? value.slice(before - count) : 'A' + value);
    next = { ...next, rotors, rings: resize(config.rings), positions: resize(config.positions) };
  }
  return spec?.rewirable ? { ...next, ukwD: defaultUkwDPairs() } : next;
}

/** Monta un rotore in uno slot. Se era già montato altrove, i due rotori si scambiano di posto. */
export function changeRotor(config: MachineConfig, slot: number, name: string): MachineConfig {
  const rotors = [...config.rotors];
  const other = rotors.indexOf(name);
  const current = rotors[slot];
  if (current === undefined) return config;
  if (other >= 0 && other !== slot) rotors[other] = current;
  rotors[slot] = name;
  return { ...config, rotors };
}

function replaceAt(value: string, index: number, letter: string): string {
  return value.slice(0, index) + letter + value.slice(index + 1);
}

export function changeRing(config: MachineConfig, slot: number, letter: string): MachineConfig {
  return { ...config, rings: replaceAt(config.rings, slot, letter) };
}

export function changePosition(config: MachineConfig, slot: number, letter: string): MachineConfig {
  return { ...config, positions: replaceAt(config.positions, slot, letter) };
}

export function changeReflectorPosition(config: MachineConfig, letter: string): MachineConfig {
  return letter === 'A' ? without(config, 'reflectorPosition') : { ...config, reflectorPosition: letter };
}

export function changePlugboard(config: MachineConfig, pairs: readonly string[]): MachineConfig {
  return pairs.length === 0 ? without(config, 'plugboard') : { ...config, plugboard: [...pairs] };
}

/** Collega (con una posizione del selettore) o scollega l’Uhr. */
export function changeUhr(config: MachineConfig, setting: number | undefined): MachineConfig {
  return setting === undefined ? without(config, 'uhr') : { ...config, uhr: setting };
}

export function changeUkwD(config: MachineConfig, pairs: readonly string[]): MachineConfig {
  return { ...config, ukwD: [...pairs] };
}

/**
 * Legge coppie di lettere scritte a mano: si tengono solo le lettere (accenti e minuscole
 * compresi) e si raggruppano a due a due, quindi “ab cd”, “AB.CD” e “ABCD” sono equivalenti.
 * Un’eventuale lettera spaiata in fondo viene restituita a parte.
 */
export function parsePairs(text: string): { pairs: string[]; pending: string } {
  const letters = text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const pairs: string[] = [];
  for (let i = 0; i + 1 < letters.length; i += 2) pairs.push(letters.slice(i, i + 2));
  return { pairs, pending: letters.length % 2 === 1 ? letters.slice(-1) : '' };
}

export function formatPairs(pairs: readonly string[]): string {
  return pairs.join(' ');
}

/**
 * Collegamento con due clic: il primo sceglie una presa, il secondo la collega. Un clic su una
 * presa già collegata stacca il cavo; un secondo clic sulla presa in attesa la rilascia.
 */
export function togglePlug(
  pairs: readonly string[],
  pending: string | null,
  letter: string,
): { pairs: string[]; pending: string | null } {
  const connected = pairs.find((pair) => pair.includes(letter));
  if (connected) return { pairs: pairs.filter((pair) => pair !== connected), pending: null };
  if (pending === null) return { pairs: [...pairs], pending: letter };
  if (pending === letter) return { pairs: [...pairs], pending: null };
  return { pairs: [...pairs, pending + letter], pending: null };
}
