import { createContext, useContext, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  /**
   * Cresce di uno a ogni tasto premuto (non con Annulla né con i cambi di configurazione): le
   * animazioni della home ripartono quando cambia, e non si accodano mai.
   */
  pulse: number;
  /** Vero mentre «Digita» batte un testo una lettera alla volta. */
  typing: boolean;
  /** Batte le lettere una alla volta, ogni `AUTOTYPE_MS`; qualunque altro comando lo ferma. */
  autoType: (letters: string) => void;
  stopTyping: () => void;
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

/** Intervallo fra due lettere di «Digita» (docs/design.md, «Animazioni»). */
export const AUTOTYPE_MS = 45;

export function createSimulatorStore(initial: ops.Session): SimulatorStore {
  return createStore<SimulatorState>()((set, get) => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const halt = () => {
      if (timer === undefined) return;
      clearInterval(timer);
      timer = undefined;
      set({ typing: false });
    };
    const apply = (change: (session: ops.Session) => ops.Session) => {
      halt();
      set((s) => ({ session: change(s.session), trace: null }));
    };
    const strike = (letter: string) =>
      set((s) => {
        const session = ops.press(s.session, letter);
        return session === s.session ? s : { session, trace: null, pulse: s.pulse + 1 };
      });
    return {
      session: initial,
      trace: null,
      pulse: 0,
      typing: false,
      setTrace: (step) => set({ trace: step }),
      configure: (update) => apply((s) => ops.createSession(update(s.config))),
      press: (letter) => {
        halt();
        strike(letter);
      },
      pressAll: (letters) => apply((s) => ops.pressAll(s, letters)),
      autoType: (letters) => {
        halt();
        const queue = [...letters];
        if (queue.length === 0 || !get().session.machine) return;
        set({ typing: true });
        timer = setInterval(() => {
          const letter = queue.shift();
          if (letter === undefined) halt();
          else strike(letter);
        }, AUTOTYPE_MS);
      },
      stopTyping: halt,
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

/**
 * Ref da dare a un contenitore: la tastiera fisica agisce sulla macchina solo mentre il focus è
 * dentro di esso (per esempio dopo un clic su un tasto). L’ascoltatore sta qui e non su un
 * attributo `onKeyDown`, perché il contenitore non è un controllo: i tasti li gestiscono i
 * controlli che contiene, e il contenitore li raccoglie quando risalgono.
 */
export function useKeyCapture(store: SimulatorStore) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onKeyDown = (event: KeyboardEvent) => handlePhysicalKey(store, event);
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [store]);
  return ref;
}
