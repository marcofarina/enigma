/**
 * A che punto è la decifrazione di una missione: si confronta il nastro del simulatore con il
 * testo cifrato e con il testo in chiaro atteso.
 */
export type MissionProgress =
  | { kind: 'empty' }
  /** Le lettere digitate non sono l’inizio del testo cifrato (per esempio si sta decifrando l’indicatore). */
  | { kind: 'other' }
  /** Si sta digitando il testo cifrato e finora le lampade danno il testo atteso. */
  | { kind: 'ok'; done: number; total: number }
  /** Si sta digitando il testo cifrato, ma dalla lettera `at` (contando da 1) il risultato diverge. */
  | { kind: 'wrong'; at: number }
  | { kind: 'solved' };

export function missionProgress(input: string, output: string, cipher: string, plain: string): MissionProgress {
  if (input.length === 0) return { kind: 'empty' };
  if (!cipher.startsWith(input)) return { kind: 'other' };
  for (let i = 0; i < output.length; i++) {
    if (output[i] !== plain[i]) return { kind: 'wrong', at: i + 1 };
  }
  return input.length === cipher.length ? { kind: 'solved' } : { kind: 'ok', done: input.length, total: cipher.length };
}
