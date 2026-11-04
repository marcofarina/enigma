import { LETTER_COUNT, stageMap, type Machine, type MachineState, type Stage } from '@/engine';

/**
 * Geometria dello schema della home (docs/design.md, «Griglia»). Le misure sono unità del
 * `viewBox`, cioè px a 1280×720: lo schema si scala con la radice del documento.
 *
 * Da destra a sinistra: lettere dei tasti, colonna delle spine (pannello e ruota d’ingresso
 * insieme), rotori dal più veloce al più lento, riflettore. Ogni riga è un contatto dello statore.
 * All’andata il segnale va verso sinistra, al ritorno verso destra.
 */

export const VIEW_WIDTH = 766;
export const ROW = 18;
export const VIEW_HEIGHT = ROW * LETTER_COUNT + 2;
/** Bordo destro della colonna delle spine, dove arrivano i fili dei tasti. */
export const KEYS_EDGE = 730;
/** Ascissa delle lettere dei tasti. */
export const KEYS_X = 740;
/** Fra la colonna delle spine e il primo rotore. */
export const SPINE_EDGE = 640;
/** Fra il rotore più lento e il riflettore. */
export const REFLECTOR_EDGE = 100;
/** Tratto orizzontale dei fili prima e dopo la diagonale. */
const LEAD = 20;
/** Gomito più interno dei fili del riflettore. */
const REFLECTOR_BEND = 18;

export const rowY = (row: number) => ROW / 2 + 1 + row * ROW;

export interface RotorColumn {
  slot: number;
  /** Bordo d’ingresso all’andata (destra) e d’uscita (sinistra). */
  right: number;
  left: number;
  center: number;
}

export function rotorColumns(count: number): RotorColumn[] {
  const width = (SPINE_EDGE - REFLECTOR_EDGE) / count;
  return Array.from({ length: count }, (_, slot) => {
    const left = REFLECTOR_EDGE + slot * width;
    return { slot, left, right: left + width, center: left + width / 2 };
  });
}

/** Centro della colonna delle spine, per l’etichetta in testa. */
export const SPINE_CENTER = (SPINE_EDGE + KEYS_EDGE) / 2 + 0.5;
/** Centro della colonna del riflettore. */
export const REFLECTOR_CENTER = (REFLECTOR_EDGE + REFLECTOR_BEND) / 2;

const crossing = (right: number, left: number, map: readonly number[]) =>
  map.map((target, source) => `M${right} ${rowY(source)}h${-LEAD}L${left + LEAD} ${rowY(target)}h${-LEAD}`).join('');

const reflectorBend = (a: number, b: number) => REFLECTOR_BEND + Math.abs(b - a) * 3;

export interface Wiring {
  spine: string;
  /** Un percorso per rotore, nello stesso ordine degli slot. */
  rotors: string[];
  reflector: string;
}

/** Tutti i fili, nella posizione attuale dei rotori. */
export function wiring(machine: Machine, state: MachineState): Wiring {
  const plug = stageMap(machine, state, { kind: 'plugboard', direction: 'forward' });
  const entry = stageMap(machine, state, { kind: 'entry', direction: 'forward' });
  const spine = plug.map((contact) => entry[contact] ?? contact);
  const columns = rotorColumns(machine.rotors.length);
  const rotors = columns.map((column) =>
    crossing(
      column.right,
      column.left,
      stageMap(machine, state, { kind: 'rotor', direction: 'forward', slot: column.slot }),
    ),
  );
  const reflectorMap = stageMap(machine, state, { kind: 'reflector', direction: 'reflect' });
  let reflector = '';
  reflectorMap.forEach((b, a) => {
    if (b > a) reflector += `M${REFLECTOR_EDGE} ${rowY(a)}H${reflectorBend(a, b)}V${rowY(b)}H${REFLECTOR_EDGE}`;
  });
  return { spine: crossing(KEYS_EDGE, SPINE_EDGE, spine), rotors, reflector };
}

export type Direction = 'forward' | 'return';

export interface Contact {
  x: number;
  row: number;
  direction: Direction;
}

