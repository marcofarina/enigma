/**
 * Crittoanalisi: le grandezze che le lezioni e le animazioni mostrano.
 *
 * - **Biuro Szyfrów** (Rejewski 1980, parte I): gli indicatori doppi di una giornata, le
 *   permutazioni AD, BE, CF che se ne ricavano e la loro struttura in cicli, la «caratteristica».
 * - **Bletchley Park**: il menu di un crib, i suoi anelli e la prova di un’ipotesi sul pannello a
 *   spine come la faceva la Bombe, con e senza diagonal board.
 *
 * Le permutazioni sono array di indici 0–25, come in `alphabet.ts`. Il prodotto si legge da
 * sinistra a destra, come in Rejewski: in AD si applica prima A e poi D.
 */
import { cycles, isLetter, LETTER_COUNT, toIndex, toLetter } from './alphabet.ts';
import { encipher, initialState, step, traceSignal, type Machine, type MachineState } from './machine.ts';

const LETTERS = Array.from({ length: LETTER_COUNT }, (_, i) => i);

function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new RangeError(`Indice ${index} fuori intervallo.`);
  return item;
}

function checkLetters(text: string, label: string): void {
  if (![...text].every(isLetter)) throw new RangeError(`${label}: servono solo lettere da A a Z.`);
}

// ── Permutazioni ──────────────────────────────────────────────────────────────────────────────

/** Prodotto di due permutazioni: prima `first`, poi `second`. */
export function product(first: readonly number[], second: readonly number[]): number[] {
  return first.map((x) => at(second, x));
}

/**
 * Le permutazioni che la macchina opera ai prossimi `count` tasti premuti a partire da `state`
 * (ogni tasto fa prima avanzare i rotori). Con `count = 6` e lo stato della posizione di base sono
 * le A, B, C, D, E, F di Rejewski.
 */
export function pressPermutations(machine: Machine, state: MachineState, count: number): number[][] {
  const result: number[][] = [];
  let current = state;
  for (let i = 0; i < count; i++) {
    current = step(machine, current).state;
    const frozen = current;
    result.push(LETTERS.map((letter) => traceSignal(machine, frozen, toLetter(letter)).output));
  }
  return result;
}

/** Una permutazione è un’involuzione se applicarla due volte riporta ogni lettera al suo posto. */
export function isInvolution(map: readonly number[]): boolean {
  return map.every((target, source) => map[target] === source);
}

/**
 * Teorema di Rejewski (1980, p. 9): il prodotto di due permutazioni fatte solo di trasposizioni
 * disgiunte ha i cicli di ogni lunghezza in numero pari. Vale anche il contrario.
 */
export function hasPairedCycles(map: readonly number[]): boolean {
  const counts = new Map<number, number>();
  for (const cycle of cycles(map)) counts.set(cycle.length, (counts.get(cycle.length) ?? 0) + 1);
  return [...counts.values()].every((count) => count % 2 === 0);
}

/** Notazione a cicli, per esempio `(ADVP)(BC)(E)`. I punti fissi compaiono come cicli di una lettera. */
export function cycleNotation(map: readonly number[]): string {
  return cycles(map)
    .map((cycle) => `(${cycle.map(toLetter).join('')})`)
    .join('');
}

/**
 * Legge una permutazione in notazione a cicli, maiuscola o minuscola, con o senza spazi:
 * `(dvpfkxgzyo) (eijmunqlht) (bc)`. Le lettere che non compaiono restano ferme.
 */
export function parseCycles(notation: string): number[] {
  const map = [...LETTERS];
  const seen = new Set<number>();
  const groups = notation.toUpperCase().match(/\(([^)]*)\)/g) ?? [];
  const rest = notation.replace(/\([^)]*\)/g, '').trim();
  if (rest !== '') throw new RangeError(`«${rest}» non fa parte di un ciclo.`);
  for (const group of groups) {
    const letters = group.replace(/[()\s]/g, '');
    checkLetters(letters, 'Ciclo');
    const cycle = [...letters].map(toIndex);
    cycle.forEach((letter, i) => {
      if (seen.has(letter)) throw new RangeError(`La lettera ${toLetter(letter)} compare in due cicli.`);
      seen.add(letter);
      map[letter] = at(cycle, (i + 1) % cycle.length);
    });
  }
  return map;
}

