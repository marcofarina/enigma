import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { impronta, leggiCopione } from '../src/lib/copione-3d.ts';
import { senzaTag, testoDellaVoce, type Durate } from '../src/lib/lezione-3d.ts';

/*
 * L’audio della lezione animata (fase 5d di docs/piano/fase-5d.md): un file per passo del copione,
 * `public/lezione-3d/it/<id>.m4a`, e `durate.json` con la durata di ciascuno e l’impronta del testo.
 * Rifà solo i passi il cui testo è cambiato (o il cui file manca) e toglie i file dei passi che non ci
 * sono più.
 *
 * La voce legge il campo `voce` del passo, se c’è, altrimenti `testo`; l’impronta è fatta su quello.
 *
 * In questa fase la voce è il segnaposto di macOS, `say -v Alice` (D17), che non conosce i tag audio di
 * ElevenLabs: li toglie prima di leggere. `say` scrive un AIFF,
 * `afconvert` lo porta in AAC dentro un M4A, `afinfo` ne legge la durata. La voce definitiva la sceglie
 * la 5e; se è la voce di Marco, registrata frase per frase, questo script cambia solo nella funzione
 * `registra`.
 *
 * Uso: node scripts/voce.ts
 */

const VOCE = 'Alice';

const radice = join(import.meta.dirname, '..');
const copione = leggiCopione(readFileSync(join(radice, 'src', 'content', 'lezione-3d', 'it.yaml'), 'utf8'));
const cartella = join(radice, 'public', 'lezione-3d', 'it');
const fileDurate = join(cartella, 'durate.json');
mkdirSync(cartella, { recursive: true });

const prima: Durate = existsSync(fileDurate) ? (JSON.parse(readFileSync(fileDurate, 'utf8')) as Durate) : {};

/** Fa l’audio di un passo e ne restituisce la durata in secondi. */
function registra(id: string, testo: string): number {
  const aiff = join(cartella, `${id}.aiff`);
  const m4a = join(cartella, `${id}.m4a`);
  execFileSync('say', ['-v', VOCE, '-o', aiff, senzaTag(testo)]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', aiff, m4a]);
  rmSync(aiff);
  return durataDi(m4a);
}

/** La durata di un file audio secondo `afinfo` («estimated duration: 4.123456 sec»). */
function durataDi(file: string): number {
  const uscita = execFileSync('afinfo', [file], { encoding: 'utf8' });
  const trovata = /estimated duration: ([\d.]+) sec/.exec(uscita);
  if (!trovata?.[1]) throw new Error(`afinfo non dà la durata di ${file}.`);
  return Math.round(Number(trovata[1]) * 1000) / 1000;
}

const dopo: Durate = {};
let rifatti = 0;
for (const passo of copione.passi) {
  const { id } = passo;
  const testo = testoDellaVoce(passo);
  const hash = impronta(testo);
  const vecchio = prima[id];
  if (vecchio && vecchio.hash === hash && existsSync(join(cartella, `${id}.m4a`))) {
    dopo[id] = vecchio;
    continue;
  }
  dopo[id] = { durata: registra(id, testo), hash };
  rifatti++;
  console.log(`${id}: ${dopo[id].durata} s`);
}

// I file dei passi tolti dal copione.
for (const id of Object.keys(prima)) {
  if (!(id in dopo)) rmSync(join(cartella, `${id}.m4a`), { force: true });
}

writeFileSync(fileDurate, `${JSON.stringify(dopo, null, 2)}\n`);
const totale = Object.values(dopo).reduce((somma, d) => somma + d.durata, 0);
console.log(`${rifatti} audio rifatti su ${copione.passi.length}; la lezione dura ${totale.toFixed(1)} s.`);
