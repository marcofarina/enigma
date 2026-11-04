import {
  ALPHABETIC_ETW,
  MODEL_IDS,
  MODELS,
  QWERTZ_ETW,
  type ModelId,
  type ModelPeriod,
  type ModelSpec,
} from '@/engine';

/**
 * Dati della lezione «Modelli a confronto», ricavati dal catalogo del motore: la tabella e la linea
 * del tempo non hanno valori scritti a mano.
 */

/** Le tre famiglie in cui la lezione divide i modelli, riconosciute dalle caratteristiche. */
export type Family = 'military' | 'commercial' | 'counter';

export function family(model: ModelSpec): Family {
  if (model.plugboard) return 'military';
  if (model.stepping === 'gear') return 'counter';
  return 'commercial';
}

export const FAMILIES: readonly Family[] = ['military', 'commercial', 'counter'];

export type EntryWheel = 'alphabetic' | 'keyboard' | 'own';

export function entryWheel(model: ModelSpec): EntryWheel {
  if (model.entryWheel === ALPHABETIC_ETW) return 'alphabetic';
  if (model.entryWheel === QWERTZ_ETW) return 'keyboard';
  return 'own';
}

export type ReflectorKind = 'fixed' | 'settable' | 'moving';

export function reflectorKind(model: ModelSpec): ReflectorKind {
  if (model.reflectorRotates) return 'moving';
  return model.reflectorSettable ? 'settable' : 'fixed';
}

export function hasRewirableReflector(model: ModelSpec): boolean {
  return Object.values(model.reflectors).some((reflector) => reflector.rewirable);
}

/** Rotori fra cui scegliere: quelli che avanzano e, nella M4, quelli sottili. */
export function rotorCount(model: ModelSpec): { regular: number; thin: number } {
  const specs = Object.values(model.rotors);
  return { regular: specs.filter((s) => !s.thin).length, thin: specs.filter((s) => s.thin).length };
}

/** Nomi consecutivi nel catalogo scritti come intervallo, se sono almeno tre: «I–V». */
function compactNames(names: readonly string[], catalog: readonly string[]): string {
  const parts: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 3) parts.push(`${run[0]}–${run[run.length - 1]}`);
    else parts.push(...run);
    run = [];
  };
  for (const name of names) {
    const previous = run[run.length - 1];
    if (previous !== undefined && catalog.indexOf(name) !== catalog.indexOf(previous) + 1) flush();
    run.push(name);
  }
  flush();
  return parts.join(', ');
}

/**
 * Tacche per rotore, esclusi i rotori sottili che non avanzano. Se tutti i rotori ne hanno lo stesso
 * numero basta il numero; altrimenti ogni numero ha accanto i rotori che lo hanno: «1 (I–V); 2 (VI–VIII)».
 */
export function notchSummary(model: ModelSpec): string {
  const regular = Object.entries(model.rotors).filter(([, spec]) => !spec.thin);
  const catalog = regular.map(([name]) => name);
  const groups = new Map<number, string[]>();
  for (const [name, spec] of regular) {
    const count = spec.notches.length;
    groups.set(count, [...(groups.get(count) ?? []), name]);
  }
  if (groups.size === 1) return String([...groups.keys()][0]);
  return [...groups.entries()].map(([count, names]) => `${count} (${compactNames(names, catalog)})`).join('; ');
}

/** Primo e ultimo anno della linea del tempo, compresi. */
export const TIMELINE_START = 1925;
export const TIMELINE_END = 1950;

export interface TimelineBar {
  id: ModelId;
  label: string;
  period: ModelPeriod;
  users?: string | undefined;
  /** Posizione e larghezza della barra, in percentuale dell’asse. */
  left: number;
  width: number;
  /** La fonte non dà l’ultimo anno: la barra arriva al bordo dell’asse. */
  open: boolean;
}

/** Posizione in percentuale dell’inizio di un anno sull’asse della linea del tempo. */
export function yearOffset(year: number): number {
  return ((year - TIMELINE_START) / (TIMELINE_END - TIMELINE_START + 1)) * 100;
}

/** Modelli con anni documentati, in ordine di primo anno; a parità, nell’ordine del catalogo. */
export function timelineBars(ids: readonly ModelId[] = MODEL_IDS): TimelineBar[] {
  return ids
    .map((id) => MODELS[id])
    .filter((model): model is ModelSpec & { period: ModelPeriod } => model.period !== undefined)
    .map((model) => {
      const { period } = model;
      const last = period.to ?? TIMELINE_END;
      return {
        id: model.id,
        label: model.label,
        period,
        users: model.users,
        left: yearOffset(period.from),
        width: yearOffset(last + 1) - yearOffset(period.from),
        open: period.to === undefined,
      };
    })
    .sort((a, b) => a.period.from - b.period.from);
}

/** Modelli che la linea del tempo non può mostrare, perché la fonte non dà anni. */
export function undatedModels(ids: readonly ModelId[] = MODEL_IDS): ModelSpec[] {
  return ids.map((id) => MODELS[id]).filter((model) => model.period === undefined);
}
