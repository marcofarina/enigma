import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addIndicator,
  ALPHABET,
  buildMenu,
  chains,
  characteristic,
  characteristicFromIndicators,
  createMachine,
  cribCrashes,
  cribPositions,
  cycleNotation,
  cycles,
  cycleType,
  doubledIndicators,
  emptyCharacteristic,
  encipher,
  hasPairedCycles,
  initialState,
  isComplete,
  isInvolution,
  loopPermutation,
  menuCentre,
  menuComponents,
  menuLoops,
  parseCycles,
  pressPermutations,
  PRODUCT_NAMES,
  product,
  secondFactorTranspositions,
  testHypothesis,
  toIndex,
  toLetter,
  transpositionsFromPair,
  type Machine,
  type MachineConfig,
} from '../index.ts';

const letters = (length: number) =>
  fc.array(fc.constantFrom(...ALPHABET), { minLength: length, maxLength: length }).map((chars) => chars.join(''));

const pairsArb = (count: number) =>
  fc.shuffledSubarray([...ALPHABET], { minLength: 2 * count, maxLength: 2 * count }).map((chars) => {
    const pairs: string[] = [];
    for (let i = 0; i < chars.length; i += 2) pairs.push(`${chars[i]}${chars[i + 1]}`);
    return pairs;
  });

/** Chiavi dell’Enigma I della Wehrmacht: tre rotori su cinque, riflettore B o C, da 0 a 13 cavi. */
const configArb: fc.Arbitrary<MachineConfig> = fc
  .record({
    rotors: fc.shuffledSubarray(['I', 'II', 'III', 'IV', 'V'], { minLength: 3, maxLength: 3 }),
    reflector: fc.constantFrom('B', 'C'),
    rings: letters(3),
    positions: letters(3),
    plugboard: fc.integer({ min: 0, max: 13 }).chain(pairsArb),
  })
  .map((key) => ({ model: 'I', ...key }));

const keysArb = (min: number, max: number) => fc.array(letters(3), { minLength: min, maxLength: max });

/** Il pannello a spine come permutazione: S di Rejewski. */
const plugboardOf = (machine: Machine) => machine.plugboard.forward;

const involutionFrom = (pairs: ReadonlyArray<readonly [number, number]>) => {
  const map: (number | null)[] = Array.from({ length: 26 }, () => null);
  for (const [a, b] of pairs) {
    map[a] = b;
    map[b] = a;
  }
  return map;
};

const word = (cycle: readonly number[]) => cycle.map(toLetter).join('');

describe('permutazioni', () => {
  it('il prodotto si legge da sinistra a destra', () => {
    const a = parseCycles('(AB)');
    const b = parseCycles('(BC)');
    expect(cycleNotation(product(a, b))).toBe(
      '(ACB)(D)(E)(F)(G)(H)(I)(J)(K)(L)(M)(N)(O)(P)(Q)(R)(S)(T)(U)(V)(W)(X)(Y)(Z)',
    );
  });

  it('notazione a cicli: lettura e scrittura', () => {
    fc.assert(
      fc.property(fc.shuffledSubarray([...ALPHABET], { minLength: 26, maxLength: 26 }), (shuffled) => {
        const map = shuffled.map(toIndex);
        expect(parseCycles(cycleNotation(map))).toEqual(map);
      }),
    );
    expect(() => parseCycles('(AB)(BC)')).toThrow(RangeError);
    expect(() => parseCycles('(AB) C')).toThrow(RangeError);
  });
});

