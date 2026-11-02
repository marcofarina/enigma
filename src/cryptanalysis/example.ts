import { encipherWith, prepareText, type MachineConfig } from '@/engine';

/**
 * Esempio per la Bombe: un bollettino meteorologico inventato, cifrato con un’Enigma I. Il crib
 * è l’inizio del messaggio, come accadeva spesso con i bollettini, che seguivano sempre lo stesso
 * schema. Gli anelli sono su A per semplicità: così le posizioni trovate dalla Bombe coincidono
 * con le lettere nelle finestrelle.
 */
export const BOMBE_KEY = {
  model: 'I',
  rotors: ['II', 'V', 'III'],
  rings: 'AAA',
  reflector: 'B',
  positions: 'LBU',
  plugboard: ['AQ', 'BJ', 'CW', 'DS', 'EI', 'FL', 'GV', 'HO', 'KT', 'NZ'],
} as const satisfies MachineConfig;

export const BOMBE_PLAIN = prepareText('WETTERVORHERSAGE X BISKAYA X REGEN UND NEBEL X SICHT ZWEI SEEMEILEN');
export const BOMBE_CRIB = 'WETTERVORHERSAGE';
export const BOMBE_CIPHER = encipherWith(BOMBE_KEY, BOMBE_PLAIN);
