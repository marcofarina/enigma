import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { decodeConfig } from '../engine/codec.ts';
import { AZIONI, INQUADRATURE, nodiDi, STADI, testoDellaVoce, type Copione, type Durate } from './lezione-3d.ts';

/*
 * La lettura del copione della lezione animata (fase 5d), con lo schema. Solo lato server e negli
 * script: la pagina lo legge alla build e passa il risultato all’isola.
 */

const nodo = z.string().regex(/^[a-z_]+$/);

const passo = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    testo: z.string().min(1),
    voce: z.string().min(1).optional(),
    camera: z.enum(INQUADRATURE),
    fantasma: z.array(nodo).default([]).transform(nodiDi),
    evidenzia: z.array(nodo).default([]).transform(nodiDi),
    azione: z.enum(AZIONI).optional(),
    fino: z.enum(STADI).optional(),
    rallenta: z.boolean().default(false),
  })
  .strict()
  .refine((p) => (p.azione === 'segnale') === (p.fino !== undefined), {
    message: '`fino` va con `azione: segnale`, e solo con quella.',
  });

const copione = z
  .object({
    configurazione: z.string(),
    lettera: z.string().regex(/^[A-Z]$/),
    passi: z.array(passo).min(2),
  })
  .strict()
  .superRefine((c, ctx) => {
    const errore = (message: string) => ctx.addIssue({ code: 'custom', message });
    const config = decodeConfig(c.configurazione);
    if (!config.ok) errore(`La configurazione non è valida: ${config.issues.map((i) => i.message).join(' ')}`);
    else if (config.config.model !== 'I') errore('La vista 3D mostra solo l’Enigma I.');

    const ids = c.passi.map((p) => p.id);
    const doppio = ids.find((id, i) => ids.indexOf(id) !== i);
    if (doppio) errore(`Il passo ${doppio} compare due volte.`);

    // Le azioni nell’ordine in cui le fa la macchina, una volta sola ciascuna (il segnale anche in più passi).
    const azioni = c.passi.flatMap((p) => (p.azione ? [p.azione] : []));
    const attese = ['premi', 'passo', 'segnale', 'lampada', 'prova'];
    const compatte = azioni.filter((a, i) => a !== azioni[i - 1]);
    if (compatte.join() !== attese.join() || azioni.filter((a) => a !== 'segnale').length !== 4) {
      errore(`Le azioni devono essere ${attese.join(', ')}, in quest’ordine; il copione ha ${azioni.join(', ')}.`);
    }
    if (c.passi.at(-1)?.azione !== 'prova') errore('L’ultimo passo è «ora prova tu», con `azione: prova`.');

    const fini = c.passi.flatMap((p) => (p.fino ? [STADI.indexOf(p.fino)] : []));
    if (fini.some((f, i) => i > 0 && f <= fini[i - 1]!)) errore('Gli stadi di `fino` devono andare avanti.');
    if (fini.at(-1) !== STADI.length - 1) errore(`L’ultimo segnale arriva fino a ${STADI.at(-1)}.`);
  });

/** Legge e controlla il copione; un errore ferma la build. */
export function leggiCopione(sorgente: string): Copione {
  const risultato = copione.safeParse(parse(sorgente));
  if (!risultato.success) {
    throw new Error(`Copione della lezione 3D non valido:\n${z.prettifyError(risultato.error)}`);
  }
  return risultato.data;
}

/** L’impronta del testo della voce di un passo: `scripts/voce.ts` rifà l’audio solo se cambia. */
export function impronta(testo: string): string {
  return createHash('sha256').update(testo).digest('hex').slice(0, 16);
}

/**
 * Il copione e le durate dell’audio, come li usa la pagina alla build. Se un passo non ha l’audio, o
 * l’audio è di un testo che nel copione è cambiato, la build si ferma: va rilanciato `scripts/voce.ts`.
 */
export function lezioneDellaPagina(radice = process.cwd()): { copione: Copione; durate: Durate } {
  const copione = leggiCopione(readFileSync(join(radice, 'src', 'content', 'lezione-3d', 'it.yaml'), 'utf8'));
  const durate = JSON.parse(readFileSync(join(radice, 'public', 'lezione-3d', 'it', 'durate.json'), 'utf8')) as Durate;
  const vecchi = copione.passi.filter((p) => durate[p.id]?.hash !== impronta(testoDellaVoce(p))).map((p) => p.id);
  if (vecchi.length > 0) {
    throw new Error(
      `L’audio della lezione 3D non corrisponde al copione (${vecchi.join(', ')}): rilancia node scripts/voce.ts.`,
    );
  }
  return { copione, durate };
}
