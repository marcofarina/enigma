# Convenzioni del progetto

Sito Astro + React + TypeScript (Tailwind, MDX), pubblicato su GitHub Pages sotto `/enigma/`. Il piano completo è in `docs/piano.md`.

## Comandi

- `pnpm dev` — server di sviluppo
- `pnpm verify` — lint, formattazione, regole tipografiche, tipi, unit test e build (da far passare prima di ogni push)
- `pnpm test:e2e` — test Playwright con axe (richiede `pnpm build`)

Node ≥ 22.23.4 (vedi `.nvmrc`), pnpm 10.

## Regole

- `src/engine/` è TypeScript puro: nessuna dipendenza, nessun accesso a DOM, React o Astro (lo impone ESLint).
- I link interni passano da `url()` in `src/lib/url.ts`, per rispettare `base`.
- I colori e i font si usano solo tramite i design token di `src/styles/tokens.css`.
- I testi in `src/content/` seguono le regole tipografiche italiane controllate da `pnpm lint:content`: virgolette “curve”, apostrofo ’, trattino lungo — per gli incisi, titoli con maiuscola solo iniziale, acronimi senza punti, numeri fino a dieci in lettere.
- Le lezioni nuove nascono con `stato: bozza`; solo l’autore le porta a `rivista`.
- Ogni immagine di terzi ha una voce in `src/content/immagini.yaml`; sono ammesse solo licenze PD, CC0, CC BY e CC BY-SA.
- Ogni fatto storico nei testi rimanda a una voce di `src/content/fonti.yaml`.
