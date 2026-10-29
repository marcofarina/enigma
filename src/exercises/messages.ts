import { pick, type Rng } from './random.ts';

/**
 * Messaggi brevi in stile militare, in italiano, per cifrare e decifrare. Soggetti tutti
 * maschili, così i predicati concordano. Sulla macchina si digitano senza spazi né apostrofi.
 */
const SUBJECTS = ['CONVOGLIO', 'SOTTOMARINO', 'REPARTO', 'BATTAGLIONE', 'RICOGNITORE', 'CACCIATORPEDINIERE'];
const PREDICATES = ['IN ARRIVO', 'IN RITARDO', 'AVVISTATO', 'FERMO', 'IN MOVIMENTO', 'RIENTRATO'];
const PLACES = ['A NORD', 'A SUD', 'A EST', 'A OVEST', 'AL PORTO', 'SULLA COSTA', 'OLTRE IL FIUME'];
const TIMES = ['ALLE SEI', 'ALLE DIECI', 'ALL ALBA', 'A MEZZANOTTE', 'DOMANI', 'STASERA'];

export type MessageLength = 'short' | 'long';

/** Testo leggibile, con gli spazi; per la macchina va passato a `prepareText`. */
export function randomMessage(rng: Rng, length: MessageLength): string {
  const words = [pick(rng, SUBJECTS), pick(rng, PREDICATES), pick(rng, PLACES)];
  if (length === 'long') words.push(pick(rng, TIMES));
  return words.join(' ');
}
