import {
  createMachine,
  initialState,
  isLetter,
  pressKey,
  toLetter,
  validateConfig,
  windowLetters,
  type ConfigIssue,
  type KeyPress,
  type Machine,
  type MachineConfig,
  type MachineState,
} from '@/engine';
import { changePosition, changeReflectorPosition } from './config-edit.ts';

/**
 * Sessione del simulatore: la configurazione scelta, la macchina che ne deriva (se valida) e il
 * nastro dei tasti premuti. È l’unica fonte di verità da cui derivano tutte le viste. Annullare
 * significa togliere l’ultima pressione dal nastro: lo stato precedente è già lì.
 */
export interface Session {
  readonly config: MachineConfig;
  /** `null` finché la configurazione non è realizzabile: la tastiera resta bloccata. */
  readonly machine: Machine | null;
  readonly issues: readonly ConfigIssue[];
  readonly presses: readonly KeyPress[];
  /** Pressioni annullate, da ripetere: l’ultima è la prossima. */
  readonly undone: readonly KeyPress[];
}

export function createSession(config: MachineConfig): Session {
  const issues = validateConfig(config);
  return { config, machine: issues.length === 0 ? createMachine(config) : null, issues, presses: [], undone: [] };
}

/** Stato attuale dei rotori: dopo l’ultima pressione, oppure quello iniziale. */
export function currentState(session: Session): MachineState | null {
  if (!session.machine) return null;
  return session.presses.at(-1)?.state ?? initialState(session.machine);
}

/** Preme una lettera. I caratteri non validi e le configurazioni incomplete non cambiano nulla. */
export function press(session: Session, letter: string): Session {
  const state = currentState(session);
  if (!session.machine || !state || !isLetter(letter)) return session;
  const result = pressKey(session.machine, state, letter);
  return { ...session, presses: [...session.presses, result], undone: [] };
}

export function pressAll(session: Session, letters: string): Session {
  let next = session;
  for (const letter of letters) next = press(next, letter);
  return next;
}

export function undo(session: Session): Session {
  const last = session.presses.at(-1);
  if (!last) return session;
  return { ...session, presses: session.presses.slice(0, -1), undone: [...session.undone, last] };
}

export function redo(session: Session): Session {
  const next = session.undone.at(-1);
  if (!next) return session;
  return { ...session, presses: [...session.presses, next], undone: session.undone.slice(0, -1) };
}

/** Riporta i rotori alla posizione iniziale e svuota il nastro. */
export function resetTape(session: Session): Session {
  return { ...session, presses: [], undone: [] };
}

/**
 * Gira a mano un rotore. Le altre finestrelle restano dove sono arrivate, e la nuova
 * combinazione diventa la posizione iniziale: il nastro ricomincia da capo.
 */
export function setWindow(session: Session, slot: number, letter: string): Session {
  return createSession(changePosition(configAtCurrentState(session), slot, letter));
}

/** Come `setWindow`, per il riflettore dei modelli che ne permettono la regolazione. */
export function setReflectorWindow(session: Session, letter: string): Session {
  return createSession(changeReflectorPosition(configAtCurrentState(session), letter));
}

/** La configurazione con le posizioni raggiunte dopo l’ultimo tasto (riflettore compreso, nei modelli G). */
export function configAtCurrentState(session: Session): MachineConfig {
  const state = currentState(session);
  if (!state) return session.config;
  return changeReflectorPosition(
    { ...session.config, positions: windowLetters(state) },
    toLetter(state.reflectorPosition),
  );
}

/** Lettere visibili nelle finestrelle (anche con una configurazione incompleta). */
export function windows(session: Session): { rotors: string; reflector: string } {
  const state = currentState(session);
  if (!state) return { rotors: session.config.positions, reflector: session.config.reflectorPosition ?? 'A' };
  return { rotors: windowLetters(state), reflector: toLetter(state.reflectorPosition) };
}

export function tapeLetters(session: Session): { input: string; output: string } {
  return {
    input: session.presses.map((p) => p.input).join(''),
    output: session.presses.map((p) => p.output).join(''),
  };
}
