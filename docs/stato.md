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

- Fase 2c (PR marcofarina/enigma#8, unita): lezione 8 “La matematica di Enigma” in bozza e calcolatore dello spazio delle chiavi.
  - Lezione: permutazioni e cicli, composizione e inversa, coniugio (il rotore che gira), involuzioni, E = P⁻¹ R⁻¹ U R P con le dimostrazioni di reciprocità e assenza di punti fissi, conteggio delle impostazioni, differenza tra spazio delle chiavi e sicurezza.
  - Componenti `CicliRotore` (struttura in cicli che non cambia con la posizione), `CalcolatoreChiavi` (Enigma I e M4 come punti di partenza, ogni fattore modificabile, totale, notazione scientifica e bit) e `Formula` (KaTeX in fase di build, HTML più MathML; la punteggiatura che segue va in `dopo`).
  - Motore: `keySpace()`, `log2()`, `cycles()`, `cycleType()`, con test; `src/lib/format.ts` con `groupDigits` e `scientific`.
  - KaTeX senza remark-math: Astro 7 usa il processore satteri, che ignora i plugin remark/rehype; cambiare processore avrebbe toccato tutte le lezioni.

- Fase 2d, branch `claude/zen-pasteur-4nev9o`: esercizi autocorretti di livello 1 e 2, con i progressi.
  - `src/exercises/` (TypeScript puro, testato): generatore con seme (mulberry32, semi da 1 a 999 999), messaggi in italiano, catalogo di sette esercizi (cifra, decifra, foglio chiave con anelli numerati, procedura dell’indicatore doppio; posizioni dopo N tasti, una lettera a mano dalle tabelle, crittogramma impossibile), progressi in `localStorage` protetti da `try/catch`.
  - Ogni variante è fatta di blocchi strutturati (testo, foglio chiave, messaggio, tabelle di cablaggio, confronto lettera per lettera): serviranno anche alle schede stampabili della fase 3.
  - Pagine `/esercizi/` (per livello, con le varianti risolte) e `/esercizi/<id>/?seme=…`; il seme sta nell’indirizzo, così un docente può assegnare la stessa variante a tutta la classe. Soluzione con link “Rivedi nel simulatore”.
  - Negli esercizi da operatore c’è il simulatore completo, che parte dalla configurazione di base; in quelli di meccanica no.

- Fase 3 (v0.3), branch `claude/zen-pasteur-4nev9o`.
  - 3a: quattro esercizi di livello 3 in `src/exercises/math.ts` (spazio delle chiavi con una regola sull’ordine dei rotori, collegamenti del pannello con k cavi anche su alfabeti ridotti, quale tabella può venire da un’Enigma, posizione iniziale da ritrovare con un crib). Tipi e chiavi casuali spostati in `types.ts` e `keys.ts`; `pairings()` nel motore; le risposte numeriche restano stringhe e accettano i separatori delle migliaia; `numberInWords()` per i numeri fino a dieci nei testi generati.
  - 3a: schede stampabili in `/schede/` (`src/exercises/sheets.ts`, `SheetGenerator.tsx`): foglio chiave mensile sul modello del Luftwaffen-Maschinenschlüssel Nr. 619 (giorni dal 31 all’1, anelli in numeri, dieci cavi, Kenngruppen), messaggi intercettati con l’indicatore descritto dal rapporto 6812 del 1944, esercizi del catalogo a scelta, serie per la classe con semi consecutivi (`?seme=…&copie=…`) e soluzioni su pagine separate. Stile di stampa in `print.css`, verificato producendo il PDF con Playwright.
  - 3b: glossario tedesco–italiano–inglese (`src/content/glossario.yaml`, pagina `/glossario/`). `lint:content` controlla anche i campi di prosa dei file YAML (`definizione`, `didascalia`, `descrizione`).
  - 3c: lezioni di storia 1–4 in bozza (Scherbius e le macchine commerciali, l’adozione militare, fogli chiave e procedure, Enigma e l’Italia), con `LessonPage.astro` comune alle sezioni. Fonti: pagine di Crypto Museum (storia, Enigma K, M3, M4, UKW-D), rapporto 6812, foglio chiave 619.
  - 3d: galleria in `/storia/galleria/` con dieci immagini da Wikimedia Commons (PD, CC0, CC BY-SA), file in `src/assets/immagini/` ottimizzati da `astro:assets`. Componente `Figura` (`src/components/lesson/Figura.astro`): un `id` senza voce in `immagini.yaml` ferma la build; un test controlla che ogni file abbia i crediti e viceversa. Schema delle immagini con `alt`, `didascalia` e `categoria`; ammessa anche la CC BY-SA 2.5. Figure nelle lezioni di storia 1–3.
  - Test e2e: nuovi esercizi, schede (anche in modalità di stampa), lezioni di storia con axe, glossario e un crawler che controlla tutti i link interni (`tests/e2e/links.spec.ts`).
  - Nelle lezioni i link interni sono relativi (`../../schede/`): rispettano `base` e il crawler li verifica.

## Prossimo passo

- Revisione delle bozze 1–7 e delle lezioni di storia 1–4 da parte dell’autore.
- Fase 4 (v1.0): crittoanalisi, vista “Macchina” 2.5D, missioni storiche, guida per i docenti.
- Rinviati dalla 1b: cavi trascinabili sul pannello, schema in verticale su mobile, notazione tedesca dell’UKW-D (da verificare prima di mostrarla).

## Note operative

### In locale

- **Norme**: `.claude/norms` è un symlink a `../../norms` (`ln -s ../../norms .claude/norms`), ignorato da git. Senza, la sessione non riceve le norme di contenuto.
- **Node**: Astro 7 richiede Node ≥ 22.23.4 (vedi `.nvmrc`); pnpm 10.
- **Browser per i test e2e**: la prima volta, `pnpm exec playwright install chromium`.
- **Preview**: `astro preview` in Astro 7 usa un file di lock e può restare attivo in background. Usare `astro preview --ignore-lock` (già nel `playwright.config.ts`) e `pnpm exec astro preview stop` per fermarlo.
- **Rete**: `cryptomuseum.com`, `cryptocellar.org`, `codesandciphers.org.uk` e Wikimedia sono raggiungibili con `curl` (non con WebFetch). L’API di Commons (`w/api.php`) risponde spesso 429: funzionano meglio `https://commons.wikimedia.org/wiki/File:<nome>?action=raw` per autore e licenza e `Special:FilePath/<nome>?width=1200` per il file, con uno User-Agent descrittivo e qualche secondo di pausa tra le richieste.

- **Esito dei test in locale (2026-11-03, macOS, Node 25.9.0, Playwright 1.63.0)**: `pnpm verify` passa (170 test, 34 pagine). `pnpm test:e2e`: al primo giro 95 passati, 3 saltati, 4 falliti: in `tests/e2e/lessons.spec.ts`, desktop e mobile, le lezioni `come-funziona/la-matematica-di-enigma` e `storia/scherbius-e-le-macchine-commerciali` scadevano su `page.waitForLoadState('networkidle')` (30 s). Non era un difetto delle pagine: tutte le richieste finivano in circa 2 s e `load` scattava, ma l’attesa di Playwright non si risolveva. L’attesa è stata sostituita: il test porta in vista ogni `astro-island` e aspetta che perda l’attributo `ssr`. Dopo la correzione: 99 passati, 3 saltati, nessun fallito.

### Solo nel cloud

Valgono solo nel container delle sessioni cloud, dove le norme non sono raggiungibili e quindi la prosa non si scrive.

- **Node**: nel container c’è Node 24 in `/opt/node24/bin` (`export PATH=/opt/node24/bin:$PATH`). In un container nuovo va riscaricato da nodejs.org (`node-v24.x-linux-x64.tar.xz`).
- **Playwright**: nel container c’è la 1.63.0 con i browser in `/opt/pw-browsers`; tenere `@playwright/test@1.63.0` finché l’ambiente non cambia.
- **Simulatore originale**: clonato in `/home/user/EnigmaMachine`. I vettori di confronto si rigenerano con `node scripts/legacy/generate-vectors.cjs /home/user/EnigmaMachine/enigma.js <numero per modello> <file di uscita>`.

## Da verificare

- Storia: data dei rotori IV e V (Crypto Museum: “intorno” al 15 settembre 1938; altre ricostruzioni danno il dicembre 1938).
- Storia: procedura dell’indicatore tra il 15 settembre 1938 e il 1° maggio 1940 (posizione scelta dall’operatore e trasmessa in chiaro, chiave cifrata due volte) e motivo della doppia cifratura (errori di trasmissione): da controllare su Rejewski o Kozaczuk.
- Italia: Crypto Museum parla di un messaggio di prova mandato da un operatore “tedesco”; nella lezione si scrive solo “l’operatore”. Controllare su Batey, *Dilly*, anche la data (marzo 1941) e il ruolo delle decifrazioni a Matapan. Crypto Museum colloca la rottura “a ISK”, che però nacque solo nell’ottobre 1941: la lezione parla della sezione di Knox.
- Italia: nella tabella del cablaggio D (marina italiana) di Crypto Museum il rotore I contiene due volte la U, quindi non è una permutazione; per questo il modello non è stato aggiunto al motore.
- Rapporto 6812: nella trascrizione di Tony Sale l’esempio di pannello d’emergenza (parola CHRISTENSEN) ha un refuso (ABDYG al posto di ABDFG); non è usato nei testi.
- Galleria: il foglio chiave della Luftwaffe n. 649 su Commons è marcato solo “PD-US-no notice”; non è stato usato. Il ritratto di Rejewski (CC BY-SA 2.5, archivio della figlia) è piccolo, 200 × 274 pixel.
- Anno del Luftwaffen-Maschinenschlüssel Nr. 619 (1944 per analogia con il 649 di Commons).

- Lezione 2: data del trattato di Alberti (intorno al 1467) e attribuzione ad al-Kindi, da controllare su Singh.
- Volume di Cryptologia dell’articolo di Hamer (21 secondo la numerazione della rivista).

- `period` e `users` dei modelli in `src/engine/models.ts`, prima di mostrarli nelle schede storiche.
- Notazione dell’UKW-D (Bletchley J–Y o tedesca B–O). Uhr: l’esempio di Crypto Museum (posizione 03, spina 1a verso 5b e 5b verso 4a) coincide con il motore; manca un confronto su un messaggio reale.
- Numero di cavi nel tempo: Crypto Museum indica sei cavi all’inizio e dieci “dal 1° ottobre 1936”, mentre altre ricostruzioni danno per quella data da cinque a otto cavi. La lezione 7 evita la data; da controllare su Rejewski o Kozaczuk.
- Dettagli tecnici dell’Enigma K usata dalla Regia Marina.
- Numeri di pagina delle citazioni da *Codici & segreti* di Singh (sulla copia dell’autore).
- Crypto Museum, pagina “How does an Enigma machine work?”: i totali con la correzione del doppio passo sono sbagliati. Per l’Enigma I scrive 685 518 560 invece di 60 × 676 × 16 926 = 686 518 560; per la M4 toglie 650 posizioni una volta sola invece che per ciascuna delle 26 posizioni del rotore sottile (440 076 posizioni distinte, verificato con il motore). Con i rotori navali a due tacche nel mezzo la riduzione è diversa. La lezione 8 usa i valori ricalcolati.
- Esercizio sulla procedura dell’indicatore: descrive l’indicatore cifrato due volte con la Grundstellung del giorno, senza date. Prima di aggiungerle (e di scrivere la lezione sulle procedure) vanno verificati periodi e varianti della procedura per esercito, aviazione e marina.

### Fonti tolte dal frontmatter (fase B, D7, 2026-11-03)

Nessuno ha ancora controllato i fatti sui libri, quindi le lezioni non li mostrano come fonti. La fase V le rimette dopo la verifica.

| Fonte | Lezioni | Che cosa serve verificare |
|---|---|---|
| `singh-codici-segreti` | 1, 2 | lezione 1: contesto generale (brevetto, adozione militare); lezione 2: Alberti e la data del trattato, al-Kindi, cifrario di Cesare, pagine delle citazioni |
| `bauer-decrypted-secrets` | 2, 4, 6 | il frontmatter non diceva quale fatto: cifrari a disco, struttura del rotore, riflettore; la fase V lo ricava rileggendo il testo delle tre lezioni |
| `rejewski-1980` | 4, 8, voce «permutazione» del glossario | la macchina descritta come composizione di permutazioni |
| `hamer-1997` | 5, voce «doppio passo» del glossario | descrizione del doppio passo; volume di *Cryptologia* |
| `batey-dilly` | storia 4 | Mavis Lever e il messaggio di prova senza la L, marzo 1941, ruolo a Capo Matapan, biografia di Knox |

Le frasi che nominano Hamer (lezione 5) e Rejewski (glossario) restano nel testo: si appoggiano a Crypto Museum, ma l’attribuzione va confermata sui testi originali.

### Consultato in fase B (2026-11-03, `curl`)

- `cryptomuseum.com/crypto/enigma/hist.htm`: scrive «Willy Korn» (non «Willi»), collega di Scherbius e poi alla guida dell’azienda, a cui si deve l’idea del riflettore. Le lezioni usano «Willy».
- `cryptomuseum.com/crypto/enigma/ukwd/index.htm`: l’UKW-D fu introdotto nel gennaio 1944 dalla Luftwaffe; esisteva anche una variante per la marina (M3 e M4). Le lezioni lo attribuiscono alla Luftwaffe. Il cablaggio cambiava ogni dieci giorni circa, secondo i fogli chiave.
- Date di adozione armonizzate sulla ricostruzione di Crypto Museum (lezione di storia 2): marina nel 1926 (Funkschlüssel C), Enigma I dell’esercito pronta nel 1927 e in servizio dal 1° giugno 1930. `period` dell’Enigma I è ora «1930–1945».
