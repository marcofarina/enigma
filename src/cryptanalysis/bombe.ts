import { createMachine, mod, toIndex, type Machine, type MachineConfig, type MachineState } from '@/engine';
import { machineMap, statesAfter } from './scrambler.ts';

/**
 * Crib, menu e Bombe. Un crib è un pezzo di testo in chiaro che si pensa compaia nel messaggio.
 * Poiché Enigma non cifra mai una lettera in sé stessa, molte posizioni del crib sono subito
 * escluse; da quelle rimaste si ricava il menu che guidava la Bombe.
 */

/** Per ogni posizione del crib nel testo cifrato, l’indice della prima lettera che “sbatte”, o -1. */
export function crashes(cipher: string, crib: string): number[] {
  const result: number[] = [];
  for (let offset = 0; offset + crib.length <= cipher.length; offset++) {
    let crash = -1;
    for (let i = 0; i < crib.length; i++) {
      if (crib[i] === cipher[offset + i]) {
        crash = i;
        break;
      }
    }
    result.push(crash);
  }
  return result;
}

/** Collegamento del menu: alla posizione `index` del crib, la lettera `a` del chiaro diventa `b`. */
export interface MenuEdge {
  index: number;
  a: number;
  b: number;
}

export function buildMenu(crib: string, cipher: string): MenuEdge[] {
  return [...crib].map((letter, index) => ({ index, a: toIndex(letter), b: toIndex(cipher[index] ?? 'A') }));
}

/**
 * Loop del menu (le “chiusure” di Turing). Si costruisce un albero che tocca tutte le lettere:
 * ogni collegamento che non vi entra chiude esattamente un loop. Il loro numero è
 * collegamenti − lettere + parti connesse.
 */
export function menuLoops(edges: readonly MenuEdge[]): MenuEdge[][] {
  const parent = new Map<number, { node: number; edge: MenuEdge } | null>();
  const depth = new Map<number, number>();
  const treeEdges = new Set<MenuEdge>();
  const adjacency = new Map<number, MenuEdge[]>();
  for (const edge of edges) {
    for (const node of [edge.a, edge.b]) adjacency.set(node, [...(adjacency.get(node) ?? []), edge]);
  }
  for (const root of adjacency.keys()) {
    if (parent.has(root)) continue;
    parent.set(root, null);
    depth.set(root, 0);
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift() as number;
      for (const edge of adjacency.get(node) ?? []) {
        const other = edge.a === node ? edge.b : edge.a;
        if (parent.has(other)) continue;
        parent.set(other, { node, edge });
        depth.set(other, (depth.get(node) ?? 0) + 1);
        treeEdges.add(edge);
        queue.push(other);
      }
    }
  }
  const pathToRoot = (start: number) => {
    const path: { node: number; edge: MenuEdge | null }[] = [];
    for (let node: number | undefined = start; node !== undefined;) {
      const up = parent.get(node);
      path.push({ node, edge: up?.edge ?? null });
      node = up?.node;
    }
    return path;
  };
  return edges
    .filter((edge) => !treeEdges.has(edge))
    .map((edge) => {
      const fromA = pathToRoot(edge.a);
      const fromB = pathToRoot(edge.b);
      const onB = new Set(fromB.map((p) => p.node));
      const meet = fromA.find((p) => onB.has(p.node))?.node;
      const upA = fromA.slice(
        0,
        fromA.findIndex((p) => p.node === meet),
      );
      const upB = fromB.slice(
        0,
        fromB.findIndex((p) => p.node === meet),
      );
      return [edge, ...upA.map((p) => p.edge as MenuEdge), ...upB.map((p) => p.edge as MenuEdge)];
    });
}

/** Le lettere che compaiono nel menu, in ordine di frequenza: la più collegata è la lettera di prova. */
export function menuLetters(edges: readonly MenuEdge[]): number[] {
  const degree = new Map<number, number>();
  for (const { a, b } of edges) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  return [...degree.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0]).map(([letter]) => letter);
}

/** Collegamenti del menu raggruppati per lettera, calcolati una volta per tutte le posizioni. */
export function menuIndex(edges: readonly MenuEdge[]): MenuEdge[][] {
  const byLetter: MenuEdge[][] = Array.from({ length: 26 }, () => []);
  for (const edge of edges) {
    byLetter[edge.a]?.push(edge);
    if (edge.b !== edge.a) byLetter[edge.b]?.push(edge);
  }
  return byLetter;
}

