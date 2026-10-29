# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- `main`: README, licenze, piano.
- PR marcofarina/enigma#1 (`claude/fase-0-setup`): struttura Astro 7 + React + TypeScript + Tailwind 4 + MDX, design token, collezioni (lezioni, fonti, immagini), `lint:content`, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages (attivato).
- PR marcofarina/enigma#2 (`claude/fase-1-motore`, impilata sulla #1): motore in `src/engine/` con 15 modelli, API immutabile con traccia del segnale, validazione, Uhr, UKW-D, `prepareText` e codec dei link; 83 test; 2.250 vettori del motore originale in `fixtures/` (150.000 verificati in locale, tutti coincidenti).

- Branch `claude/fase-1b-simulatore` (impilato sulla #2): simulatore schematico in `/simulatore/`.
  - `src/components/simulator/`: sessione pura (`session.ts`, unica fonte di verità, annulla e ripeti sulle pressioni), store Zustand, modifiche alla configurazione (`config-edit.ts`), filtro della tastiera fisica (`keys.ts`), link condivisibili con messaggio facoltativo (`share.ts`, parametro `t`).
  - Pannello: modello, riflettore (sulla M4 l’UKW-D toglie il rotore sottile), Walzenlage con scambio, anelli, pannello a spine (coppie digitate o due clic sulle prese), Uhr, UKW-D. Finestrelle girevoli con frecce, rotella o lettera; lampade e tastiera QWERTZ; nastro con gruppi da cinque e copia; “Digita un testo” con `prepareText`.
  - Schema SVG in `src/components/views/schematic/` (`layout.ts` puro e testato): colonne di contatti che scorrono, andata continua e ritorno tratteggiato, tutti i collegamenti a richiesta, descrizione testuale del percorso.
  - L’indirizzo della pagina segue la configurazione; un link non valido carica la configurazione di base e lo segnala.
  - `defaultConfig` nel motore; `tf()` per le stringhe con segnaposto; token `--color-lamp-on-text`.
  - Test: 21 unit test nuovi; e2e in `tests/e2e/simulator.spec.ts` (tastiera fisica con Maiuscolo e Backspace, link, Uhr, M4/UKW-D, axe in tema chiaro e scuro).

## Prossimo passo

- Lezioni “Come funziona” 2–6 con animazioni base e `<MiniSimulatore>` (riusa `createSession` e i componenti del simulatore).
- Poi la fase 2 (traccia passo-passo, modalità LIM, QR, matematica ed esercizi).
- Rinviati dalla 1b: cavi trascinabili sul pannello, schema in verticale su mobile (ora scorre in orizzontale), notazione tedesca dell’UKW-D (da verificare prima di mostrarla).

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
