import { LETTER_COUNT, stageMap, toLetter, type Machine, type MachineState, type Stage } from '@/engine';

/**
 * Geometria dello schema del circuito. Le colonne vanno da sinistra a destra: riflettore,
 * rotori (dal più lento al più veloce), ruota d’ingresso, pannello a spine (o Uhr), tasti e
 * lampade. Ogni riga è un contatto dello statore, quindi tra una colonna e l’altra i fili sono
 * orizzontali e dentro ogni componente si vede la sostituzione che opera in quel momento.
 */

export type ColumnKind = 'keys' | 'plugboard' | 'entry' | 'rotor' | 'reflector';
export type Mark = 'forward' | 'return' | 'both' | null;

export interface Column {
  kind: ColumnKind;
  /** Slot del rotore, da sinistra. */
  slot?: number;
  x: number;
  width: number;
  /** Lettere dei contatti, dall’alto in basso (sui rotori scorrono con la posizione). */
  labels: string[];
  /** Ascisse delle etichette: a sinistra e a destra (coincidono per tasti e riflettore). */
  leftX: number;
  rightX: number;
  /** Contatti attraversati dal segnale, per lato. */
  leftMarks: Mark[];
  rightMarks: Mark[];
  /** Tutti i collegamenti interni, come percorsi SVG. */
  wiring: string[];
}

export interface Schematic {
  width: number;
  height: number;
  top: number;
  rowHeight: number;
  columns: Column[];
  /** Percorso di andata (fino al riflettore compreso) e di ritorno, vuoti se nessun tasto è premuto. */
  forward: string;
  back: string;
}

export const ROW_HEIGHT = 18;
const TOP = 52;
const BOTTOM = 12;
const GAP = 28;
const LABEL = 20;
const WIDTHS: Record<ColumnKind, number> = { keys: 44, plugboard: 72, entry: 72, rotor: 84, reflector: 60 };

const rowY = (row: number) => TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2;
const alphabet = (shift = 0) => Array.from({ length: LETTER_COUNT }, (_, i) => toLetter(i + shift));
const noMarks = (): Mark[] => Array.from({ length: LETTER_COUNT }, () => null);

function mark(marks: Mark[], row: number, value: 'forward' | 'return') {
  const current = marks[row] ?? null;
  marks[row] = current === null || current === value ? value : 'both';
}

/** Sostituzione vista dallo statore per ciascun componente, nel verso dell’andata. */
function statorMap(machine: Machine, state: MachineState, column: Column): number[] {
  if (column.kind === 'keys') return Array.from({ length: LETTER_COUNT }, (_, i) => i);
  const direction = column.kind === 'reflector' ? 'reflect' : 'forward';
  return stageMap(machine, state, {
    kind: column.kind,
    direction,
    ...(column.slot === undefined ? {} : { slot: column.slot }),
  });
}

const innerLeft = (c: Column) => c.x + LABEL;
const innerRight = (c: Column) => c.x + c.width - LABEL;

function reflectorCurve(c: Column, from: number, to: number): string {
  const bend = c.x + 8;
  return `C ${bend} ${rowY(from)} ${bend} ${rowY(to)} ${innerRight(c)} ${rowY(to)}`;
}

/**
 * `progress` limita il percorso disegnato ai primi stadi, per la traccia passo-passo: con 0 si
 * vede solo il tasto premuto, con `stages.length` il segnale è arrivato al pannello di ritorno e
 * da `stages.length + 1` in poi raggiunge la lampada. Per difetto il percorso è completo.
 */
