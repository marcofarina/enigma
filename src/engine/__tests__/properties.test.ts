import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ALPHABET,
  createMachine,
  encipher,
  expectedRotorCount,
  initialState,
  MODEL_IDS,
  MODELS,
  pressKey,
  rotorNames,
  stageMap,
  step,
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

/** Configurazioni valide di qualsiasi modello, con Uhr e UKW-D quando disponibili. */
const configArb: fc.Arbitrary<MachineConfig> = fc.constantFrom(...MODEL_IDS).chain((id) => {
  const model = MODELS[id];
  const { regular, thin } = rotorNames(model);
  return fc.constantFrom(...Object.keys(model.reflectors)).chain((reflector) => {
    const count = expectedRotorCount(model, reflector);
    const rotorsArb = fc
      .tuple(
        fc.shuffledSubarray(regular, { minLength: 3, maxLength: 3 }),
        thin.length > 0 ? fc.constantFrom(...thin) : fc.constant(''),
      )
      .map(([chosen, thinRotor]) => (count === 4 ? [thinRotor, ...chosen] : chosen));
    const plugboardArb = model.plugboard
      ? fc.oneof(
          fc.integer({ min: 0, max: 13 }).chain((n) => pairsArb(n).map((plugboard) => ({ plugboard }))),
          ...(model.uhr
            ? [fc.tuple(pairsArb(10), fc.integer({ min: 0, max: 39 })).map(([plugboard, uhr]) => ({ plugboard, uhr }))]
            : []),
        )
      : fc.constant({});
    const ukwDArb = model.reflectors[reflector]?.rewirable
      ? fc
          .shuffledSubarray(
            [...ALPHABET].filter((l) => l !== 'J' && l !== 'Y'),
            { minLength: 24, maxLength: 24 },
          )
          .map((chars) => ({ ukwD: Array.from({ length: 12 }, (_, i) => `${chars[2 * i]}${chars[2 * i + 1]}`) }))
      : fc.constant({});
    const reflectorPositionArb = model.reflectorSettable
      ? fc.constantFrom(...ALPHABET).map((reflectorPosition) => ({ reflectorPosition }))
      : fc.constant({});
    return fc
      .record({
        rotors: rotorsArb,
        rings: letters(count),
        positions: letters(count),
        extra: plugboardArb,
        ukw: ukwDArb,
        refl: reflectorPositionArb,
      })
      .map(({ rotors, rings, positions, extra, ukw, refl }) => ({
        model: id,
        rotors,
        rings,
        positions,
        reflector,
        ...extra,
        ...ukw,
        ...refl,
      }));
  });
});

const messageArb = fc
  .array(fc.constantFrom(...ALPHABET), { minLength: 1, maxLength: 200 })
  .map((chars) => chars.join(''));

describe('proprietà della macchina', () => {
  it('cifrare due volte con la stessa chiave restituisce il testo in chiaro', () => {
    fc.assert(
      fc.property(configArb, messageArb, (config, message) => {
        const machine = createMachine(config);
        const once = encipher(machine, initialState(machine), message).output;
        expect(encipher(machine, initialState(machine), once).output).toBe(message);
      }),
      { numRuns: 500 },
    );
  });

  it('nessuna lettera viene mai cifrata in sé stessa', () => {
    fc.assert(
      fc.property(configArb, messageArb, (config, message) => {
        const machine = createMachine(config);
        const output = encipher(machine, initialState(machine), message).output;
        [...message].forEach((letter, i) => expect(output[i]).not.toBe(letter));
      }),
      { numRuns: 500 },
    );
  });

  it('il rotore veloce avanza a ogni tasto e i rotori avanzano di una posizione alla volta', () => {
    fc.assert(
      fc.property(configArb, fc.integer({ min: 1, max: 700 }), (config, presses) => {
        const machine = createMachine(config);
        let state = initialState(machine);
        for (let i = 0; i < presses; i++) {
          const next = step(machine, state);
          const fast = state.positions.length - 1;
          expect(next.moved[fast]).toBe(true);
          next.state.positions.forEach((position, slot) => {
            const before = state.positions[slot] ?? 0;
            expect(position).toBe(next.moved[slot] ? (before + 1) % 26 : before);
          });
          if (machine.rotors[0]?.notches.size === 0 && state.positions.length === 4) expect(next.moved[0]).toBe(false);
          state = next.state;
        }
      }),
      { numRuns: 200 },
    );
  });

  it('ogni stadio coincide con la sostituzione completa del suo componente', () => {
    fc.assert(
      fc.property(configArb, messageArb, (config, message) => {
        const machine = createMachine(config);
        let state = initialState(machine);
        for (const letter of message) {
          const press = pressKey(machine, state, letter);
          for (const stage of press.stages) {
            const map = stageMap(machine, press.state, stage);
            expect(map[stage.input]).toBe(stage.output);
            expect(new Set(map).size).toBe(26);
          }
          state = press.state;
        }
      }),
      { numRuns: 200 },
    );
  });
});
