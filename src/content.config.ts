import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { encipherWith, validateConfig, type MachineConfig } from './engine/index.ts';

/** Lezioni e capitoli divulgativi, scritti in MDX. */
const lezioni = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lezioni' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sezione: z.enum(['come-funziona', 'storia', 'crittoanalisi', 'docenti']),
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
    tedesco: z.string().default('—'),
    inglese: z.string().default('—'),
    definizione: z.string(),
    /** Pagina del sito da cui approfondire, senza `base` (per esempio `come-funziona/i-rotori/`). */
    vedi: z
      .string()
      .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*\/$/)
      .optional(),
    fonti: z.array(reference('fonti')).default([]),
  }),
});

/**
 * Missioni storiche: messaggi reali da decifrare con la chiave originale. La build fallisce se la
 * chiave non è valida o se il motore non riporta il testo cifrato al testo in chiaro.
 */
const missioni = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/missioni' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      ordine: z.number().int().nonnegative(),
      stato: z.enum(['bozza', 'rivista']).default('bozza'),
      /** Data del messaggio, in forma leggibile (per esempio “7 luglio 1941”). */
      data: z.string(),
      /** Chi trasmise il messaggio. */
      mittente: z.string(),
      /** Chiave del giorno, senza la posizione dei rotori. */
      chiave: z.object({
        model: z.enum(['I', 'M3', 'M4']),
        rotors: z.array(z.string()),
        rings: z.string(),
        reflector: z.string(),
        plugboard: z.array(z.string()),
      }),
      /** Indicatore in due gruppi di tre lettere (procedura dell’esercito dal 1940), se noto. */
      indicatore: z.object({ posizione: z.string(), cifrato: z.string() }).optional(),
      /** Chiave del messaggio: la posizione dei rotori da cui si decifra il testo. */
      chiaveMessaggio: z.string(),
      cifrato: z.string().regex(/^[A-Z]+$/),
      chiaro: z.string().regex(/^[A-Z]+$/),
      /** Il testo in chiaro con spazi e punteggiatura, in tedesco. */
      tedesco: z.string(),
      /** Traduzione italiana, controllata da `lint:content`. */
      traduzione: z.string(),
      fonti: z.array(reference('fonti')).default([]),
    })
    .superRefine((missione, ctx) => {
      const config: MachineConfig = { ...missione.chiave, positions: missione.chiaveMessaggio };
      const issues = validateConfig(config);
      if (issues.length > 0) {
        ctx.addIssue({ code: 'custom', path: ['chiave'], message: issues.map((i) => i.message).join(' ') });
        return;
      }
      if (encipherWith(config, missione.cifrato) !== missione.chiaro) {
        ctx.addIssue({
          code: 'custom',
          path: ['chiaro'],
          message: 'Il testo cifrato non si decifra nel testo in chiaro.',
        });
      }
      const { indicatore } = missione;
      if (
        indicatore &&
        encipherWith({ ...config, positions: indicatore.posizione }, indicatore.cifrato) !== missione.chiaveMessaggio
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['indicatore'],
          message: 'L’indicatore non si decifra nella chiave del messaggio.',
        });
      }
    }),
});

export const collections = { lezioni, fonti, immagini, glossario, missioni };
