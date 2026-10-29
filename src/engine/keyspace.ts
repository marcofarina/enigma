/**
 * Conteggi dello spazio delle chiavi. Usano `bigint` perché i numeri superano presto la
 * precisione di `number` (2⁵³).
 */

function factorial(n: number): bigint {
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) result *= i;
  return result;
}

/**
 * Modi di collegare `cables` cavi sul pannello a spine da 26 prese:
 * 26! / ((26 − 2n)! · n! · 2ⁿ). Si scelgono le 2n lettere collegate, le si divide in coppie
 * e non conta né l’ordine delle coppie né quello delle due lettere in una coppia.
 */
export function plugboardSettings(cables: number): bigint {
  if (!Number.isInteger(cables) || cables < 0 || cables > 13) {
    throw new RangeError('Il pannello a spine accetta da 0 a 13 cavi.');
  }
  return factorial(26) / (factorial(26 - 2 * cables) * factorial(cables) * 2n ** BigInt(cables));
}

export interface KeySpaceOptions {
  /** Rotori tra cui scegliere i tre mobili (5 per l’Enigma I dal 1938, 8 per la marina). */
  rotors: number;
  /** Riflettori tra cui scegliere (sulla M4 il B e il C sottili). */
  reflectors: number;
  /** Rotori sottili tra cui scegliere (sulla M4 β e γ); 0 se la macchina non ne ha. */
  thinRotors: number;
  /** Anelli di cui contare la posizione: per i tre rotori mobili contano solo il destro e il centrale. */
  rings: number;
  /** Cavi sul pannello a spine. */
  cables: number;
  /**
   * Toglie le posizioni iniziali che danno la stessa cifratura per via del doppio passo:
   * 26 × 25 = 650 su 17 576, con rotori a una tacca.
   */
  doubleStep: boolean;
}

export type KeySpaceFactorId = 'rotorOrder' | 'reflector' | 'thinRotor' | 'rings' | 'positions' | 'plugboard';

export interface KeySpace {
  factors: { id: KeySpaceFactorId; value: bigint }[];
  total: bigint;
}

const LETTERS = 26n;

/** Impostazioni possibili della macchina, fattore per fattore, con i cablaggi noti a chi attacca. */
export function keySpace(options: KeySpaceOptions): KeySpace {
  const { rotors, reflectors, thinRotors, rings, cables, doubleStep } = options;
  if (!Number.isInteger(rotors) || rotors < 3) throw new RangeError('Servono almeno tre rotori.');
  const n = BigInt(rotors);
  const extra = thinRotors > 0 ? 1n : 0n;
  const threeRotors = doubleStep ? LETTERS ** 3n - LETTERS * (LETTERS - 1n) : LETTERS ** 3n;
  const factors: KeySpace['factors'] = [
    { id: 'rotorOrder', value: n * (n - 1n) * (n - 2n) },
    { id: 'reflector', value: BigInt(Math.max(1, reflectors)) },
    { id: 'thinRotor', value: BigInt(Math.max(1, thinRotors)) },
    { id: 'rings', value: LETTERS ** BigInt(rings) },
    { id: 'positions', value: threeRotors * LETTERS ** extra },
    { id: 'plugboard', value: plugboardSettings(cables) },
  ];
  return { factors, total: factors.reduce((product, { value }) => product * value, 1n) };
}

/** Logaritmo in base 2 di un intero positivo grande, con la precisione di un `number`. */
export function log2(value: bigint): number {
  if (value <= 0n) throw new RangeError('Il logaritmo richiede un numero positivo.');
  const bits = value.toString(2).length;
  const shift = Math.max(0, bits - 53);
  return shift + Math.log2(Number(value >> BigInt(shift)));
}
