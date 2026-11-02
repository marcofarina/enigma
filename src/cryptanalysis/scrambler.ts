import { LETTER_COUNT, mod, step, type Machine, type MachineState } from '@/engine';

/**
 * Sostituzione completa della macchina ferma in uno stato: per ogni tasto, la lampada che si
 * accende. È il calcolo di `traceSignal`, ripetuto per le 26 lettere senza registrare gli stadi,
 * perché la Bombe simulata lo esegue milioni di volte.
 */
export function machineMap(machine: Machine, state: MachineState): number[] {
  const { rotors, reflector, entry, plugboard } = machine;
  const count = rotors.length;
  // Spostamenti portati in 0–25, così dentro il ciclo basta un resto su numeri positivi.
  const offsets = rotors.map((rotor, slot) => mod((state.positions[slot] ?? 0) - rotor.ring));
  const reflectorOffset = mod(state.reflectorPosition);
  const map = new Array<number>(LETTER_COUNT);
  for (let letter = 0; letter < LETTER_COUNT; letter++) {
    let c = entry.forward[plugboard.forward[letter] ?? letter] ?? letter;
    for (let slot = count - 1; slot >= 0; slot--) {
      const offset = offsets[slot] ?? 0;
      c = ((rotors[slot]?.forward[(c + offset) % 26] ?? 0) - offset + 26) % 26;
    }
    c = ((reflector[(c + reflectorOffset) % 26] ?? 0) - reflectorOffset + 26) % 26;
    for (let slot = 0; slot < count; slot++) {
      const offset = offsets[slot] ?? 0;
      c = ((rotors[slot]?.backward[(c + offset) % 26] ?? 0) - offset + 26) % 26;
    }
    map[letter] = plugboard.backward[entry.backward[c] ?? c] ?? c;
  }
  return map;
}

/** Gli stati raggiunti premendo `count` tasti a partire da `state` (il primo è dopo un tasto). */
export function statesAfter(machine: Machine, state: MachineState, count: number): MachineState[] {
  const states: MachineState[] = [];
  let current = state;
  for (let i = 0; i < count; i++) {
    current = step(machine, current).state;
    states.push(current);
  }
  return states;
}

/** Composizione: prima `first`, poi `second`. */
export function compose(first: readonly number[], second: readonly number[]): number[] {
  return first.map((x) => second[x] ?? x);
}
