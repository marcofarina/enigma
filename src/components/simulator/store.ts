import { createContext, useContext } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import type { MachineConfig } from '@/engine';
import * as ops from './session.ts';

export interface SimulatorState {
  session: ops.Session;
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
    const apply = (change: (session: ops.Session) => ops.Session) => set((s) => ({ session: change(s.session) }));
    return {
      session: initial,
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
