import { createMachine, cycles, encipher, initialState, toIndex, toLetter, type MachineConfig } from '@/engine';
import { int, type Rng } from '@/exercises/random.ts';
import { compose, machineMap, statesAfter } from './scrambler.ts';

/**
 * Il metodo delle caratteristiche di Rejewski. Fino al 15 settembre 1938 tutti gli operatori di
 * una rete cifravano due volte la chiave del messaggio partendo dalla stessa posizione del giorno:
 * la prima e la quarta lettera dell’indicatore sono la stessa lettera cifrata con le sostituzioni
 * A₁ e A₄. Dagli indicatori si ricava quindi il prodotto A₁A₄ (prima A₁, poi A₄), e lo stesso per
 * A₂A₅ e A₃A₆.
 */

/** Le sei sostituzioni con cui si cifrano le sei lettere dell’indicatore. */
export function indicatorMaps(config: MachineConfig): number[][] {
  const machine = createMachine(config);
  return statesAfter(machine, initialState(machine), 6).map((state) => machineMap(machine, state));
}

/** I tre prodotti AD, BE, CF: dalla lettera in posizione k alla lettera in posizione k + 3. */
export function indicatorProducts(config: MachineConfig): number[][] {
  const maps = indicatorMaps(config);
  return [0, 1, 2].map((k) => compose(maps[k] ?? [], maps[k + 3] ?? []));
}

/**
 * La “caratteristica” del giorno: le lunghezze dei cicli dei tre prodotti. Non dipende dal
 * pannello a spine, che cambia le lettere dei cicli ma non le loro lunghezze.
 */
export function characteristic(config: MachineConfig): number[][] {
  return indicatorProducts(config).map((map) =>
    cycles(map)
      .map((cycle) => cycle.length)
      .sort((a, b) => b - a),
  );
}

export interface Intercept {
  /** Chiave del messaggio scelta dall’operatore. */
  key: string;
  /** Le sei lettere trasmesse. */
  indicator: string;
}

/** Indicatori di una giornata: chiavi del messaggio casuali, cifrate due volte dalla posizione del giorno. */
export function intercepts(config: MachineConfig, rng: Rng, count: number): Intercept[] {
  const machine = createMachine(config);
  const start = initialState(machine);
  return Array.from({ length: count }, () => {
    const key = Array.from({ length: 3 }, () => toLetter(int(rng, 0, 25))).join('');
    return { key, indicator: encipher(machine, start, key + key).output };
  });
}

/** Tabella parziale di un prodotto, ricostruita dagli indicatori: lettera k → lettera k + 3. */
export function partialProduct(indicators: readonly string[], k: number): (number | null)[] {
  const table: (number | null)[] = new Array<number | null>(26).fill(null);
  for (const indicator of indicators) {
    const from = indicator[k];
    const to = indicator[k + 3];
    if (from && to) table[toIndex(from)] = toIndex(to);
  }
  return table;
}

/**
 * Catene di una tabella parziale: i cicli completi e i tratti ancora aperti, ciascuno a partire
 * dalla lettera più piccola che non ha predecessori noti.
 */
export function chains(table: readonly (number | null)[]): { letters: number[]; closed: boolean }[] {
  const predecessor = new Set(table.filter((x): x is number => x !== null));
  const seen = new Set<number>();
  const result: { letters: number[]; closed: boolean }[] = [];
  const follow = (start: number) => {
    const letters: number[] = [];
    let current: number | null = start;
    while (current !== null && !seen.has(current)) {
      seen.add(current);
      letters.push(current);
      current = table[current] ?? null;
    }
    result.push({ letters, closed: current === start });
  };
  // Prima i tratti aperti (che cominciano da una lettera senza predecessore noto), poi i cicli.
  for (let i = 0; i < 26; i++) if (!predecessor.has(i) && table[i] !== null) follow(i);
  for (let i = 0; i < 26; i++) if (!seen.has(i) && table[i] !== null) follow(i);
  return result;
}
