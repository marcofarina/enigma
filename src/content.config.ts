import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { encipherWith, MODELS, validateConfig, type ModelId } from './engine/index.ts';
import { missionConfig } from './lib/missioni.ts';

/** Lezioni e capitoli divulgativi, scritti in MDX. */
const lezioni = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lezioni' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sezione: z.enum(['come-funziona', 'storia', 'crittoanalisi']),
    ordine: z.number().int().nonnegative(),
    livello: z.enum(['base', 'avanzato']).default('base'),
    /** Le bozze mostrano un avviso finché l’autore non le approva. */
    stato: z.enum(['bozza', 'rivista']).default('bozza'),
    fonti: z.array(reference('fonti')).default([]),
  }),
});

/** Bibliografia: ogni citazione nei testi rimanda a una voce di questa collezione. */
const fonti = defineCollection({
  loader: file('./src/content/fonti.yaml'),
  schema: z.object({
    autori: z.string(),
    titolo: z.string(),
    editore: z.string().optional(),
    anno: z.number().int().optional(),
    url: z.url().optional(),
    note: z.string().optional(),
  }),
});

/** Licenze ammesse per le immagini di terzi (vedi docs/piano.md). */
const licenzeAmmesse = z.enum([
  'PD',
  'CC0-1.0',
  'CC-BY-2.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC-BY-SA-2.0',
  'CC-BY-SA-2.5',
  'CC-BY-SA-3.0',
  'CC-BY-SA-3.0-DE',
  'CC-BY-SA-4.0',
  'propria',
]);

/** Crediti delle immagini: un’immagine usata senza una voce qui fa fallire la build. */
const immagini = defineCollection({
  loader: file('./src/content/immagini.yaml'),
  schema: z.object({
    /** Nome del file in `src/assets/immagini/`. */
    file: z.string().regex(/^[a-z0-9-]+\.(jpg|png|webp)$/),
    titolo: z.string(),
    /** Testo alternativo: che cosa si vede, per chi non vede l’immagine. */
    alt: z.string(),
    /** Didascalia in italiano, controllata da `lint:content`. */
    didascalia: z.string(),
    categoria: z.enum(['macchine', 'componenti', 'documenti', 'persone', 'luoghi']),
    autore: z.string(),
    fonte: z.url(),
    licenza: licenzeAmmesse,
    urlLicenza: z.url().optional(),
    attribuzione: z.string(),
    data: z.string().optional(),
  }),
});

/** Glossario tedesco–italiano–inglese. */
const glossario = defineCollection({
  loader: file('./src/content/glossario.yaml'),
  schema: z.object({
    termine: z.string(),
    tedesco: z.string().optional(),
    inglese: z.string().optional(),
    definizione: z.string(),
    /** Pagina del sito da cui approfondire, senza `base` (per esempio `come-funziona/i-rotori/`). */
    vedi: z
      .string()
      .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*\/$/)
      .optional(),
    fonti: z.array(reference('fonti')).default([]),
  }),
});

/** Solo lettere maiuscole: gli spazi fra i gruppi del modulo si tolgono. */
const lettere = z
  .string()
  .transform((text) => text.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^[A-Z]+$/));

/**
 * Messaggi storici del menu «Carica una chiave» della home (fase 4f di docs/piano/archivio.md). La build
 * decifra ogni parte con il motore: una lettera sbagliata nei dati la ferma.
 */
const missioni = defineCollection({
  loader: file('./src/content/missioni.yaml'),
  schema: z
    .object({
      titolo: z.string(),
      /** Giorno della trasmissione: ordina il menu. */
      data: z.coerce.date(),
      modello: z.enum(Object.keys(MODELS) as [ModelId, ...ModelId[]]),
      riflettore: z.string(),
      rotori: z.array(z.string()).min(3),
      anelli: z.string().regex(/^[A-Z]+$/),
      spine: z.string().regex(/^([A-Z]{2})( [A-Z]{2})*$/),
      parti: z
        .array(
          z.object({
            indicatore: z
              .string()
              .regex(/^[A-Z]{3} [A-Z]{3}$/)
              .optional(),
            posizioni: z.string().regex(/^[A-Z]+$/),
            /** Nei gruppi del modulo: così finisce nel campo «Digita». */
            cifrato: z.string().regex(/^[A-Z]+( [A-Z]+)*$/),
            chiaro: lettere,
          }),
        )
        .min(1),
      /** Prosa controllata da `lint:content`: chi, quando, come se ne è ritrovata la chiave. */
      contesto: z.string(),
      /** Che cosa notare battendo il messaggio. */
      procedura: z.string(),
      /** Traduzione nostra del testo in chiaro. */
      traduzione: z.string(),
      fonti: z.array(reference('fonti')).min(1),
      /** Lezione da cui approfondire, senza `base` (per esempio `storia/fogli-chiave-e-procedure/`). */
      lezione: z
        .string()
        .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*\/$/)
        .optional(),
    })
    .superRefine((missione, ctx) => {
      missione.parti.forEach((parte, index) => {
        const config = missionConfig(missione, parte);
        const issues = validateConfig(config);
        if (issues.length > 0) {
          ctx.addIssue({ code: 'custom', path: ['parti', index], message: issues.map((i) => i.message).join(' ') });
          return;
        }
        if (encipherWith(config, parte.cifrato.replaceAll(' ', '')) !== parte.chiaro)
          ctx.addIssue({
            code: 'custom',
            path: ['parti', index, 'chiaro'],
            message: 'Il motore non decifra il testo cifrato in questo testo in chiaro.',
          });
        if (parte.indicatore) {
          const [start, key] = parte.indicatore.split(' ') as [string, string];
          if (encipherWith({ ...config, positions: start }, key) !== parte.posizioni)
            ctx.addIssue({
              code: 'custom',
              path: ['parti', index, 'indicatore'],
              message: 'L’indicatore non dà la chiave del messaggio.',
            });
        }
      });
    }),
});

export const collections = { lezioni, fonti, immagini, glossario, missioni };
