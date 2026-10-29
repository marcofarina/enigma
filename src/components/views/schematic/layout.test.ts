import { describe, expect, it } from 'vitest';
import { createMachine, defaultConfig, initialState, pressKey } from '@/engine';
import { layoutSchematic } from './layout.ts';

describe('schema del circuito', () => {
  const machine = createMachine({ ...defaultConfig('I'), plugboard: ['AQ'] });

  it('dispone le colonne da riflettore a tastiera', () => {
    const schematic = layoutSchematic(machine, initialState(machine));
    expect(schematic.columns.map((c) => c.kind)).toEqual([
      'reflector',
      'rotor',
      'rotor',
      'rotor',
      'entry',
      'plugboard',
      'keys',
    ]);
    expect(schematic.forward).toBe('');
    // 26 fili per componente a due lati, 13 archi nel riflettore.
    expect(schematic.columns.map((c) => c.wiring.length)).toEqual([13, 26, 26, 26, 26, 26, 0]);
  });

  it('segna i contatti attraversati dal segnale', () => {
    const result = pressKey(machine, initialState(machine), 'A');
    const schematic = layoutSchematic(machine, result.state, result.stages);
    const keys = schematic.columns.at(-1);
    expect(keys?.rightMarks[0]).toBe('forward');
    expect(keys?.rightMarks[result.output.charCodeAt(0) - 65]).toBe('return');
    const plugboard = schematic.columns.find((c) => c.kind === 'plugboard');
    expect(plugboard?.leftMarks[16]).toBe('forward'); // A → Q sul pannello
    expect(schematic.forward.startsWith('M ')).toBe(true);
    expect(schematic.back.startsWith('M ')).toBe(true);
  });

  it('le lettere dei rotori scorrono con la posizione', () => {
    const result = pressKey(machine, initialState(machine), 'A');
    const fast = layoutSchematic(machine, result.state, result.stages).columns.find((c) => c.slot === 2);
    expect(fast?.labels.slice(0, 2)).toEqual(['B', 'C']);
  });

  it('disegna solo i primi stadi durante la traccia passo-passo', () => {
    const result = pressKey(machine, initialState(machine), 'A');
    const lamp = result.output.charCodeAt(0) - 65;
    const start = layoutSchematic(machine, result.state, result.stages, 0);
    expect(start.columns.at(-1)?.rightMarks[0]).toBe('forward');
    expect(start.columns.find((c) => c.kind === 'plugboard')?.leftMarks.every((m) => m === null)).toBe(true);

    // Fino al riflettore compreso: andata completa, ritorno appena iniziato.
    const reflector = result.stages.findIndex((stage) => stage.kind === 'reflector');
    const half = layoutSchematic(machine, result.state, result.stages, reflector + 1);
    expect(half.forward).not.toBe('');
    expect(half.columns.find((c) => c.kind === 'rotor' && c.slot === 0)?.leftMarks.includes('return')).toBe(false);

    const beforeLamp = layoutSchematic(machine, result.state, result.stages, result.stages.length);
    expect(beforeLamp.columns.at(-1)?.rightMarks[lamp]).toBeNull();
    const full = layoutSchematic(machine, result.state, result.stages);
    expect(full.columns.at(-1)?.rightMarks[lamp]).toBe('return');
    expect(full.back.length).toBeGreaterThan(beforeLamp.back.length);
  });
});
