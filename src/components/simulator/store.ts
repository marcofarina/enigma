import { createContext, useContext, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import type { MachineConfig } from '@/engine';
import { isEditableTarget, keyAction } from './keys.ts';
import * as ops from './session.ts';

export interface SimulatorState {
  session: ops.Session;
  /**
   * Passo della traccia dell’ultimo tasto (vedi `trace.ts`), oppure `null` per il percorso
   * completo. Ogni cambiamento della sessione la riporta a `null`.
   */
  trace: number | null;
  setTrace: (step: number | null) => void;
  /** Sostituisce la configurazione (il nastro ricomincia). */
  configure: (update: (config: MachineConfig) => MachineConfig) => void;
  press: (letter: string) => void;
  pressAll: (letters: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  setWindow: (slot: number, letter: string) => void;
  setReflectorWindow: (letter: string) => void;
}

export type SimulatorStore = StoreApi<SimulatorState>;

export function createSimulatorStore(initial: ops.Session): SimulatorStore {
  return createStore<SimulatorState>()((set) => {
    const apply = (change: (session: ops.Session) => ops.Session) =>
      set((s) => ({ session: change(s.session), trace: null }));
    return {
      session: initial,
      trace: null,
      setTrace: (step) => set({ trace: step }),
      configure: (update) => apply((s) => ops.createSession(update(s.config))),
      press: (letter) => apply((s) => ops.press(s, letter)),
      pressAll: (letters) => apply((s) => ops.pressAll(s, letters)),
      undo: () => apply(ops.undo),
      redo: () => apply(ops.redo),
      reset: () => apply(ops.resetTape),
      setWindow: (slot, letter) => apply((s) => ops.setWindow(s, slot, letter)),
      setReflectorWindow: (letter) => apply((s) => ops.setReflectorWindow(s, letter)),
    };
  });
}

export const SimulatorContext = createContext<SimulatorStore | null>(null);

/** Legge dallo store del simulatore. Il selettore deve restituire valori stabili (campi dello stato). */
export function useSimulator<T>(selector: (state: SimulatorState) => T): T {
  const store = useContext(SimulatorContext);
  if (!store) throw new Error('useSimulator va usato dentro <SimulatorContext>.');
  return useStore(store, selector);
}

/**
 * Inoltra alla macchina un tasto della tastiera fisica: lettere e Backspace, ma non mentre si
 * scrive in un campo. Restituisce vero se il tasto è stato usato.
 */
export function handlePhysicalKey(store: SimulatorStore, event: KeyboardEvent | ReactKeyboardEvent): boolean {
  if (event.defaultPrevented || isEditableTarget(event.target)) return false;
  const action = keyAction(event);
  const state = store.getState();
  if (!action || !state.session.machine) return false;
  event.preventDefault();
  if (action.type === 'undo') state.undo();
  else state.press(action.letter);
  return true;
}