// ── Rejewski: indicatori doppi e caratteristica ───────────────────────────────────────────────

export const PRODUCT_NAMES = ['AD', 'BE', 'CF'] as const;
export type ProductName = (typeof PRODUCT_NAMES)[number];

/** Le permutazioni AD, BE, CF di una giornata: la «caratteristica» di Rejewski. */
export type Characteristic = Record<ProductName, number[]>;

/**
 * Una permutazione conosciuta in parte: `map[x]` è l’immagine di `x`, oppure `null` se nessun
 * indicatore l’ha ancora mostrata.
 */
export type PartialPermutation = readonly (number | null)[];

export type PartialCharacteristic = Readonly<Record<ProductName, PartialPermutation>>;

/**
 * Cifra due volte ogni chiave di messaggio dalla stessa posizione di base, come prescrivevano le
 * norme tedesche fino al 15 settembre 1938 (Rejewski 1980, p. 5): da `ABC` nasce un indicatore di
 * sei lettere, cifratura di `ABCABC`. `state` è la posizione di base del giorno; se manca, quella
 * della configurazione.
 */
export function doubledIndicators(
  machine: Machine,
  messageKeys: readonly string[],
  state: MachineState = initialState(machine),
): string[] {
  return messageKeys.map((key) => {
    if (key.length !== 3 || ![...key].every(isLetter)) {
      throw new RangeError(`La chiave di messaggio «${key}» deve avere tre lettere da A a Z.`);
    }
    return encipher(machine, state, key + key).output;
  });
}

/**
 * La caratteristica esatta, calcolata dalla macchina e dalla posizione di base senza passare dagli
 * indicatori: è quella che gli indicatori di una giornata rivelano pezzo per pezzo.
 */
export function characteristic(machine: Machine, state: MachineState = initialState(machine)): Characteristic {
  const permutations = pressPermutations(machine, state, 6);
  const factor = (index: number) => at(permutations, index);
  return {
    AD: product(factor(0), factor(3)),
    BE: product(factor(1), factor(4)),
    CF: product(factor(2), factor(5)),
  };
}

/** Caratteristica di partenza, quando non si conosce ancora nessun indicatore. */
export function emptyCharacteristic(): PartialCharacteristic {
  const empty = LETTERS.map(() => null);
  return { AD: empty, BE: empty, CF: empty };
}

/**
 * Aggiunge un indicatore doppio alla caratteristica: la prima lettera porta alla quarta in AD, la
 * seconda alla quinta in BE, la terza alla sesta in CF (Rejewski 1980, p. 6). Restituisce una
 * caratteristica nuova. Lancia un errore se l’indicatore contraddice quelli già visti: due
 * indicatori così non vengono dalla stessa posizione di base.
 */
export function addIndicator(partial: PartialCharacteristic, indicator: string): PartialCharacteristic {
  if (indicator.length !== 6) throw new RangeError(`L’indicatore «${indicator}» deve avere sei lettere.`);
  checkLetters(indicator, `Indicatore «${indicator}»`);
  const result: Record<ProductName, PartialPermutation> = { ...partial };
  PRODUCT_NAMES.forEach((name, i) => {
    const from = toIndex(indicator.charAt(i));
    const to = toIndex(indicator.charAt(i + 3));
    const map = partial[name];
    const known = map[from] ?? null;
    if (known === to) return;
    const clash =
      known !== null
        ? `${toLetter(from)} porta già a ${toLetter(known)}`
        : map.includes(to)
          ? `a ${toLetter(to)} porta già ${toLetter(map.indexOf(to))}`
          : null;
    if (clash !== null) {
      throw new RangeError(`L’indicatore «${indicator}» contraddice quelli già visti: in ${name} ${clash}.`);
    }
    result[name] = map.map((target, source) => (source === from ? to : target));
  });
  return result;
}

