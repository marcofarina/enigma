/** Alfabeto della macchina: 26 lettere latine maiuscole, senza accenti. */
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const LETTER_COUNT = 26;

/** Modulo sempre non negativo (in JavaScript `-1 % 26` vale `-1`). */
export function mod(n: number, m: number = LETTER_COUNT): number {
  return ((n % m) + m) % m;
}

export function isLetter(value: string): boolean {
  return value.length === 1 && value >= 'A' && value <= 'Z';
}

/** `A` → 0, …, `Z` → 25. */
export function toIndex(letter: string): number {
  if (!isLetter(letter)) throw new RangeError(`«${letter}» non è una lettera da A a Z`);
  return letter.charCodeAt(0) - 65;
}

/** 0 → `A`, …, 25 → `Z`; gli indici fuori intervallo vengono ridotti modulo 26. */
export function toLetter(index: number): string {
  return String.fromCharCode(65 + mod(index));
}

/** Verifica che una stringa sia una permutazione dell’alfabeto. */
export function isPermutation(wiring: string): boolean {
  return wiring.length === LETTER_COUNT && new Set(wiring).size === LETTER_COUNT && [...wiring].every(isLetter);
}

/** Inverte una permutazione espressa come array di indici. */
export function invert(map: readonly number[]): number[] {
  const inverse = new Array<number>(map.length);
  map.forEach((target, source) => {
    inverse[target] = source;
  });
  return inverse;
}

/**
 * Scompone una permutazione in cicli disgiunti, ciascuno a partire dalla lettera più piccola,
 * ordinati per lettera iniziale. I punti fissi sono cicli di lunghezza 1.
 */
export function cycles(map: readonly number[]): number[][] {
  const seen = new Set<number>();
  const result: number[][] = [];
  map.forEach((_, start) => {
    if (seen.has(start)) return;
    const cycle: number[] = [];
    for (let i = start; !seen.has(i); i = map[i] ?? i) {
      seen.add(i);
      cycle.push(i);
    }
    result.push(cycle);
  });
  return result;
}

/** Lunghezze dei cicli in ordine decrescente: la “struttura in cicli” della permutazione. */
export function cycleType(map: readonly number[]): number[] {
  return cycles(map)
    .map((cycle) => cycle.length)
    .sort((a, b) => b - a);
}