export function layoutSchematic(
  machine: Machine,
  state: MachineState,
  stages: readonly Stage[] = [],
  progress = stages.length + 1,
): Schematic {
  const kinds: { kind: ColumnKind; slot?: number }[] = [
    { kind: 'reflector' },
    ...machine.rotors.map((_, slot) => ({ kind: 'rotor' as const, slot })),
    { kind: 'entry' },
    { kind: 'plugboard' },
    { kind: 'keys' },
  ];
  const reflectorShift =
    machine.model.reflectorSettable || machine.model.reflectorRotates ? state.reflectorPosition : 0;

  let x = GAP / 2;
  const columns: Column[] = kinds.map(({ kind, slot }) => {
    const width = WIDTHS[kind];
    const oneSided = kind === 'keys' || kind === 'reflector';
    const labels =
      kind === 'rotor'
        ? alphabet(state.positions[slot ?? 0] ?? 0)
        : kind === 'reflector'
          ? alphabet(reflectorShift)
          : alphabet();
    const column: Column = {
      kind,
      ...(slot === undefined ? {} : { slot }),
      x,
      width,
      labels,
      leftX: kind === 'keys' ? x + width / 2 : kind === 'reflector' ? x + width - LABEL / 2 : x + LABEL / 2,
      rightX: kind === 'keys' ? x + width / 2 : x + width - LABEL / 2,
      leftMarks: noMarks(),
      rightMarks: noMarks(),
      wiring: [],
    };
    if (oneSided) column.leftMarks = column.rightMarks;
    x += width + GAP;
    return column;
  });

  for (const column of columns) {
    if (column.kind === 'keys') continue;
    const map = statorMap(machine, state, column);
    column.wiring = map.flatMap((target, source) => {
      if (column.kind !== 'reflector') {
        return [`M ${innerRight(column)} ${rowY(source)} L ${innerLeft(column)} ${rowY(target)}`];
      }
      return source < target
        ? [`M ${innerRight(column)} ${rowY(source)} ${reflectorCurve(column, source, target)}`]
        : [];
    });
  }

  const find = (kind: ColumnKind, slot?: number) =>
    columns.find((c) => c.kind === kind && (slot === undefined || c.slot === slot));
  const keys = find('keys');
  let forward = '';
  let back = '';

  if (keys && stages.length > 0) {
    const first = stages[0];
    const last = stages.at(-1);
    const complete = progress > stages.length;
    if (first && last) {
      mark(keys.rightMarks, first.input, 'forward');
      if (complete) mark(keys.rightMarks, last.output, 'return');
      forward = `M ${keys.leftX} ${rowY(first.input)}`;
      back = '';
      for (const stage of stages.slice(0, Math.max(0, progress))) {
        const column = find(stage.kind, stage.slot);
        if (!column) continue;
        const yIn = rowY(stage.input);
        const yOut = rowY(stage.output);
        if (stage.direction === 'forward') {
          mark(column.rightMarks, stage.input, 'forward');
          mark(column.leftMarks, stage.output, 'forward');
          forward += ` L ${column.rightX} ${yIn} L ${innerRight(column)} ${yIn} L ${innerLeft(column)} ${yOut} L ${column.leftX} ${yOut}`;
        } else if (stage.direction === 'reflect') {
          mark(column.rightMarks, stage.input, 'forward');
          mark(column.rightMarks, stage.output, 'return');
          forward += ` L ${column.rightX} ${yIn} L ${innerRight(column)} ${yIn} ${reflectorCurve(column, stage.input, stage.output)}`;
          back = `M ${innerRight(column)} ${yOut} L ${column.rightX} ${yOut}`;
        } else {
          mark(column.leftMarks, stage.input, 'return');
          mark(column.rightMarks, stage.output, 'return');
          back += ` L ${column.leftX} ${yIn} L ${innerLeft(column)} ${yIn} L ${innerRight(column)} ${yOut} L ${column.rightX} ${yOut}`;
        }
      }
      if (complete) back += ` L ${keys.rightX} ${rowY(last.output)}`;
    }
  }

  return {
    width: x - GAP / 2,
    height: TOP + LETTER_COUNT * ROW_HEIGHT + BOTTOM,
    top: TOP,
    rowHeight: ROW_HEIGHT,
    columns,
    forward,
    back,
  };
}

export { rowY };
