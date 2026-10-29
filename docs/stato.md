# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- `main`: README, licenze, piano.
- PR marcofarina/enigma#1 (`claude/fase-0-setup`): struttura Astro 7 + React + TypeScript + Tailwind 4 + MDX, design token, collezioni (lezioni, fonti, immagini), `lint:content`, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages (attivato).
- PR marcofarina/enigma#2 (`claude/fase-1-motore`, impilata sulla #1): motore in `src/engine/` con 15 modelli, API immutabile con traccia del segnale, validazione, Uhr, UKW-D, `prepareText` e codec dei link; 83 test; 2.250 vettori del motore originale in `fixtures/` (150.000 verificati in locale, tutti coincidenti).

## Prossimo passo: fase 1b

Simulatore schematico in `/simulatore/`:

- store (Zustand) sopra il motore, con annulla e ripeti;
- pannello di configurazione: modello, Walzenlage a selezione esclusiva, anelli, rotelle delle posizioni, editor di pannello a spine, Uhr e UKW-D;
- tastiera e lampade con disposizione QWERTZ originale; nastro di input e output con gruppi da cinque e copia;
- schema SVG del circuito alimentato da `pressKey(...).stages`;
- link condivisibili (`encodeConfig` / `decodeConfig`);
- tastiera fisica con `KeyboardEvent.key`, ignorando modificatori e ripetizione; Backspace = annulla.

Poi le lezioni “Come funziona” 2–6. Branch `claude/fase-1b-simulatore`, PR verso `claude/fase-1-motore` (o verso `main` se le precedenti sono già unite).

## Note operative

- **Node**: Astro 7 richiede Node ≥ 22.23.4. Nel container c’è Node 24 in `/opt/node24/bin` (`export PATH=/opt/node24/bin:$PATH`); pnpm 10 è quello di sistema. In un container nuovo va riscaricato da nodejs.org (`node-v24.x-linux-x64.tar.xz`).
- **Preview**: `astro preview` in Astro 7 usa un file di lock e può restare attivo in background. Usare `astro preview --ignore-lock` (già nel `playwright.config.ts`) e `pnpm exec astro preview stop` per fermarlo.
- **Playwright**: nel container c’è la 1.63.0 con i browser in `/opt/pw-browsers`; tenere `@playwright/test@1.63.0` finché l’ambiente non cambia.
- **Rete**: `creativecommons.org` e `cryptomuseum.com` sono bloccati. Per ricerca e immagini servono negli Allowed domains dell’ambiente almeno `cryptomuseum.com`, `cryptocellar.org`, `codesandciphers.org.uk`, `commons.wikimedia.org`, `upload.wikimedia.org`.
- **Simulatore originale**: clonato in `/home/user/EnigmaMachine`. I vettori di confronto si rigenerano con `node scripts/legacy/generate-vectors.cjs /home/user/EnigmaMachine/enigma.js <numero per modello> <file di uscita>`.

## Da verificare

- `period` e `users` dei modelli in `src/engine/models.ts`, prima di mostrarli nelle schede storiche.
- Notazione dell’UKW-D (Bletchley J–Y o tedesca B–O) e vettori dell’Uhr contro una fonte indipendente.
- Dettagli tecnici dell’Enigma K usata dalla Regia Marina.
- Numeri di pagina delle citazioni da *Codici & segreti* di Singh (sulla copia dell’autore).
