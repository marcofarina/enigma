/**
 * Le pagine che i test controllano. Le legge `tests/e2e/smoke.spec.ts` (axe) e
 * `scripts/lighthouse.ts` (budget di prestazioni e accessibilità).
 * I percorsi sono relativi a `base` (`/enigma/`).
 */

/** Le pagine principali: la home, il simulatore, una lezione per sezione, gli esercizi, le schede, il glossario, i docenti, la macchina in 3D (stato iniziale, prima del pulsante). */
export const pagineLighthouse = [
  '',
  'simulatore/',
  'come-funziona/modelli-a-confronto/',
  'storia/enigma-e-l-italia/',
  'crittoanalisi/la-bomba-e-i-fogli-di-zygalski/',
  'esercizi/',
  'esercizi/decifra/',
  'schede/',
  'glossario/',
  'docenti/',
  'macchina/',
];

/** Tutte le pagine controllate da axe: quelle di Lighthouse più gli indici e le pagine di servizio. */
export const pagineAxe = [
  ...pagineLighthouse,
  'come-funziona/',
  'come-funziona/che-cos-e-enigma/',
  'storia/',
  'storia/galleria/',
  'crittoanalisi/',
  'fonti/',
];
