import { encipherWith, groupLetters, prepareText, toLetter, type MachineConfig } from '@/engine';
import { EXERCISES } from './catalog.ts';
import { MILITARY_ROTORS, randomLetters, randomPairs } from './keys.ts';
import { randomMessage } from './messages.ts';
import { createRng, int, isSeed, MAX_SEED, shuffle, type Rng } from './random.ts';
import type { Variant } from './types.ts';

/**
 * Schede stampabili per la classe. Ogni scheda nasce da un seme, come gli esercizi: contiene un
 * foglio chiave mensile, alcuni messaggi intercettati da decifrare e, a scelta, varianti degli
 * esercizi del catalogo. Il foglio chiave segue lo schema dei Luftwaffen-Maschinenschlüssel del
 * 1944 (vedi il Nr. 619 su CryptoCellar): numero del foglio, giorno, ordine dei rotori, anelli
 * in numeri, dieci cavi, quattro gruppi di riconoscimento. I giorni vanno dal 31 all’1, così
 * l’operatore poteva tagliare e distruggere le righe già usate.
 */

export interface DailyKey {
  day: number;
  rotors: string[];
  /** Anelli come sui rotori dell’Enigma I: numeri da 1 a 26. */
  rings: number[];
  plugboard: string[];
  /** Gruppi di riconoscimento (Kenngruppen): indicano la rete, non servono a decifrare. */
  identifiers: string[];
}

export interface InterceptedMessage {
  day: number;
  /** Posizione scelta dall’operatore, trasmessa in chiaro. */
  start: string;
  /** Chiave del messaggio cifrata con i rotori nella posizione `start`. */
  encryptedKey: string;
  cipher: string;
  /** Soluzione. */
  messageKey: string;
  plain: string;
}

export interface Sheet {
  seed: number;
  /** Numero del foglio chiave, stampato su ogni riga come sugli originali. */
  number: number;
  keys: DailyKey[];
  messages: InterceptedMessage[];
  extras: { id: string; title: string; variant: Variant }[];
}

export interface SheetOptions {
  messages: number;
  /** Identificativi degli esercizi da aggiungere, generati con lo stesso seme della scheda. */
  extras: readonly string[];
}

export const DAYS = 31;

function dailyKey(rng: Rng, day: number): DailyKey {
  return {
    day,
    rotors: shuffle(rng, MILITARY_ROTORS).slice(0, 3),
    rings: Array.from({ length: 3 }, () => int(rng, 1, 26)),
    plugboard: randomPairs(rng, 10),
    identifiers: Array.from({ length: 4 }, () => randomLetters(rng, 3).toLowerCase()),
  };
}

/** Configurazione della macchina per il giorno indicato, con i rotori nella posizione data. */
export function configFor(key: DailyKey, positions: string): MachineConfig {
  return {
    model: 'I',
    rotors: [...key.rotors],
    rings: key.rings.map((ring) => toLetter(ring - 1)).join(''),
    positions,
    reflector: 'B',
    plugboard: [...key.plugboard],
  };
}

/**
 * Messaggio cifrato con la procedura in uso dal 1940 per esercito e aviazione, come la descrive
 * il rapporto del 6812th Signal Security Detachment: l’operatore sceglie una posizione di
 * partenza e la trasmette in chiaro, con i rotori in quella posizione cifra la chiave del
 * messaggio una sola volta, poi porta i rotori sulla chiave e cifra il testo.
 */
function intercepted(rng: Rng, key: DailyKey): InterceptedMessage {
  const start = randomLetters(rng, 3);
  const messageKey = randomLetters(rng, 3);
  const text = randomMessage(rng, 'long');
  return {
    day: key.day,
    start,
    encryptedKey: encipherWith(configFor(key, start), messageKey),
    cipher: groupLetters(encipherWith(configFor(key, messageKey), prepareText(text))),
    messageKey,
    plain: text,
  };
}

export function generateSheet(seed: number, options: SheetOptions): Sheet {
  const rng = createRng(seed);
  const number = int(rng, 100, 999);
  const keys = Array.from({ length: DAYS }, (_, i) => dailyKey(rng, DAYS - i));
  const days = shuffle(
    rng,
    keys.map((key) => key.day),
  )
    .slice(0, options.messages)
    .sort((a, b) => a - b);
  const messages = days.map((day) => intercepted(rng, keys[DAYS - day] as DailyKey));
  const extras = EXERCISES.filter((exercise) => options.extras.includes(exercise.id)).map((exercise) => ({
    id: exercise.id,
    title: exercise.title,
    variant: exercise.generate(seed),
  }));
  return { seed, number, keys, messages, extras };
}

/** Semi di una serie per la classe: consecutivi a partire da `first`, ricominciando da 1 dopo il massimo. */
export function classSeeds(first: number, count: number): number[] {
  const start = isSeed(first) ? first : 1;
  return Array.from({ length: count }, (_, i) => ((start - 1 + i) % MAX_SEED) + 1);
}