/** La caratteristica che si ricava da un elenco di indicatori doppi della stessa giornata. */
export function characteristicFromIndicators(indicators: readonly string[]): PartialCharacteristic {
  return indicators.reduce(addIndicator, emptyCharacteristic());
}

/** `true` se la permutazione parziale è nota per tutte le lettere. */
export function isComplete(map: PartialPermutation): map is readonly number[] {
  return map.every((target) => target !== null);
}

export interface Chains {
  /** Cicli chiusi, ciascuno a partire dalla lettera più piccola, ordinati per lettera iniziale. */
  closed: number[][];
  /** Catene ancora aperte (almeno due lettere), dalla prima lettera senza predecessore noto. */
  open: number[][];
}

/**
 * Cicli già chiusi e catene ancora aperte di una permutazione parziale: ciò che il crittoanalista
 * vede mentre raccoglie gli indicatori. Le lettere su cui non si sa nulla non compaiono.
 */
export function chains(map: PartialPermutation): Chains {
  const hasPredecessor = new Set(map.filter((target): target is number => target !== null));
  const seen = new Set<number>();
  const open: number[][] = [];
  for (const start of LETTERS) {
    if (hasPredecessor.has(start) || map[start] === null) continue;
    const chain: number[] = [];
    for (let i: number | null = start; i !== null && !seen.has(i); i = map[i] ?? null) {
      seen.add(i);
      chain.push(i);
    }
    open.push(chain);
  }
  const closed: number[][] = [];
  for (const start of LETTERS) {
    if (seen.has(start) || map[start] === null) continue;
    const cycle: number[] = [];
    for (let i: number | null = start; i !== null && !seen.has(i); i = map[i] ?? null) {
      seen.add(i);
      cycle.push(i);
    }
    closed.push(cycle);
  }
  return { closed, open };
}

/**
 * Proprietà (2) del teorema di Rejewski (1980, p. 10): nel prodotto XY di due permutazioni fatte
 * solo di trasposizioni disgiunte, le due lettere di una trasposizione di X stanno in due cicli
 * diversi della stessa lunghezza, e se X scambia due lettere di quei cicli scambia anche le loro
 * vicine, una avanti in un ciclo e una indietro nell’altro.
 *
 * Sapendo che X scambia `a` e `b`, restituisce tutte le trasposizioni di X fra i due cicli che li
 * contengono, oppure `null` se l’ipotesi è impossibile (stesso ciclo o lunghezze diverse).
 */
export function transpositionsFromPair(xy: readonly number[], a: number, b: number): Array<[number, number]> | null {
  const all = cycles(xy);
  const first = all.find((cycle) => cycle.includes(a));
  const second = all.find((cycle) => cycle.includes(b));
  if (!first || !second || first === second || first.length !== second.length) return null;
  const i = first.indexOf(a);
  const j = second.indexOf(b);
  const n = first.length;
  return first.map((_, t) => [at(first, (i + t) % n), at(second, (((j - t) % n) + n) % n)]);
}

/**
 * Dalle trasposizioni note di X, le corrispondenti di Y, con XY noto: se X scambia `u` e `v`,
 * Y scambia `v` con XY(u). È il passo con cui Rejewski ricava D da A (1980, p. 10).
 */
export function secondFactorTranspositions(
  xy: readonly number[],
  transpositions: ReadonlyArray<readonly [number, number]>,
): Array<[number, number]> {
  return transpositions.map(([u, v]) => [v, at(xy, u)]);
}

// ── Bletchley Park: crib, menu, Bombe ─────────────────────────────────────────────────────────

/** Un collegamento del menu: alla posizione `position` del messaggio, `plain` diventa `cipher`. */
export interface MenuEdge {
  /** Posizione nel messaggio cifrato, da 0. */
  position: number;
  plain: string;
  cipher: string;
}