describe('Rejewski 1980: gli esempi del testo', () => {
  // Rejewski 1980, p. 5, formule (1).
  const day = {
    AD: parseCycles('(dvpfkxgzyo) (eijmunqlht) (bc) (rw) (a) (s)'),
    BE: parseCycles('(blfqveoum) (hjpswizrn) (axt) (cgy) (d) (k)'),
    CF: parseCycles('(abviktjgfcqny) (duzrehlxwpsmo)'),
  };

  it('la caratteristica di p. 5 ha i cicli a coppie di lunghezza uguale', () => {
    expect(cycleType(day.AD)).toEqual([10, 10, 2, 2, 1, 1]);
    expect(cycleType(day.BE)).toEqual([9, 9, 3, 3, 1, 1]);
    expect(cycleType(day.CF)).toEqual([13, 13]);
    for (const name of PRODUCT_NAMES) expect(hasPairedCycles(day[name])).toBe(true);
    expect(hasPairedCycles(parseCycles('(ABC)(DE)'))).toBe(false);
  });

  it('tre indicatori danno i frammenti dvpf, oumb, cqny (p. 6)', () => {
    const partial = characteristicFromIndicators(['DMQVBN', 'VONPUY', 'PUCFMQ']);
    expect(chains(partial.AD)).toEqual({ closed: [], open: [[3, 21, 15, 5]] });
    expect(chains(partial.BE).open.map(word)).toEqual(['OUMB']);
    expect(chains(partial.CF).open.map(word)).toEqual(['CQNY']);
  });

  it('se xqr gve vuol dire jjj, nfa qqb vuol dire ppp e eug imf zzz (p. 10)', () => {
    const [A, B, C] = (['AD', 'BE', 'CF'] as const).map((name, i) => {
      const pairs = transpositionsFromPair(day[name], toIndex('J'), toIndex('XQR'.charAt(i)));
      if (!pairs) throw new Error('ipotesi impossibile');
      return pairs;
    });
    if (!A || !B || !C) throw new Error('fattori mancanti');
    const factors = [
      involutionFrom(A),
      involutionFrom(B),
      involutionFrom(C),
      involutionFrom(secondFactorTranspositions(day.AD, A)),
      involutionFrom(secondFactorTranspositions(day.BE, B)),
      involutionFrom(secondFactorTranspositions(day.CF, C)),
    ];
    const decode = (indicator: string) =>
      [...indicator].map((letter, k) => toLetter(factors[k]?.[toIndex(letter)] ?? NaN)).join('');
    expect(decode('XQRGVE')).toBe('JJJJJJ');
    expect(decode('NFAQQB')).toBe('PPPPPP');
    expect(decode('EUGIMF')).toBe('ZZZZZZ');
  });

  it('un’ipotesi su due lettere dello stesso ciclo o di cicli di lunghezza diversa è impossibile', () => {
    expect(transpositionsFromPair(day.AD, toIndex('D'), toIndex('V'))).toBeNull();
    expect(transpositionsFromPair(day.AD, toIndex('D'), toIndex('B'))).toBeNull();
    expect(transpositionsFromPair(day.AD, toIndex('A'), toIndex('S'))).toEqual([[0, 18]]);
  });
});

