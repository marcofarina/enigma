import { describe, expect, it } from 'vitest';
import { createMachine, defaultConfig, initialState, pressKey } from '@/engine';
import { KEYS_EDGE, REFLECTOR_EDGE, rotorColumns, rowY, signalPath, SPINE_EDGE, wiring } from './geometry.ts';

const machine = createMachine(defaultConfig('I'));
const press = pressKey(machine, initialState(machine), 'A');

describe('schema della home', () => {
  it('divide lo spazio fra i rotori, anche sulla M4', () => {
    expect(rotorColumns(3).map((c) => [c.left, c.right])).toEqual([
      [100, 280],
      [280, 460],
      [460, 640],
    ]);
    const four = rotorColumns(4);
    expect(four[0]?.left).toBe(REFLECTOR_EDGE);
    expect(four.at(-1)?.right).toBe(SPINE_EDGE);
    expect((four[0]?.right ?? 0) - (four[0]?.left ?? 0)).toBe(135);
  });

  it('disegna 26 fili per rotore e 13 per il riflettore', () => {
    const wires = wiring(machine, press.state);
    for (const rotor of wires.rotors) expect(rotor.match(/M/g)).toHaveLength(26);
    expect(wires.reflector.match(/M/g)).toHaveLength(13);
    expect(wires.spine.match(/M/g)).toHaveLength(26);
  });

  it('il percorso completo va dal tasto alla lampada', () => {
    const path = signalPath(press.stages, 3);
    expect(path.key).toBe(0);
    expect(path.lamp).toBe(1);
    expect(path.forward.startsWith(`M${KEYS_EDGE + 4} ${rowY(0)}`)).toBe(true);
    expect(path.back.endsWith(`L${KEYS_EDGE + 4} ${rowY(1)}`)).toBe(true);
    const right = press.stages.find((s) => s.kind === 'rotor' && s.direction === 'forward');
    expect(path.ring.forward[2]).toBe(right?.input);
    // Fra due rotori il contatto condiviso ha un puntino solo.
    const ids = path.contacts.map((c) => `${c.x}-${c.row}-${c.direction}`);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nella traccia si ferma al passo scelto e la lampada si accende solo alla fine', () => {
    expect(signalPath(press.stages, 3, 0)).toMatchObject({ forward: '', back: '', lamp: null, key: 0 });
    const half = signalPath(press.stages, 3, 5);
    expect(half.forward).not.toBe('');
    expect(half.back).toBe('');
    expect(half.lamp).toBeNull();
    expect(signalPath(press.stages, 3, press.stages.length).lamp).toBeNull();
    expect(signalPath(press.stages, 3, press.stages.length + 1).lamp).toBe(1);
  });
});
