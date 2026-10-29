/**
 * Progressi degli esercizi: per ogni esercizio, i semi delle varianti risolte. Restano nel
 * browser (localStorage) e possono mancare del tutto, per esempio in una finestra privata:
 * ogni lettura e scrittura è protetta e in caso di problemi si riparte da zero.
 */

export type Progress = Record<string, number[]>;

const STORAGE_KEY = 'enigma-esercizi';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadProgress(storage: StorageLike | null = defaultStorage()): Progress {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const progress: Progress = {};
    for (const [id, seeds] of Object.entries(parsed)) {
      if (Array.isArray(seeds)) progress[id] = seeds.filter((seed): seed is number => Number.isInteger(seed));
    }
    return progress;
  } catch {
    return {};
  }
}

/** Segna una variante come risolta e restituisce i progressi aggiornati. */
export function markSolved(id: string, seed: number, storage: StorageLike | null = defaultStorage()): Progress {
  const progress = loadProgress(storage);
  const seeds = progress[id] ?? [];
  if (!seeds.includes(seed)) progress[id] = [...seeds, seed];
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Archiviazione piena o bloccata: il progresso vale solo per questa visita.
  }
  return progress;
}