export interface Menu {
  crib: string;
  ciphertext: string;
  /** Posizione del crib nel messaggio cifrato. */
  offset: number;
  edges: MenuEdge[];
  /** Lettere del menu, in ordine alfabetico. */
  letters: string[];
}

/** Un anello del menu: da `letters[i]` si passa a `letters[i + 1]` lungo `edges[i]`; l’ultimo collegamento torna alla prima lettera. */
export interface MenuLoop {
  letters: string[];
  edges: MenuEdge[];
}

function checkCrib(crib: string, ciphertext: string): void {
  if (crib.length === 0) throw new RangeError('Il crib è vuoto.');
  checkLetters(crib, 'Crib');
  checkLetters(ciphertext, 'Testo cifrato');
  if (crib.length > ciphertext.length) throw new RangeError('Il crib è più lungo del testo cifrato.');
}

/**
 * Posizioni del messaggio in cui, con il crib a partire da `offset`, una lettera cifrerebbe sé
 * stessa: Enigma non lo fa mai, quindi lì il crib non può stare.
 */
export function cribCrashes(crib: string, ciphertext: string, offset: number): number[] {
  checkCrib(crib, ciphertext);
  if (!Number.isInteger(offset) || offset < 0 || offset + crib.length > ciphertext.length) {
    throw new RangeError(`Con il crib in posizione ${offset} il crib esce dal testo cifrato.`);
  }
  return [...crib].flatMap((letter, i) => (ciphertext.charAt(offset + i) === letter ? [offset + i] : []));
}

/** Le posizioni in cui il crib può stare: quelle in cui nessuna lettera cifrerebbe sé stessa. */
export function cribPositions(crib: string, ciphertext: string): number[] {
  checkCrib(crib, ciphertext);
  return Array.from({ length: ciphertext.length - crib.length + 1 }, (_, offset) => offset).filter(
    (offset) => cribCrashes(crib, ciphertext, offset).length === 0,
  );
}

/** Il menu del crib in posizione `offset`: un collegamento per ogni coppia di lettere allineate. */
export function buildMenu(crib: string, ciphertext: string, offset = 0): Menu {
  const crashes = cribCrashes(crib, ciphertext, offset);
  if (crashes.length > 0) {
    throw new RangeError(
      `Con il crib in posizione ${offset} una lettera cifrerebbe sé stessa (posizioni ${crashes.join(', ')}).`,
    );
  }
  const edges = [...crib].map((plain, i) => ({ position: offset + i, plain, cipher: ciphertext.charAt(offset + i) }));
  const letters = [...new Set(edges.flatMap((edge) => [edge.plain, edge.cipher]))].sort();
  return { crib, ciphertext, offset, edges, letters };
}

function otherEnd(edge: MenuEdge, letter: string): string {
  return edge.plain === letter ? edge.cipher : edge.plain;
}

/** I collegamenti che toccano una lettera, in ordine di posizione. */
export function menuEdgesOf(menu: Menu, letter: string): MenuEdge[] {
  return menu.edges.filter((edge) => edge.plain === letter || edge.cipher === letter);
}

/** La lettera con più collegamenti (a parità, la prima in ordine alfabetico): la lettera centrale da cui parte la prova. */
export function menuCentre(menu: Menu, letters: readonly string[] = menu.letters): string {
  let best = at(letters, 0);
  for (const letter of letters) {
    if (menuEdgesOf(menu, letter).length > menuEdgesOf(menu, best).length) best = letter;
  }
  return best;
}

