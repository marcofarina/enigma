# Stato del progetto e note per ripartire

Da leggere insieme a `CLAUDE.md` e `docs/piano.md` all’inizio di ogni sessione di lavoro.

## Fatto

- `main`: fasi 0, 1a, 1b e 1c unite (PR marcofarina/enigma#1–#4, fusione con merge commit).
  - Fase 0: struttura Astro 7 + React + TypeScript + Tailwind 4 + MDX, design token, collezioni (lezioni, fonti, immagini), `lint:content`, ESLint, Prettier, Vitest, Playwright + axe, CI e deploy su GitHub Pages.
  - Fase 1a: motore in `src/engine/` con 15 modelli, API immutabile con traccia del segnale, validazione, Uhr, UKW-D, `prepareText` e codec dei link; 2.250 vettori del motore originale in `fixtures/` (150.000 verificati in locale, tutti coincidenti).
  - Fase 1b: simulatore schematico in `/simulatore/` (sessione pura in `session.ts`, store Zustand, pannello di configurazione completo, finestrelle, lampade e tastiera QWERTZ, nastro, link condivisibili, schema SVG in `src/components/views/schematic/`).
  - Fase 1c: lezioni “Come funziona” 2–6 in bozza, con i componenti `Nota`, `Approfondimento`, `MiniSimulatore`, `DiscoCifrante`, `CircuitoTasto`, `RotoreSingolo`, `AnimazionePasso`. Periodo del doppio passo: il motore dà 16 900 (26 × 25 × 26), Crypto Museum 16 926; la lezione 5 spiega la differenza.

- Lezione 7 “Il pannello a spine e l’Uhr” in bozza (PR marcofarina/enigma#5, unita), che completa le lezioni 1–7 della v0.1.
  - Componenti `PannelloASpine` (riusa `PairEditor`, conta le configurazioni) e `UhrSelettore` (40 posizioni, segnala quando la sostituzione non è reciproca).
  - `plugboardSettings(n)` in `src/engine/keyspace.ts` (in `bigint`), con test sui valori della tabella di Crypto Museum; servirà anche al calcolatore della fase 2.
  - Token `--color-plug-red` per le spine rosse dell’Uhr.
  - Correzione: le spine “b” dell’Uhr sono nere, non bianche (stringa del simulatore e commenti del motore).
  - `lint:content` non segnala più le date in cifre (“il 10 luglio 1944”).
  - Fatti verificati su Crypto Museum (pagine “Enigma Uhr”, “Enigma I”, “Enigma Steckerbrett”, “History”).

- Fase 2a (PR marcofarina/enigma#6, unita): traccia passo-passo nel simulatore.
  - `stageMap()` nel motore: sostituzione completa del componente di uno stadio, con test di proprietà; lo schema la usa al posto del suo calcolo interno.
  - `layoutSchematic(..., progress)` disegna il percorso solo fino al passo scelto; la lampada si accende quando il segnale la raggiunge.
  - `trace.ts` (puro, testato) costruisce i passi e le frasi; `TracePanel` con Inizio, Indietro, Avvia/Ferma, Avanti, Fine, tre velocità e la permutazione del componente in chiaro. Il passo scelto sta nello store (`trace`) e torna a `null` a ogni cambiamento della sessione.
  - `MiniSimulatore` accetta `traccia`; usata nella lezione 3.
  - Corretto “1 lettere” nel nastro.

- Fase 2b (PR marcofarina/enigma#7, unita): modalità LIM e codici QR.
  - Pulsante “Modalità LIM” nel simulatore: schermo intero con l’API Fullscreen (altrimenti un livello che copre la pagina), configurazione e “Digita un testo” nascosti, macchina ingrandita con `zoom`, macchina e nastro affiancati sugli schermi larghi, schema limitato in larghezza. Si esce con il pulsante, con Esc o uscendo dallo schermo intero.
  - Variante Tailwind `lim:` (attributo `data-lim`) e token di alto contrasto per la LIM in `tokens.css`.
  - Codice QR del link condivisibile (`src/components/ui/QrCode.tsx`, `qr.ts` testato), con la libreria `uqr` (MIT, senza dipendenze); colori fissi scuro su chiaro (`--color-qr-dark`, `--color-qr-light`). Verificato decodificandolo con OpenCV.

- Fase 2c, branch `claude/zen-pasteur-4nev9o`: lezione 8 “La matematica di Enigma” in bozza e calcolatore dello spazio delle chiavi.
  - Lezione: permutazioni e cicli, composizione e inversa, coniugio (il rotore che gira), involuzioni, E = P⁻¹ R⁻¹ U R P con le dimostrazioni di reciprocità e assenza di punti fissi, conteggio delle impostazioni, differenza tra spazio delle chiavi e sicurezza.
  - Componenti `CicliRotore` (struttura in cicli che non cambia con la posizione), `CalcolatoreChiavi` (Enigma I e M4 come punti di partenza, ogni fattore modificabile, totale, notazione scientifica e bit) e `Formula` (KaTeX in fase di build, HTML più MathML; la punteggiatura che segue va in `dopo`).
  - Motore: `keySpace()`, `log2()`, `cycles()`, `cycleType()`, con test; `src/lib/format.ts` con `groupDigits` e `scientific`.
  - KaTeX senza remark-math: Astro 7 usa il processore satteri, che ignora i plugin remark/rehype; cambiare processore avrebbe toccato tutte le lezioni.

## Prossimo passo

- Revisione delle bozze 1–7 da parte dell’autore.
- Fase 2, ultimo rilascio: esercizi di livello 1–2 con progressi (2d).
- Rinviati dalla 1b: cavi trascinabili sul pannello, schema in verticale su mobile, notazione tedesca dell’UKW-D (da verificare prima di mostrarla).

## Note operative

- **Node**: Astro 7 richiede Node ≥ 22.23.4. Nel container c’è Node 24 in `/opt/node24/bin` (`export PATH=/opt/node24/bin:$PATH`); pnpm 10 è quello di sistema. In un container nuovo va riscaricato da nodejs.org (`node-v24.x-linux-x64.tar.xz`).
- **Preview**: `astro preview` in Astro 7 usa un file di lock e può restare attivo in background. Usare `astro preview --ignore-lock` (già nel `playwright.config.ts`) e `pnpm exec astro preview stop` per fermarlo.
- **Playwright**: nel container c’è la 1.63.0 con i browser in `/opt/pw-browsers`; tenere `@playwright/test@1.63.0` finché l’ambiente non cambia.
- **Rete**: `cryptomuseum.com` è raggiungibile con `curl` dal container, ma non con WebFetch; le pagine si scaricano e si convertono in testo nella cartella temporanea. Per immagini e altre fonti servono negli Allowed domains dell’ambiente `cryptocellar.org`, `codesandciphers.org.uk`, `commons.wikimedia.org`, `upload.wikimedia.org`.
- **Simulatore originale**: clonato in `/home/user/EnigmaMachine`. I vettori di confronto si rigenerano con `node scripts/legacy/generate-vectors.cjs /home/user/EnigmaMachine/enigma.js <numero per modello> <file di uscita>`.

## Da verificare

- Lezione 1: adozione da parte della marina (1926) e dell’esercito (1928). Crypto Museum data l’entrata in servizio dell’Enigma I al 1° giugno 1930; anche `period` dell’Enigma I in `models.ts` (1932) va riallineato.
- Lezione 2: data del trattato di Alberti (intorno al 1467) e attribuzione ad al-Kindi, da controllare su Singh.
- Volume di Cryptologia dell’articolo di Hamer (21 secondo la numerazione della rivista).

- `period` e `users` dei modelli in `src/engine/models.ts`, prima di mostrarli nelle schede storiche.
- Notazione dell’UKW-D (Bletchley J–Y o tedesca B–O). Uhr: l’esempio di Crypto Museum (posizione 03, spina 1a verso 5b e 5b verso 4a) coincide con il motore; manca un confronto su un messaggio reale.
- Numero di cavi nel tempo: Crypto Museum indica sei cavi all’inizio e dieci “dal 1° ottobre 1936”, mentre altre ricostruzioni danno per quella data da cinque a otto cavi. La lezione 7 evita la data; da controllare su Rejewski o Kozaczuk.
- Dettagli tecnici dell’Enigma K usata dalla Regia Marina.
- Numeri di pagina delle citazioni da *Codici & segreti* di Singh (sulla copia dell’autore).
- Crypto Museum, pagina “How does an Enigma machine work?”: i totali con la correzione del doppio passo sono sbagliati. Per l’Enigma I scrive 685 518 560 invece di 60 × 676 × 16 926 = 686 518 560; per la M4 toglie 650 posizioni una volta sola invece che per ciascuna delle 26 posizioni del rotore sottile (440 076 posizioni distinte, verificato con il motore). Con i rotori navali a due tacche nel mezzo la riduzione è diversa. La lezione 8 usa i valori ricalcolati.
