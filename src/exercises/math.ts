import {
  ALPHABET,
  createMachine,
  encipherWith,
  groupLetters,
  initialState,
  pairings,
  prepareText,
  toLetter,
  traceSignal,
} from '@/engine';
import { t, tf } from '@/i18n';
import { groupDigits, numberInWords as words } from '@/lib/format';
import { randomKey, sheetOf } from './keys.ts';
import { randomMessage } from './messages.ts';
import { createRng, int, pick, shuffle, type Rng } from './random.ts';
import type { Exercise } from './types.ts';

/**
 * Esercizi di livello 3 (matematica): contare le impostazioni, riconoscere le involuzioni,
 * cercare una chiave in uno spazio ridotto. Ogni risposta è calcolata, non scritta a mano.
 */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const POSITIONS = 26 ** 3;

export type OrderRule = 'navale' | 'destro' | 'nessuno';

/** Ordini dei rotori (tre scelti tra `count`, in fila) che rispettano la regola rispetto a ieri. */
export function rotorOrders(count: number, rule: OrderRule, yesterday: readonly string[] = []): string[][] {
  const box = ROMAN.slice(0, count);
  const orders: string[][] = [];
  for (const left of box)
    for (const middle of box)
      for (const right of box) {
        if (left === middle || left === right || middle === right) continue;
        const order = [left, middle, right];
        if (rule === 'navale' && !order.some((name) => ['VI', 'VII', 'VIII'].includes(name))) continue;
        if (rule === 'destro' && right === yesterday[2]) continue;
        if (rule === 'nessuno' && order.some((name, slot) => name === yesterday[slot])) continue;
        orders.push(order);
      }
  return orders;
}

const spazioChiavi: Exercise = {
  id: 'spazio-chiavi',
  level: 3,
  title: t('ex.spazio.title'),
  summary: t('ex.spazio.summary'),
  simulator: false,
  generate(seed) {
    const rng = createRng(seed);
    const rule = pick<OrderRule>(rng, ['navale', 'destro', 'nessuno']);
    const count = rule === 'navale' ? 8 : pick(rng, [5, 8]);
    const yesterday = shuffle(rng, ROMAN.slice(0, count)).slice(0, 3);
    const orders = rotorOrders(count, rule, yesterday).length;
    const all = count * (count - 1) * (count - 2);
    const total = BigInt(orders) * BigInt(POSITIONS);
    const ruleText = tf(`ex.spazio.rule.${rule}`, { yesterday: yesterday.join(' – '), right: yesterday[2] ?? '' });
    const reasoning = {
      navale: tf('ex.spazio.solution.navale', { all, without: 60, orders }),
      destro: tf('ex.spazio.solution.destro', { choices: words(count - 1), rest: (count - 1) * (count - 2), orders }),
      nessuno: tf('ex.spazio.solution.nessuno', {
        all,
        one: 3 * (count - 1) * (count - 2),
        two: 3 * (count - 2),
        orders,
      }),
    }[rule];
    return {
      seed,
      blocks: [
        {
          kind: 'text',
          text: tf('ex.spazio.intro', { count: words(count), last: ROMAN[count - 1] ?? '', rule: ruleText }),
        },
      ],
      answer: { kind: 'number', label: t('ex.answer.number'), expected: total.toString() },
      solution: [
        tf('ex.spazio.solution.all', { count: words(count), all }),
        reasoning,
        tf('ex.spazio.solution.total', { orders, total: groupDigits(total) }),
      ],
    };
  },
};

/** Prodotto dei dispari da `n` in giù: (2k − 1)·(2k − 3)·…·1, i modi di accoppiare 2k lettere. */
const oddProduct = (n: number): number => (n <= 1 ? 1 : n * oddProduct(n - 2));

function binomial(n: number, k: number): bigint {
  let result = 1n;
  for (let i = 1; i <= k; i++) result = (result * BigInt(n - k + i)) / BigInt(i);
  return result;
}

const pannello: Exercise = {
  id: 'pannello',
  level: 3,
  title: t('ex.pannello.title'),
  summary: t('ex.pannello.summary'),
  simulator: false,
  generate(seed) {
    const rng = createRng(seed);
    const small = rng() < 0.5;
    const letters = small ? pick(rng, [6, 8, 10]) : 26;
    const cables = small ? int(rng, 2, letters / 2) : int(rng, 2, 13);
    const chosen = binomial(letters, 2 * cables);
    const matchings = oddProduct(2 * cables - 1);
    const total = pairings(letters, cables);
    const factors = Array.from({ length: cables }, (_, i) => 2 * cables - 1 - 2 * i).join(' × ');
    return {
      seed,
      blocks: [
        {
          kind: 'text',
          text: small
            ? tf('ex.pannello.introSmall', {
                letters: words(letters),
                cables: words(cables),
                last: toLetter(letters - 1),
              })
            : tf('ex.pannello.introReal', { cables: words(cables) }),
        },
      ],
      answer: { kind: 'number', label: t('ex.answer.number'), expected: total.toString() },
      solution: [
        tf('ex.pannello.solutionChoose', {
          letters,
          plugs: words(2 * cables),
          count: 2 * cables,
          chosen: groupDigits(chosen),
        }),
        tf('ex.pannello.solutionPairs', { plugs: words(2 * cables), factors, matchings: groupDigits(matchings) }),
        tf('ex.pannello.solutionTotal', {
          chosen: groupDigits(chosen),
          matchings: groupDigits(matchings),
          total: groupDigits(total),
        }),
      ],
    };
  },
};