/** Le parti connesse del menu, ciascuna in ordine alfabetico, dalla più grande. */
export function menuComponents(menu: Menu): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const start of menu.letters) {
    if (seen.has(start)) continue;
    const component: string[] = [];
    const queue = [start];
    seen.add(start);
    for (let letter = queue.shift(); letter !== undefined; letter = queue.shift()) {
      component.push(letter);
      for (const edge of menuEdgesOf(menu, letter)) {
        const next = otherEnd(edge, letter);
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    components.push(component.sort());
  }
  return components.sort((a, b) => b.length - a.length);
}

/**
 * Gli anelli indipendenti del menu, dal più corto. Il loro numero è collegamenti − lettere + parti
 * connesse. Ogni anello nasce da un collegamento fuori da un albero che, in ogni parte connessa,
 * parte dalla lettera centrale; due collegamenti fra le stesse due lettere formano un anello di due.
 */
export function menuLoops(menu: Menu): MenuLoop[] {
  const parent = new Map<string, { letter: string; edge: MenuEdge } | null>();
  const depth = new Map<string, number>();
  const treeEdges = new Set<MenuEdge>();
  for (const component of menuComponents(menu)) {
    const root = menuCentre(menu, component);
    parent.set(root, null);
    depth.set(root, 0);
    const queue = [root];
    for (let letter = queue.shift(); letter !== undefined; letter = queue.shift()) {
      for (const edge of menuEdgesOf(menu, letter)) {
        const next = otherEnd(edge, letter);
        if (parent.has(next)) continue;
        parent.set(next, { letter, edge });
        depth.set(next, (depth.get(letter) ?? 0) + 1);
        treeEdges.add(edge);
        queue.push(next);
      }
    }
  }

  const loops: MenuLoop[] = [];
  for (const closing of menu.edges) {
    if (treeEdges.has(closing)) continue;
    // Si risale l’albero dai due estremi fino all’antenato comune.
    const up: Array<{ letter: string; edge: MenuEdge }> = [];
    const down: Array<{ letter: string; edge: MenuEdge }> = [];
    let u = closing.plain;
    let v = closing.cipher;
    while (u !== v) {
      if ((depth.get(u) ?? 0) >= (depth.get(v) ?? 0)) {
        const link = parent.get(u);
        if (!link) break;
        up.push({ letter: u, edge: link.edge });
        u = link.letter;
      } else {
        const link = parent.get(v);
        if (!link) break;
        down.push({ letter: v, edge: link.edge });
        v = link.letter;
      }
    }
    // Il giro: da plain fino all’antenato, poi giù fino a cipher, e il collegamento che chiude.
    const descent = [...down].reverse();
    const letters = [...up.map((link) => link.letter), u, ...descent.map((link) => link.letter)];
    const edges = [...up.map((link) => link.edge), ...descent.map((link) => link.edge), closing];
    loops.push({ letters, edges });
  }
  return loops.sort((a, b) => a.letters.length - b.letters.length);
}

function bareMachine(machine: Machine): Machine {
  if (machine.config.uhr !== undefined) {
    throw new RangeError('Con l’Uhr il pannello non scambia le lettere a coppie: la prova della Bombe non vale.');
  }
  return { ...machine, plugboard: { forward: LETTERS, backward: LETTERS } };
}

/**
 * Le permutazioni dei rotori, senza pannello a spine, alle posizioni del messaggio da 0 a
 * `count − 1`, a partire dallo stato prima del primo tasto: quelle che la Bombe riproduceva con i
 * suoi tamburi. Il pannello di `machine` non conta.
 */
export function scramblers(machine: Machine, state: MachineState, count: number): number[][] {
  return pressPermutations(bareMachine(machine), state, count);
}

/**
 * La permutazione di un giro completo dell’anello, senza pannello: con la chiave giusta la lettera
 * collegata dal pannello alla prima lettera dell’anello è un suo punto fisso. È il fatto su cui
 * Turing costruì la Bombe.
 */
export function loopPermutation(machine: Machine, state: MachineState, loop: MenuLoop): number[] {
  const count = Math.max(...loop.edges.map((edge) => edge.position)) + 1;
  const table = scramblers(machine, state, count);
  return loop.edges.reduce((map, edge) => product(map, at(table, edge.position)), [...LETTERS]);
}

export interface Hypothesis {
  /** La lettera del menu su cui si fa l’ipotesi. */
  letter: string;
  /** La lettera a cui si suppone che il pannello la colleghi (anche sé stessa: nessun cavo). */
  partner: string;
}

export type DeductionCause =
  | { kind: 'hypothesis' }
  /** Lungo un collegamento del menu, dalla deduzione `from`. */
  | { kind: 'menu'; edge: MenuEdge; from: number }
  /** Dal diagonal board: se A va con B, anche B va con A. */
  | { kind: 'diagonal'; from: number };

export interface Deduction {
  letter: string;
  partner: string;
  cause: DeductionCause;
}

export interface Contradiction {
  letter: string;
  /** Il compagno già dedotto e quello nuovo, diverso. */
  partners: [string, string];
  /** Indice in `deductions` della deduzione che ha portato il secondo compagno. */
  deduction: number;
}

export interface HypothesisTest {
  hypothesis: Hypothesis;
  diagonalBoard: boolean;
  /** Tutte le conseguenze dell’ipotesi, in ordine di scoperta: la prima è l’ipotesi stessa. */
  deductions: Deduction[];
  /** Ogni volta che una lettera riceve un secondo compagno, in ordine di scoperta. */
  contradictions: Contradiction[];
  consistent: boolean;
  /** Per ogni lettera (indice 0–25), i compagni dedotti in ordine alfabetico. */
  partners: string[][];
}

/**
 * Prova un’ipotesi sul pannello lungo il menu, come la Bombe, con i rotori nello stato `state`
 * prima del primo tasto del messaggio. Se il pannello collega la lettera `a` a `x`, il collegamento
 * del menu in posizione p fra `a` e `b` impone che `b` sia collegata alla permutazione dei rotori in
 * p applicata a `x`. Con il diagonal board ogni deduzione «a con x» porta anche «x con a».
 *
 * Si seguono tutte le conseguenze, anche dopo la prima contraddizione, come faceva la corrente nella
 * macchina. Un’ipotesi è coerente se nessuna lettera riceve due compagni diversi.
 */
export function testHypothesis(
  machine: Machine,
  state: MachineState,
  menu: Menu,
  hypothesis: Hypothesis,
  options: { diagonalBoard?: boolean } = {},
): HypothesisTest {
  const diagonalBoard = options.diagonalBoard ?? true;
  checkLetters(hypothesis.letter + hypothesis.partner, 'Ipotesi');
  if (hypothesis.letter.length !== 1 || hypothesis.partner.length !== 1) {
    throw new RangeError('L’ipotesi collega una lettera a una lettera.');
  }
  const count = Math.max(0, ...menu.edges.map((edge) => edge.position + 1));
  const table = scramblers(machine, state, count);

  const deductions: Deduction[] = [];
  const contradictions: Contradiction[] = [];
  const partners: string[][] = LETTERS.map(() => []);
  const live = new Set<string>();

  const add = (letter: string, partner: string, cause: DeductionCause) => {
    const key = letter + partner;
    if (live.has(key)) return;
    live.add(key);
    const known = at(partners, toIndex(letter));
    if (known.length > 0) {
      contradictions.push({ letter, partners: [at(known, 0), partner], deduction: deductions.length });
    }
    known.push(partner);
    deductions.push({ letter, partner, cause });
  };

  add(hypothesis.letter, hypothesis.partner, { kind: 'hypothesis' });
  for (let from = 0; from < deductions.length; from++) {
    const { letter, partner } = at(deductions, from);
    for (const edge of menuEdgesOf(menu, letter)) {
      const scrambled = at(at(table, edge.position), toIndex(partner));
      add(otherEnd(edge, letter), toLetter(scrambled), { kind: 'menu', edge, from });
    }
    if (diagonalBoard) add(partner, letter, { kind: 'diagonal', from });
  }

  return {
    hypothesis,
    diagonalBoard,
    deductions,
    contradictions,
    consistent: contradictions.length === 0,
    partners: partners.map((list) => [...list].sort()),
  };
}
