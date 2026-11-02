import type { MachineConfig } from '@/engine';

/**
 * Tipi comuni agli esercizi. Il testo di una variante è fatto di blocchi strutturati, che
 * l’interfaccia rende sullo schermo e le schede stampabili sulla carta.
 */

export type Level = 1 | 2 | 3;

export interface KeySheet {
  rotors: string[];
  rings: string;
  plugboard: string[];
  /** Grundstellung, quando fa parte della chiave. */
  positions?: string;
  /** Anelli scritti come numeri da 01 a 26, come sui rotori dell’Enigma I. */
  ringsAsNumbers?: boolean;
}

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'key'; sheet: KeySheet }
  | { kind: 'message'; label: string; text: string }
  | { kind: 'wiring'; rows: { name: string; wiring: string }[] }
  | { kind: 'compare'; plain: string; cipher: string };

export interface Answer {
  kind: 'letters' | 'number';
  label: string;
  /** Già normalizzata: solo lettere maiuscole, oppure un numero senza zeri iniziali. */
  expected: string;
}

export interface Variant {
  seed: number;
  blocks: Block[];
  answer: Answer;
  solution: string[];
  /** Configurazione e testo per rivedere la soluzione nel simulatore. */
  replay?: { config: MachineConfig; message: string };
}

export interface Exercise {
  id: string;
  level: Level;
  title: string;
  summary: string;
  /** Mostra il simulatore accanto all’esercizio (negli esercizi “a mano” resta nascosto). */
  simulator: boolean;
  generate: (seed: number) => Variant;
}