type Table = { kind: 'enigma' | 'fixed' | 'oneWay'; wiring: string; detail: Record<string, string> };

/** Sostituzione di un’Enigma I con una chiave casuale, ferma in una posizione qualsiasi. */
function enigmaSubstitution(rng: Rng): number[] {
  const machine = createMachine(randomKey(rng, int(rng, 0, 10)));
  const state = initialState(machine);
  return [...ALPHABET].map((letter) => traceSignal(machine, state, letter).output);
}

/** Le coppie di una sostituzione reciproca senza punti fissi, in ordine casuale. */
function pairsOf(rng: Rng, map: readonly number[]): [number, number][] {
  const pairs = map.flatMap((to, from): [number, number][] => (from < to ? [[from, to]] : []));
  return shuffle(rng, pairs);
}

const wiringOf = (map: readonly number[]) => map.map(toLetter).join('');

function tables(rng: Rng): Table[] {
  const real = enigmaSubstitution(rng);
  const pairs = pairsOf(rng, real);
  const [first, second] = pairs;
  if (!first || !second) throw new RangeError('Sostituzione senza coppie.');

  // Due lettere lasciate al proprio posto: è ancora reciproca, ma ha punti fissi.
  const fixedMap = [...enigmaSubstitution(rng)];
  const [fx, fy] = pairsOf(rng, fixedMap)[0] ?? [0, 1];
  fixedMap[fx] = fx;
  fixedMap[fy] = fy;

  // Due coppie (a b)(c d) diventano un ciclo a → c → b → d → a: niente punti fissi, ma non è reciproca.
  const oneWay = [...enigmaSubstitution(rng)];
  const [[a, b] = [0, 1], [c, d] = [2, 3]] = pairsOf(rng, oneWay);
  oneWay[a] = c;
  oneWay[c] = b;
  oneWay[b] = d;
  oneWay[d] = a;

  return [
    { kind: 'enigma', wiring: wiringOf(real), detail: { pair: `${toLetter(first[0])} ↔ ${toLetter(first[1])}` } },
    { kind: 'fixed', wiring: wiringOf(fixedMap), detail: { x: toLetter(fx), y: toLetter(fy) } },
    {
      kind: 'oneWay',
      wiring: wiringOf(oneWay),
      detail: { from: toLetter(a), to: toLetter(c), back: toLetter(b) },
    },
  ];
}

const involuzione: Exercise = {
  id: 'involuzione',
  level: 3,
  title: t('ex.involuzione.title'),
  summary: t('ex.involuzione.summary'),
  simulator: false,
  generate(seed) {
    const rng = createRng(seed);
    const shuffled = shuffle(rng, tables(rng));
    const names = ['A', 'B', 'C'];
    const answer = names[shuffled.findIndex((table) => table.kind === 'enigma')] ?? 'A';
    return {
      seed,
      blocks: [
        { kind: 'text', text: t('ex.involuzione.intro') },
        {
          kind: 'wiring',
          rows: shuffled.map((table, i) => ({
            name: tf('ex.involuzione.table', { name: names[i] ?? '' }),
            wiring: table.wiring,
          })),
        },
      ],
      answer: { kind: 'letters', label: t('ex.answer.table'), expected: answer },
      solution: shuffled.map((table, i) =>
        tf(`ex.involuzione.${table.kind}`, { name: names[i] ?? '', ...table.detail }),
      ),
    };
  },
};

/** Lettere del rotore destro che, con il resto della chiave, fanno cominciare il messaggio con `crib`. */
export function matchingRightLetters(
  config: Parameters<typeof encipherWith>[0],
  cipher: string,
  crib: string,
): string[] {
  const prefix = cipher.slice(0, crib.length);
  return [...ALPHABET].filter(
    (letter) => encipherWith({ ...config, positions: config.positions.slice(0, 2) + letter }, prefix) === crib,
  );
}

const posizioneIniziale: Exercise = {
  id: 'posizione-iniziale',
  level: 3,
  title: t('ex.ricerca.title'),
  summary: t('ex.ricerca.summary'),
  simulator: true,
  generate(seed) {
    const rng = createRng(seed);
    // Con una parola nota di almeno sette lettere la soluzione è quasi sempre unica; se non lo è, si riprova.
    for (;;) {
      const config = randomKey(rng, 10);
      const text = randomMessage(rng, 'long');
      const crib = text.split(' ')[0] ?? '';
      const cipher = encipherWith(config, prepareText(text));
      if (matchingRightLetters(config, cipher, crib).length !== 1) continue;
      const known = config.positions.slice(0, 2);
      return {
        seed,
        blocks: [
          { kind: 'text', text: tf('ex.ricerca.intro', { crib }) },
          { kind: 'key', sheet: sheetOf(config, { positions: `${known}?` }) },
          { kind: 'message', label: t('ex.label.cipher'), text: groupLetters(cipher) },
        ],
        answer: { kind: 'letters', label: t('ex.answer.start'), expected: config.positions },
        solution: [
          tf('ex.ricerca.solutionSearch', { known, letter: config.positions[2] ?? '', crib }),
          tf('ex.solution.plain', { text }),
        ],
        replay: { config, message: cipher },
      };
    }
  },
};

export const LEVEL_3: readonly Exercise[] = [spazioChiavi, pannello, involuzione, posizioneIniziale];