export interface SignalPath {
  /** Percorso di andata, dal tasto al riflettore; vuoto se il segnale non è partito. */
  forward: string;
  /** Percorso di ritorno, dal riflettore alla lampada. */
  back: string;
  /** Contatti toccati, per i puntini sui bordi delle colonne. */
  contacts: Contact[];
  /** Riga della lettera dell’anello toccata da ogni rotore, per slot. */
  ring: { forward: (number | null)[]; back: (number | null)[] };
  key: number | null;
  /** Riga della lampada, solo quando il segnale ci è arrivato. */
  lamp: number | null;
}

const toPath = (points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');

/**
 * Percorso del segnale dei primi `progress` stadi (tutti, per difetto), come nella traccia
 * passo-passo: con 0 si vede solo il tasto, oltre l’ultimo stadio si accende la lampada. Pannello
 * e ruota d’ingresso stanno nella stessa colonna: il tratto si disegna con il pannello e arriva
 * dove porta la ruota.
 */
export function signalPath(stages: readonly Stage[], rotorCount: number, progress = stages.length + 1): SignalPath {
  const columns = rotorColumns(rotorCount);
  const empty: SignalPath = {
    forward: '',
    back: '',
    contacts: [],
    ring: { forward: columns.map(() => null), back: columns.map(() => null) },
    key: null,
    lamp: null,
  };
  const first = stages[0];
  if (!first) return empty;
  const path = { ...empty, key: first.input, ring: { forward: [...empty.ring.forward], back: [...empty.ring.back] } };
  const forward: [number, number][] = [[KEYS_EDGE + 4, rowY(first.input)]];
  const back: [number, number][] = [];
  const drawn = stages.slice(0, Math.max(0, progress));

  drawn.forEach((stage, index) => {
    const yIn = rowY(stage.input);
    if (stage.kind === 'plugboard' && stage.direction === 'forward') {
      const entry = stages[index + 1];
      const out = rowY(entry?.kind === 'entry' ? entry.output : stage.output);
      forward.push([KEYS_EDGE, yIn], [KEYS_EDGE - LEAD, yIn], [SPINE_EDGE + LEAD, out], [SPINE_EDGE, out]);
    } else if (stage.kind === 'plugboard') {
      const entry = stages[index - 1];
      const from = rowY(entry?.kind === 'entry' ? entry.input : stage.input);
      const out = rowY(stage.output);
      back.push([SPINE_EDGE, from], [SPINE_EDGE + LEAD, from], [KEYS_EDGE - LEAD, out], [KEYS_EDGE + 4, out]);
    } else if (stage.kind === 'rotor') {
      const column = columns[stage.slot ?? 0];
      if (!column) return;
      const yOut = rowY(stage.output);
      if (stage.direction === 'forward') {
        forward.push([column.right - LEAD, yIn], [column.left + LEAD, yOut], [column.left, yOut]);
        path.ring.forward[column.slot] = stage.input;
        path.contacts.push(
          { x: column.right, row: stage.input, direction: 'forward' },
          { x: column.left, row: stage.output, direction: 'forward' },
        );
      } else {
        back.push([column.left + LEAD, yIn], [column.right - LEAD, yOut], [column.right, yOut]);
        path.ring.back[column.slot] = stage.output;
        path.contacts.push(
          { x: column.left, row: stage.input, direction: 'return' },
          { x: column.right, row: stage.output, direction: 'return' },
        );
      }
    } else if (stage.kind === 'reflector') {
      const bend = reflectorBend(stage.input, stage.output);
      const yOut = rowY(stage.output);
      forward.push([bend, yIn]);
      back.push([bend, yIn], [bend, yOut], [REFLECTOR_EDGE, yOut]);
    }
  });

  const last = stages.at(-1);
  // Fra due rotori lo stesso contatto è l’uscita dell’uno e l’ingresso dell’altro: un puntino solo.
  const seen = new Set<string>();
  path.contacts = path.contacts.filter((contact) => {
    const id = `${contact.x}-${contact.row}-${contact.direction}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  path.forward = forward.length > 1 ? toPath(forward) : '';
  path.back = back.length > 1 ? toPath(back) : '';
  path.lamp = progress > stages.length && last ? last.output : null;
  return path;
}