describe('Rejewski 1980: indicatori doppi e caratteristica', () => {
  it('A, B, C, D, E, F sono involuzioni senza punti fissi e AD, BE, CF hanno i cicli a coppie', () => {
    fc.assert(
      fc.property(configArb, (config) => {
        const machine = createMachine(config);
        for (const permutation of pressPermutations(machine, initialState(machine), 6)) {
          expect(isInvolution(permutation)).toBe(true);
          permutation.forEach((target, source) => expect(target).not.toBe(source));
        }
        const exact = characteristic(machine);
        for (const name of PRODUCT_NAMES) expect(hasPairedCycles(exact[name])).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it('gli indicatori di una giornata rivelano la caratteristica esatta, un pezzo alla volta', () => {
    fc.assert(
      fc.property(configArb, keysArb(1, 120), (config, keys) => {
        const machine = createMachine(config);
        const exact = characteristic(machine);
        const partial = characteristicFromIndicators(doubledIndicators(machine, keys));
        for (const name of PRODUCT_NAMES) {
          partial[name].forEach((target, source) => {
            if (target !== null) expect(target).toBe(exact[name][source]);
          });
          const exactCycles = cycles(exact[name]).map(word);
          for (const cycle of chains(partial[name]).closed) expect(exactCycles).toContain(word(cycle));
        }
      }),
      { numRuns: 200 },
    );
  });

  it('con tutte le lettere in ogni posto la caratteristica è completa', () => {
    fc.assert(
      fc.property(configArb, (config) => {
        const machine = createMachine(config);
        const keys = [...ALPHABET].map((letter) => letter.repeat(3));
        const partial = characteristicFromIndicators(doubledIndicators(machine, keys));
        const exact = characteristic(machine);
        for (const name of PRODUCT_NAMES) {
          const map = partial[name];
          expect(isComplete(map)).toBe(true);
          expect(map).toEqual(exact[name]);
          expect(chains(map)).toEqual({ closed: cycles(exact[name]), open: [] });
        }
      }),
      { numRuns: 100 },
    );
  });

  it('il pannello a spine non cambia la struttura in cicli: il catalogo del ciclometro', () => {
    fc.assert(
      fc.property(configArb, fc.integer({ min: 0, max: 13 }).chain(pairsArb), (config, plugboard) => {
        const plain = characteristic(createMachine({ ...config, plugboard: [] }));
        const plugged = characteristic(createMachine({ ...config, plugboard }));
        for (const name of PRODUCT_NAMES) expect(cycleType(plugged[name])).toEqual(cycleType(plain[name]));
      }),
      { numRuns: 200 },
    );
  });

  it('da una trasposizione vera di A si ricavano tutte quelle fra i suoi due cicli, e le corrispondenti di D', () => {
    fc.assert(
      fc.property(configArb, fc.integer({ min: 0, max: 25 }), (config, letter) => {
        const machine = createMachine(config);
        const [A, , , D] = pressPermutations(machine, initialState(machine), 6);
        const { AD } = characteristic(machine);
        const partner = A?.[letter] ?? NaN;
        const pairs = transpositionsFromPair(AD, letter, partner);
        expect(pairs).not.toBeNull();
        for (const [u, v] of pairs ?? []) expect(A?.[u]).toBe(v);
        for (const [u, v] of secondFactorTranspositions(AD, pairs ?? [])) expect(D?.[u]).toBe(v);
      }),
      { numRuns: 200 },
    );
  });

  it('rifiuta indicatori malformati o di un’altra posizione di base', () => {
    const machine = createMachine({
      model: 'I',
      rotors: ['I', 'II', 'III'],
      rings: 'AAA',
      positions: 'AAA',
      reflector: 'B',
    });
    expect(() => doubledIndicators(machine, ['AB'])).toThrow(RangeError);
    expect(() => addIndicator(emptyCharacteristic(), 'ABCDE')).toThrow(RangeError);
    expect(() => addIndicator(emptyCharacteristic(), 'ABCDE1')).toThrow(RangeError);
    const once = addIndicator(emptyCharacteristic(), 'ABCDEF');
    expect(addIndicator(once, 'ABCDEF')).toEqual(once);
    expect(() => addIndicator(once, 'AXXEXX')).toThrow(/A porta già a D/);
    expect(() => addIndicator(once, 'XXXDXX')).toThrow(/a D porta già A/);
  });
});

describe('Bletchley Park: crib e menu', () => {
  const config: MachineConfig = {
    model: 'M3',
    rotors: ['II', 'IV', 'V'],
    rings: 'BUL',
    positions: 'BLA',
    reflector: 'B',
    plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
  };
  const machine = createMachine(config);
  const start = initialState(machine);
  const plaintext = 'KEINEBESONDERENEREIGNISSEWETTERVORHERSAGEBISKAYA';
  const ciphertext = encipher(machine, start, plaintext).output;
  const crib = 'WETTERVORHERSAGE';
  const offset = plaintext.indexOf(crib);
  const menu = buildMenu(crib, ciphertext, offset);
  const steckered = (letter: string) => toLetter(plugboardOf(machine)[toIndex(letter)] ?? NaN);

  it('il crib non può stare dove una lettera cifrerebbe sé stessa', () => {
    expect(cribPositions(crib, ciphertext)).toContain(offset);
    expect(cribCrashes('AB', 'XB', 0)).toEqual([1]);
    expect(cribPositions('AB', 'ABAXB')).toEqual([1]);
    expect(() => buildMenu('AB', 'XB')).toThrow(/posizioni 1/);
    expect(() => cribCrashes('ABC', 'XY', 0)).toThrow(RangeError);
    expect(() => cribCrashes('AB', 'XYZ', 2)).toThrow(RangeError);
  });

  it('il menu ha un collegamento per lettera del crib, e collegamenti − lettere + parti anelli', () => {
    expect(menu.edges).toHaveLength(crib.length);
    expect(menu.edges[0]).toEqual({ position: offset, plain: 'W', cipher: ciphertext.charAt(offset) });
    const loops = menuLoops(menu);
    expect(loops.length).toBe(menu.edges.length - menu.letters.length + menuComponents(menu).length);
    expect(loops.length).toBeGreaterThan(0);
    expect(menu.letters).toContain(menuCentre(menu));
  });

  it('due collegamenti fra le stesse lettere fanno un anello di due', () => {
    const small = buildMenu('ABA', 'BAB');
    const loops = menuLoops(small);
    expect(loops).toHaveLength(2);
    expect(loops.every((loop) => loop.letters.length === 2)).toBe(true);
  });

  it('con la chiave giusta il compagno della prima lettera è un punto fisso di ogni anello', () => {
    for (const loop of menuLoops(menu)) {
      const first = loop.letters[0] ?? '';
      expect(loopPermutation(machine, start, loop)[toIndex(steckered(first))]).toBe(toIndex(steckered(first)));
    }
  });

  it('con la chiave giusta l’ipotesi corretta non dà contraddizioni, con e senza diagonal board', () => {
    const letter = menuCentre(menu);
    for (const diagonalBoard of [true, false]) {
      const test = testHypothesis(machine, start, menu, { letter, partner: steckered(letter) }, { diagonalBoard });
      expect(test.consistent).toBe(true);
      expect(test.deductions[0]?.cause).toEqual({ kind: 'hypothesis' });
      for (const { letter: l, partner } of test.deductions) expect(partner).toBe(steckered(l));
      // La prova raggiunge solo la parte del menu collegata alla lettera centrale.
      const reached = menuComponents(menu).find((component) => component.includes(letter)) ?? [];
      for (const l of reached) expect(test.partners[toIndex(l)]).toEqual([steckered(l)]);
    }
  });

  it('il diagonal board trova più contraddizioni delle ipotesi sbagliate', () => {
    const letter = menuCentre(menu);
    const wrong = [...ALPHABET].filter((partner) => partner !== steckered(letter));
    const rejected = (diagonalBoard: boolean) =>
      wrong.filter(
        (partner) => !testHypothesis(machine, start, menu, { letter, partner }, { diagonalBoard }).consistent,
      ).length;
    expect(rejected(true)).toBe(wrong.length);
    expect(rejected(true)).toBeGreaterThanOrEqual(rejected(false));

    // Nelle posizioni sbagliate dei rotori, senza diagonal board qualche ipotesi resta in piedi.
    const survivors = (diagonalBoard: boolean) => {
      let count = 0;
      for (let k = 0; k < 200; k++) {
        const positions = toLetter(k) + toLetter(7 * k) + toLetter(11 * k);
        if (positions === config.positions) continue;
        const guess = createMachine({ ...config, positions });
        for (const partner of ALPHABET) {
          if (testHypothesis(guess, initialState(guess), menu, { letter, partner }, { diagonalBoard }).consistent) {
            count++;
          }
        }
      }
      return count;
    };
    expect(survivors(true)).toBeLessThan(survivors(false));
  });

  it('una contraddizione indica la lettera, i due compagni e la deduzione che la porta', () => {
    const letter = menuCentre(menu);
    const partner = steckered(letter) === 'A' ? 'B' : 'A';
    const test = testHypothesis(machine, start, menu, { letter, partner });
    const first = test.contradictions[0];
    expect(first).toBeDefined();
    if (!first) return;
    const deduction = test.deductions[first.deduction];
    expect(deduction?.letter).toBe(first.letter);
    expect(deduction?.partner).toBe(first.partners[1]);
    expect(first.partners[0]).not.toBe(first.partners[1]);
  });

  it('senza la chiave dell’Uhr la prova non si fa', () => {
    const withUhr = createMachine({
      model: 'I',
      rotors: ['I', 'II', 'III'],
      rings: 'AAA',
      positions: 'AAA',
      reflector: 'B',
      plugboard: ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'],
      uhr: 4,
    });
    expect(() => testHypothesis(withUhr, initialState(withUhr), menu, { letter: 'E', partner: 'E' })).toThrow(/Uhr/);
  });
});

describe('Bletchley Park: proprietà della prova', () => {
  const messageArb = fc.array(fc.constantFrom(...ALPHABET), { minLength: 12, maxLength: 30 }).map((c) => c.join(''));

  it('con la chiave giusta l’ipotesi corretta è coerente e ogni anello ha il suo punto fisso', () => {
    fc.assert(
      fc.property(configArb, messageArb, fc.boolean(), (config, plaintext, diagonalBoard) => {
        const machine = createMachine(config);
        const start = initialState(machine);
        const ciphertext = encipher(machine, start, plaintext).output;
        const menu = buildMenu(plaintext, ciphertext);
        const S = (letter: string) => toLetter(plugboardOf(machine)[toIndex(letter)] ?? NaN);
        const letter = menuCentre(menu);
        const test = testHypothesis(machine, start, menu, { letter, partner: S(letter) }, { diagonalBoard });
        expect(test.consistent).toBe(true);
        for (const loop of menuLoops(menu)) {
          const first = S(loop.letters[0] ?? '');
          expect(loopPermutation(machine, start, loop)[toIndex(first)]).toBe(toIndex(first));
          loop.edges.forEach((edge, i) => {
            const from = loop.letters[i] ?? '';
            const to = loop.letters[(i + 1) % loop.letters.length] ?? '';
            expect([edge.plain, edge.cipher].sort()).toEqual([from, to].sort());
          });
        }
      }),
      { numRuns: 150 },
    );
  });

  it('ciò che si contraddice senza diagonal board si contraddice anche con', () => {
    fc.assert(
      fc.property(
        configArb,
        messageArb,
        letters(3),
        fc.constantFrom(...ALPHABET),
        (config, plaintext, positions, partner) => {
          const machine = createMachine(config);
          const ciphertext = encipher(machine, initialState(machine), plaintext).output;
          const menu = buildMenu(plaintext, ciphertext);
          const guess = createMachine({ ...config, positions });
          const hypothesis = { letter: menuCentre(menu), partner };
          const without = testHypothesis(guess, initialState(guess), menu, hypothesis, { diagonalBoard: false });
          const withBoard = testHypothesis(guess, initialState(guess), menu, hypothesis);
          if (!without.consistent) expect(withBoard.consistent).toBe(false);
          expect(withBoard.deductions.length).toBeGreaterThanOrEqual(without.deductions.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});
