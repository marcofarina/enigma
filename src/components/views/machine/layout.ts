import { KEYBOARD_ROWS } from '@/components/simulator/keys.ts';

/**
 * Geometria della vista “Macchina”: un’Enigma vista dall’alto e un po’ di fronte. Le posizioni
 * sono calcolate qui, senza correzioni a pixel nei componenti, così la stessa illustrazione si
 * può generare per ogni modello e riusare come figura.
 */

export const WIDTH = 720;
const LAMP_SPACING = 58;
const KEY_SPACING = 60;
const SOCKET_SPACING = 64;

export interface Point {
  x: number;
  y: number;
}

export interface MachineLayoutOptions {
  /** Rotori da sinistra a destra; `thin` per il rotore sottile della M4. */
  rotors: readonly { name: string; thin: boolean }[];
  /** Finestrella del riflettore, nei modelli in cui si regola a mano. */
  reflectorWindow: boolean;
  plugboard: boolean;
}

export interface WindowSlot {
  x: number;
  y: number;
  width: number;
  /** Indice del rotore, oppure -1 per il riflettore. */
  slot: number;
  thin: boolean;
}

export interface MachineLayout {
  width: number;
  height: number;
  /** Il piano superiore, nero, con finestrelle, lampade e tasti. */
  deck: { x: number; y: number; width: number; height: number };
  /** Il fronte della cassetta, con il pannello a spine se c’è. */
  front: { x: number; y: number; width: number; height: number };
  windows: WindowSlot[];
  lamps: Record<string, Point>;
  keys: Record<string, Point>;
  /** Prese del pannello: il centro del foro superiore. */
  sockets: Record<string, Point>;
}

function rows(spacing: number, top: number, rowHeight: number): Record<string, Point> {
  const points: Record<string, Point> = {};
  KEYBOARD_ROWS.forEach((row, r) => {
    // Le file da 9 sono centrate; quella da 8 è spostata di mezzo passo, come sulla macchina.
    const start = WIDTH / 2 - ((row.length - 1) * spacing) / 2;
    [...row].forEach((letter, i) => {
      points[letter] = { x: start + i * spacing, y: top + r * rowHeight };
    });
  });
  return points;
}

export function machineLayout({ rotors, reflectorWindow, plugboard }: MachineLayoutOptions): MachineLayout {
  const deckTop = 24;
  const windowsY = deckTop + 34;
  const slots = [
    ...(reflectorWindow ? [{ slot: -1, thin: false }] : []),
    ...rotors.map((rotor, slot) => ({ slot, thin: rotor.thin })),
  ];
  const slotWidth = (thin: boolean) => (thin ? 30 : 38);
  // Ogni finestrella ha accanto la sua rotella: il gruppo occupa la finestra più 28 px.
  const gap = 34;
  const total = slots.reduce((sum, s) => sum + slotWidth(s.thin) + gap, -gap);
  let cursor = WIDTH / 2 - total / 2;
  const windows = slots.map((s) => {
    const width = slotWidth(s.thin);
    const slot = { x: cursor, y: windowsY, width, slot: s.slot, thin: s.thin };
    cursor += width + gap;
    return slot;
  });

  const lampsTop = windowsY + 120;
  const lamps = rows(LAMP_SPACING, lampsTop, 50);
  const keysTop = lampsTop + 170;
  const keys = rows(KEY_SPACING, keysTop, 56);
  const deckBottom = keysTop + 2 * 56 + 46;

  const frontTop = deckBottom;
  const frontHeight = plugboard ? 190 : 46;
  const sockets = plugboard ? rows(SOCKET_SPACING, frontTop + 48, 54) : {};

  return {
    width: WIDTH,
    height: frontTop + frontHeight + (plugboard ? 44 : 16),
    deck: { x: 24, y: deckTop, width: WIDTH - 48, height: deckBottom - deckTop },
    front: { x: 24, y: frontTop, width: WIDTH - 48, height: frontHeight },
    windows,
    lamps,
    keys,
    sockets,
  };
}

/**
 * Il cavo tra due prese pende verso il basso, tanto più quanto le prese sono lontane, ma non oltre
 * `limit`, il bordo inferiore del disegno.
 */
export function cablePath(from: Point, to: Point, limit = Infinity): string {
  const sag = 34 + Math.abs(to.x - from.x) * 0.18 + Math.abs(to.y - from.y) * 0.3;
  // Il punto più basso di una curva di Bézier con questi controlli è a 3/4 della loro quota.
  const lowest = Math.max(from.y, to.y);
  const bottom = Math.min(lowest + sag, lowest + ((limit - lowest) * 4) / 3);
  return `M ${from.x} ${from.y} C ${from.x} ${bottom} ${to.x} ${bottom} ${to.x} ${to.y}`;
}
