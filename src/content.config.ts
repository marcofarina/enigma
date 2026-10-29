import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
  'CC-BY-SA-3.0',
  'CC-BY-SA-3.0-DE',
  'CC-BY-SA-4.0',
  'propria',
]);

/** Crediti delle immagini: un’immagine usata senza una voce qui fa fallire la build. */
const immagini = defineCollection({
  loader: file('./src/content/immagini.yaml'),
  schema: z.object({
    file: z.string(),
    titolo: z.string(),
    autore: z.string(),
    fonte: z.url(),
    licenza: licenzeAmmesse,
    urlLicenza: z.url().optional(),
    attribuzione: z.string(),
    data: z.string().optional(),
  }),
});

export const collections = { lezioni, fonti, immagini };