/**
 * Il circuito della Bombe in una posizione. Ogni “filo” (x, y) rappresenta l’ipotesi “x è
 * collegata a y sul pannello”. Se (x, y) è vera e il menu dice che alla posizione i la x diventa
 * la z, allora z è collegata a Eᵢ(y), dove Eᵢ è la macchina senza pannello. La corrente parte
 * da un’ipotesi sulla lettera di prova e accende tutte le conseguenze; la diagonal board di
 * Welchman aggiunge la reciprocità: (x, y) accende anche (y, x).
 *
 * Restituisce, per ciascuna delle 26 ipotesi sulla lettera di prova, se risulta accesa.
 */
export function lightRegister(
  maps: readonly (readonly number[])[],
  byLetter: readonly (readonly MenuEdge[])[],
  test: number,
  hypothesis: number,
  diagonal = true,
): boolean[] {
  const live = new Uint8Array(26 * 26);
  const stack: number[] = [test * 26 + hypothesis];
  live[test * 26 + hypothesis] = 1;
  while (stack.length > 0) {
    const wire = stack.pop() as number;
    const x = (wire / 26) | 0;
    const y = wire - x * 26;
    if (diagonal) {
      const mirror = y * 26 + x;
      if (!live[mirror]) {
        live[mirror] = 1;
        stack.push(mirror);
      }
    }
    for (const edge of byLetter[x] ?? []) {
      const other = edge.a === x ? edge.b : edge.a;
      const next = other * 26 + (maps[edge.index]?.[y] ?? y);
      if (!live[next]) {
        live[next] = 1;
        stack.push(next);
      }
    }
  }
  return Array.from({ length: 26 }, (_, y) => live[test * 26 + y] === 1);
}

export interface BombeStop {
  /** Lettere nelle finestrelle all’inizio del messaggio. */
  positions: string;
  /** Compagna della lettera di prova sul pannello, secondo la Bombe. */
  partner: number;
}

/**
 * Una posizione di partenza è una “fermata” se il registro della lettera di prova non si accende
 * tutto: o resta accesa una sola ipotesi (quella giusta), o se ne accendono 25 tranne una (e la
 * giusta è quella spenta). Restituisce la compagna proposta, oppure `null` se si prosegue.
 */
export function testPosition(
  maps: readonly (readonly number[])[],
  byLetter: readonly (readonly MenuEdge[])[],
  test: number,
): number | null {
  const lit = lightRegister(maps, byLetter, test, 0);
  const count = lit.filter(Boolean).length;
  if (count === 26) return null;
  if (count === 1) return 0;
  // Si riprova con un’ipotesi rimasta spenta: se il registro non si accende tutto, è la candidata.
  const off = lit.findIndex((on) => !on);
  return lightRegister(maps, byLetter, test, off).every(Boolean) ? null : off;
}

export interface BombeJob {
  /** Rotori, anelli e riflettore da provare; pannello, posizioni e Uhr non contano. */
  key: Pick<MachineConfig, 'model' | 'rotors' | 'rings' | 'reflector'>;
  edges: readonly MenuEdge[];
  /** Posizione della prima lettera del crib nel messaggio (0 = prima lettera). */
  offset: number;
}

/**
 * Sostituzioni della macchina senza pannello per ciascuna lettera del crib, da una posizione di
 * partenza: la lettera in posizione k del messaggio si cifra dopo k + 1 tasti.
 */
export function cribMaps(machine: Machine, start: MachineState, offset: number, length: number): number[][] {
  return statesAfter(machine, start, offset + length)
    .slice(offset)
    .map((state) => machineMap(machine, state));
}

/**
 * Prova le posizioni di partenza da `from` a `to` (escluso), numerate come le lettere nelle
 * finestrelle lette in base 26. Si può chiamare a blocchi per non bloccare la pagina.
 */
export function runBombe(job: BombeJob, from: number, to: number): BombeStop[] {
  // La Bombe prova la macchina senza pannello: le spine sono proprio ciò che deduce.
  const { model, rotors, rings, reflector } = job.key;
  const machine = createMachine({ model, rotors, rings, reflector, positions: 'A'.repeat(rotors.length) });
  const byLetter = menuIndex(job.edges);
  const test = menuLetters(job.edges)[0] ?? 0;
  const length = Math.max(...job.edges.map((e) => e.index)) + 1;
  const stops: BombeStop[] = [];
  for (let n = from; n < to; n++) {
    const positions = [Math.floor(n / 676), Math.floor(n / 26) % 26, n % 26];
    const maps = cribMaps(machine, { positions, reflectorPosition: 0 }, job.offset, length);
    const partner = testPosition(maps, byLetter, test);
    if (partner !== null) {
      stops.push({ positions: positions.map((p) => String.fromCharCode(65 + mod(p))).join(''), partner });
    }
  }
  return stops;
}
