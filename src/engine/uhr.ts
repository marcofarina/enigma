import { toIndex } from './alphabet.ts';

/**
 * Enigma-Uhr: accessorio della Luftwaffe (luglio 1944) che si collega al pannello a spine con
 * 10 coppie di cavi (spine rosse “a” e bianche “b”). Un selettore a 40 posizioni rimescola i
 * collegamenti: solo le posizioni multiple di 4 danno una sostituzione reciproca.
 *
 * Tabelle e logica riprendono il simulatore di Summerside Makerspace. Ogni spina ha due
 * contatti: il segnale verso i rotori usa il primo, quello di ritorno il secondo (offset 2),
 * per cui andata e ritorno sono una permutazione e la sua inversa.
 */

/** Collegamenti interni del disco tra i 40 contatti del lato a e quelli del lato b. */
const AB_WIRING = [
  6, 31, 4, 29, 18, 39, 16, 25, 30, 23, 28, 1, 38, 11, 36, 37, 26, 27, 24, 21, 14, 3, 12, 17, 2, 7, 0, 33, 10, 35, 8, 5,
  22, 19, 20, 13, 34, 15, 32, 9,
];

/** Ordine delle spine bianche (b) intorno al disco. */
const B_PLUG_ORDER = [6, 0, 7, 5, 1, 8, 4, 2, 9, 3];

const CONTACTS = 40;

export interface UhrMaps {
  /** Sostituzione dal tasto verso la ruota d’ingresso. */
  forward: number[];
  /** Sostituzione dalla ruota d’ingresso verso le lampade. */
  backward: number[];
}

function route(pairs: readonly string[], setting: number, offset: number): number[] {
  const map = Array.from({ length: 26 }, (_, i) => i);
  const aPlugs = pairs.map((pair) => toIndex(pair[0] ?? ''));
  const bPlugs = pairs.map((pair) => toIndex(pair[1] ?? ''));

  aPlugs.forEach((letter, plug) => {
    const aWire = (plug * 4 + setting + offset) % CONTACTS;
    const bPosition = ((AB_WIRING[aWire] ?? 0) + CONTACTS - setting) % CONTACTS;
    const target = bPlugs[B_PLUG_ORDER[Math.floor(bPosition / 4)] ?? -1];
    if (target !== undefined) map[letter] = target;
  });

  bPlugs.forEach((letter, plug) => {
    const bWire = (B_PLUG_ORDER.indexOf(plug) * 4 + setting + offset) % CONTACTS;
    const aPosition = (AB_WIRING.indexOf(bWire) + CONTACTS - setting) % CONTACTS;
    const target = aPlugs[Math.floor(aPosition / 4)];
    if (target !== undefined) map[letter] = target;
  });

  return map;
}

/** Calcola le due sostituzioni dell’Uhr per 10 coppie di cavi e una posizione del selettore. */
export function uhrMaps(pairs: readonly string[], setting: number): UhrMaps {
  return { forward: route(pairs, setting, 0), backward: route(pairs, setting, 2) };
}
