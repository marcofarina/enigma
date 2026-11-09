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
 * La voce della lezione (D17) è «Adriatico» di ElevenLabs. Il piano gratuito non la dà via API, quindi i
 * file li genera Marco dal sito, uno per passo, con il nome `<id>.mp3` e il testo della voce del passo;
 * con `--da <cartella>` lo script li prende da lì, e nella cartella devono esserci tutti; se ne manca
 * uno si ferma e dice quale.
 *
 * Senza `--da` la voce è il segnaposto di macOS, `say -v Alice`, che non conosce i tag audio di
 * ElevenLabs: li toglie prima di leggere. `say` scrive un AIFF.
 *
 * In tutti e due i casi `afconvert` porta l’audio in AAC mono dentro un M4A e `afinfo` ne legge la durata.
 *
 * Uso: node scripts/voce.ts [--da <cartella>]
 */

const VOCE = 'Alice';
/** Il bitrate dell’AAC per i file importati: una voce sola, mono, sta bene a 48 kbit/s. */
const BITRATE = '48000';

const argomenti = process.argv.slice(2);
const indiceDa = argomenti.indexOf('--da');
const da = indiceDa >= 0 ? argomenti[indiceDa + 1] : undefined;
if (indiceDa >= 0 && !da) throw new Error('--da vuole una cartella.');

const radice = join(import.meta.dirname, '..');
const copione = leggiCopione(readFileSync(join(radice, 'src', 'content', 'lezione-3d', 'it.yaml'), 'utf8'));
const cartella = join(radice, 'public', 'lezione-3d', 'it');
const fileDurate = join(cartella, 'durate.json');
mkdirSync(cartella, { recursive: true });

const prima: Durate = existsSync(fileDurate) ? (JSON.parse(readFileSync(fileDurate, 'utf8')) as Durate) : {};

/** Il file generato su ElevenLabs per un passo, se nella cartella di `--da` c’è. */
const importato = (id: string): string | undefined => {
  if (!da) return undefined;
  const file = join(da, `${id}.mp3`);
  return existsSync(file) ? file : undefined;
};

/** Fa l’audio di un passo, dal file importato o con `say`, e ne restituisce la durata in secondi. */
function registra(id: string, testo: string): number {
  const m4a = join(cartella, `${id}.m4a`);
  const sorgente = importato(id);
  if (sorgente) {
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-c', '1', '-b', BITRATE, sorgente, m4a]);
    return durataDi(m4a);
  }
  const aiff = join(cartella, `${id}.aiff`);
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

// Con --da la cartella deve avere tutti i passi: un passo tenuto com’era potrebbe avere ancora la voce di
// `say`, e la lezione cambierebbe voce a metà. Dal file non si capisce quale voce l’ha fatto.
if (da) {
  const mancano = copione.passi.filter((passo) => !importato(passo.id)).map((passo) => `${passo.id}.mp3`);
  if (mancano.length > 0) throw new Error(`In ${da} mancano: ${mancano.join(', ')}.`);
}

const dopo: Durate = {};
let rifatti = 0;
for (const passo of copione.passi) {
  const { id } = passo;
  const testo = testoDellaVoce(passo);
  const hash = impronta(testo);
  const vecchio = prima[id];
  if (!da && vecchio && vecchio.hash === hash && existsSync(join(cartella, `${id}.m4a`))) {
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
