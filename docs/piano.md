# Enigma — Rainbow Bits: piano di reimplementazione

## Context

Il fork `marcofarina/EnigmaMachine` (Summerside Makerspace, 2016, Apache-2.0) è un simulatore in JS ES5 + jQuery 2.2 + Bootstrap 3, senza build, con test QUnit. Va reimplementato da zero nel nuovo repository **`marcofarina/enigma`** (lo crea l’utente e lo aggiunge alla sessione) con stack moderno, UX/UI migliore, un percorso didattico completo (storia, funzionamento, matematica, crittoanalisi), materiali visivi animati, esercizi per il triennio dell’istituto tecnico informatico e una vista realistica della macchina (2.5D ora, 3D in fase 2). Il sito confluirà nel progetto Rainbow Bits (libro di crittografia). Il fork originale **non** viene modificato: i bug si correggono solo nella reimplementazione.

## Decisioni prese (intervista)

| Tema | Scelta |
|---|---|
| Stack | Astro + React + TypeScript, Tailwind, MDX |
| Lingue | Italiano, con i18n predisposta per l’inglese |
| Hosting | GitHub Pages via GitHub Actions |
| Pubblico | Triennio tecnico informatico (16–19 anni) |
| Esercizi | Interattivi autocorretti + schede stampabili; niente crittoanalisi guidata in v1 |
| Progressi | Solo `localStorage`, nessun account, nessun dato personale |
| Immagini | Solo pubblico dominio / CC0 / CC BY / CC BY-SA, con attribuzioni complete |
| Testi | Bozze scritte da Claude in italiano secondo le regole tipografiche dell’utente; revisione dell’utente |
| Fonti | Singh (*Codici & segreti*) come fonte + brevi citazioni (art. 70 LdA) con pagina da verificare, più fonti specialistiche |
| Identità visiva | Tema neutro basato su design token, sostituibile |
| Modelli | Tutti e 16 nel motore; I, M3, M4 in evidenza |
| Funzioni extra | Link condivisibili (+ QR), traccia passo-passo, modalità LIM |
| Vista realistica | Illustrazione SVG parametrica; 3D (React Three Fiber) in fase 2 |
| Licenze | Codice MIT; contenuti CC BY-NC-SA 4.0 (immagini di terzi con licenza propria) |
| Rilasci | Verticali (vedi fasi) |

## Analisi della code base esistente

- `enigma.js` — motore: `Plugboard`, `Uhr`, `EntryWheel`, `Rotor`, `ReflectorWheel`, `EnigmaMachine`; catalogo di 16 modelli costruito per ereditarietà con `$.extend` (il motore dipende da jQuery).
- `enigma-gui.js` — GUI imperativa sul DOM; i fili sono `<div>` ruotati via CSS con correzioni a pixel; lo stato è sparso tra DOM e oggetto `EnigmaMachine`, che viene ricreato a ogni modifica.
- `test/enigma-tests.js` — ~70 test QUnit con tabelle di cablaggio e messaggi storici (Barbarossa parte 1 e 2, U-264, Scharnhorst): **da riusare come test vector**.

**Verificato come corretto:** cablaggi e tacche di tutti i modelli; formula rotore `(c + pos − ring) mod 26`; doppio passo; movimento a ingranaggi del G con UKW rotante; Uhr reciproca solo alle posizioni multiple di 4 (verificato in Node, coerente con Crypto Museum).

### Bug confermati (riprodotti in Node) → correzione nel nuovo motore
1. **Validazione dell’input rotta** (`enigma.js:544`): confronta una stringa con un numero, quindi il filtro non scatta mai per lettere o punteggiatura. `"A.B"`, `"L'ENIGMA"`, `"aaa"`, `"È"` lanciano un TypeError **dopo** che i rotori sono già avanzati; “Cipher All” va in crash su qualunque testo italiano con apostrofi o accenti. → normalizzazione esplicita del testo (vedi `text.ts`) e `pressKey` che accetta solo `A–Z` e non modifica lo stato in caso di input non valido.
2. **Tasti non-lettera nel campo tastiera** (`enigma-gui.js:44`, `String.fromCharCode(e.which)`): Shift, Backspace, frecce, F1–F12 e la virgola fanno avanzare i rotori e poi lanciano un’eccezione. → uso di `KeyboardEvent.key`, ignorando modificatori e ripetizione automatica; Backspace = annulla (riavvolge i rotori), con nota didattica che la macchina reale non lo permetteva.
3. “Cipher All” aggiorna i select ma non ridisegna i rotori. → unica fonte di verità (store) da cui derivano tutte le viste.
4. Rotori duplicati solo segnalati. → nella configurazione un rotore può occupare un solo slot.
5. Uhr con meno di 10 cavi: le lettere spariscono dopo che i rotori sono avanzati. → `validateConfig` blocca la cifratura finché la configurazione non è completa (Uhr: 10 cavi; UKW-D: 12 coppie + J–Y fissa).
6. Latente (`enigma.js:557`): il controllo sul filo del riflettore ignora la posizione. → riflettore modellato come permutazione completa e validata.
7. Variabili globali implicite, `e.which` deprecato, link `rawgit` morto, CDN obsolete.

### Inesattezze storiche → correzione nei dati dei modelli
- **UKW regolabile**: il codice lega la regolazione del riflettore al movimento a ingranaggi e la disabilita su D, K, Swiss-K, Railway e T. Nelle macchine commerciali l’UKW era impostabile a mano su 26 posizioni ma fisso durante la cifratura (Crypto Museum, CryptoCellar). → nuovi flag `reflectorSettable` e `reflectorRotates`.
- **Uhr** offerta su M3, M4 e Norway: fu usata solo dalla Luftwaffe con l’Enigma I, dal luglio 1944. → `uhrSupported` solo su Enigma I.
- “M3 (Army / Navy)”: la M3 era della Kriegsmarine; i rotori VI–VIII erano solo della marina. → etichette e schede storiche corrette.
- **UKW-D**: impiego su M3/M4 e notazione Bletchley (J–Y fisso) rispetto a quella tedesca (B–O) da verificare sulle fonti; la UI mostrerà entrambe le notazioni.
- **KD**: l’UKW era riconfigurabile (UKW-D); il cablaggio noto viene mantenuto come predefinito, con una nota (da verificare).

## Architettura

Un solo progetto Astro (pnpm, Node LTS, versioni stabili correnti al momento dello scaffold). Il motore sta in `src/engine/`: TypeScript puro, senza dipendenze, senza DOM né React (regola ESLint `no-restricted-imports`), riusabile anche da script Node per generare figure ed esercizi del libro.

```
enigma/
├─ src/engine/            alphabet, models, rotor, reflector, plugboard, uhr, stepping,
│                         machine, trace, validate, config-codec, text, keyspace, random (PRNG con seme)
├─ src/components/
│  ├─ simulator/          Simulator.tsx, store.ts (Zustand), ConfigPanel, RotorWheel, PlugboardEditor,
│  │                      UhrDial, UkwDEditor, Keyboard, Lampboard, Tape, ShareDialog (QR), LimMode
│  ├─ views/schematic/    SchematicView.tsx + layout.ts (coordinate calcolate, niente correzioni a pixel)
│  ├─ views/machine/      MachineView.tsx + parts/ (lampade, tasti, finestrelle, Steckerbrett, cavi)
│  ├─ tracer/             Tracer.tsx (percorso del segnale passo-passo)
│  ├─ lesson/             Figura, Nota, Approfondimento, Citazione, MiniSimulatore, animations/*
│  └─ exercises/          ExerciseRunner.tsx, tipi di esercizio, progress.ts (localStorage con try/catch)
├─ src/content/           lezioni/it, storia/it, crittoanalisi/it, esercizi/it, glossario, fonti, immagini (crediti)
├─ src/content.config.ts  schemi Zod (un’immagine senza crediti fa fallire la build)
├─ src/i18n/              it.json + helper (routing Astro, it predefinito senza prefisso)
├─ src/pages/             index, simulatore, come-funziona/, storia/, crittoanalisi/, esercizi/, schede/,
│                         glossario, fonti, docenti
├─ src/styles/            tokens.css (tema neutro chiaro/scuro), global.css, print.css (A4)
├─ scripts/               lint-content.ts (regole tipografiche), check-credits.ts
├─ tests/e2e/             Playwright + axe
├─ fixtures/              legacy-vectors.json (generato dal motore originale, solo dati)
└─ .github/workflows/     ci.yml (lint, typecheck, test, build), deploy.yml (Pages)
```

### Motore (`src/engine`)
- **Dati dichiarativi** in `models.ts`: per ogni modello id, etichetta, anni, arma/ente, `stepping: 'lever' | 'gear'`, `slots`, `reflectorSettable`, `reflectorRotates`, `plugboard`, `uhrSupported`, `ukwDRewirable`, ETW, rotori `{wiring, notches, thin?}`, riflettori. Niente ereditarietà con `$.extend`: oggetti espliciti o un piccolo helper `derive()` tipizzato. Cablaggi e tacche ripresi dal motore originale (già verificati).
- **API funzionale e immutabile**: `createMachine(config)`, `step(state) → {state, moved[]}`, `pressKey(state, letter) → {state, output, trace}`, `encipherText(state, text)`. La `trace` registra ogni stadio (tasto → plugboard/Uhr → ETW → rotori in andata → UKW → rotori al ritorno → ETW → plugboard → lampada) e alimenta schema, vista 2.5D e tracer. L’immutabilità rende banale annulla/ripeti.
- **Uhr**: porting delle tabelle `ab_wiring` e `b_plug_order` con percorsi distinti di andata e ritorno (logica originale corretta).
- **`text.ts`**: normalizzazione per l’italiano (maiuscole, rimozione degli accenti, apostrofi eliminati, numeri trascritti o scartati, opzione convenzionale `X` per il punto), raggruppamento in blocchi da cinque.
- **`config-codec.ts`**: configurazione ↔ query string versionata e leggibile (es. `?v=1&m=M4&u=Bt&w=b-II-IV-I&r=AAAV&g=VJNA&s=AT.BL.DF…`), con messaggio facoltativo; la usano i link condivisibili, i QR del libro e gli esercizi.
- **`keyspace.ts`**: calcolo dello spazio delle chiavi con ipotesi esplicite (rotori disponibili, slot, numero di cavi, anelli contati o meno), per spiegare perché le fonti riportano cifre diverse (per esempio la stima di Singh rispetto a ~1,59 × 10²⁰ per l’Enigma I con 10 cavi; cifra di Singh da verificare sulla copia dell’utente).
- **`random.ts`**: PRNG con seme, così fogli chiave ed esercizi sono riproducibili (“scheda n. 4827”).

### Simulatore (UX/UI)
- **Layout**: pannello di configurazione (modello; Walzenlage con selezione esclusiva; Ringstellung; Grundstellung con rotelle trascinabili, scroll o frecce; plugboard con cavi trascinabili tra le prese oppure coppie digitate “AB CD…”; quadrante Uhr; editor UKW-D) + area principale con schede **Schema** / **Macchina** / affiancate + tastiera e lampade a disposizione QWERTZ originale + nastro di input e output con gruppi da cinque e pulsante “copia”.
- **Schema SVG**: colonne di contatti che scorrono con la posizione, fili come path SVG, andata e ritorno con colori adatti ai daltonici e tratteggio diverso.
- **Vista “Macchina” 2.5D**: illustrazione SVG parametrica dell’Enigma I (finestrelle, lampade che si accendono, tasti animati, scatto dei rotori, Steckerbrett con cavi a curva); varianti M4, G e commerciali generate dai dati del modello. Riusabile come figura nel libro.
- **Traccia passo-passo**: Avanti/Indietro e velocità regolabile; per ogni stadio la permutazione è mostrata in chiaro.
- **Link condivisibili + QR**; **missioni storiche** precaricate (Barbarossa, U-264, Scharnhorst).
- **Modalità LIM**: schermo intero (Fullscreen API), testi grandi, controlli essenziali, target touch ≥ 48 px, alto contrasto.
- **Accessibilità**: WCAG 2.2 AA, tutto usabile da tastiera, regione `aria-live` che annuncia la lampada accesa, `prefers-reduced-motion` rispettato.
- **Responsive**: su mobile tastiera, lampade e finestrelle; schema in orientamento verticale.

### Contenuti (MDX, bozze di Claude, revisione dell’utente)
Componenti MDX: `<Figura>` (con crediti obbligatori), `<Animazione>`, `<Nota>`, `<Approfondimento livello="avanzato">`, `<Citazione fonte pagina>`, `<MiniSimulatore config="…">`, formule con KaTeX (remark-math / rehype-katex).

- **Come funziona** — dalla sostituzione monoalfabetica al rotore (Cesare, il disco di Alberti); tastiera, lampade e circuito; rotori (cablaggio, posizione, anello); passo e doppio passo (animazione); riflettore: reciprocità e “nessuna lettera cifra sé stessa”; Steckerbrett e Uhr; matematica (permutazioni, composizione, coniugio, involuzioni, `E = P⁻¹ R⁻¹ U R P` e calcolatore dello spazio delle chiavi); modelli a confronto (tabella + linea del tempo).
- **Storia e procedure** — Scherbius e le macchine commerciali; adozione militare (Reichsmarine 1926, Reichswehr 1928, Luftwaffe); fogli chiave giornalieri, Kenngruppen, Spruchschlüssel, indicatore doppio fino al 1940; galleria di reperti e documenti.
- **Enigma e l’Italia** — l’Enigma K della Regia Marina, Knox e Mavis Lever (Batey), Capo Matapan (marzo 1941); dettagli tecnici della K italiana da verificare.
- **Crittoanalisi (racconto)** — Biuro Szyfrów e Rejewski (teoria dei cicli, ciclometro, fogli di Zygalski, *bomba*), Pyry (luglio 1939), Bletchley Park (Turing, Welchman, Bombe, diagonal board, crib e menu), M4 e Atlantico (U-110, U-559, il blackout di Shark nel 1942), impatto di Ultra presentato come dibattito storiografico aperto (per esempio la tesi dei “due anni” di Hinsley). Animazioni: strutture dei cicli, loop di un menu della Bombe.
- **Glossario** tedesco–italiano–inglese, **Fonti** e **Crediti immagini** generati automaticamente, **Guida per i docenti** (uso in classe, modalità LIM, link, collegamenti con Informatica, Sistemi e reti e TPSIT).
- **Bibliografia di base**: Singh, *Codici & segreti*; Rejewski, “An Application of the Theory of Permutations in Breaking the Enigma Cipher” (1980); Welchman, *The Hut Six Story*; Kozaczuk, *Enigma*; Sebag-Montefiore, *Enigma*; Batey, *Dilly*; Bauer, *Decrypted Secrets*; Hinsley et al.; Crypto Museum; CryptoCellar (Weierud); codesandciphers.org.uk (Sale). Dove Singh semplifica o diverge dagli specialisti, lo si dice esplicitamente.
- **Regole tipografiche automatizzate**: smartypants configurato per l’italiano + `scripts/lint-content.ts` in CI (virgolette e apostrofi diritti nella prosa, titoli in maiuscolo solo iniziale, incisi con trattino lungo, acronimi senza punti).
- **Immagini**: collezione `immagini` con file, autore, fonte, licenza, URL della licenza e testo di attribuzione; ammesse solo PD, CC0, CC BY e CC BY-SA (Wikimedia Commons, Bundesarchiv, NSA/National Cryptologic Museum). Per l’uso nel libro, le CC BY-SA vanno confermate con l’editore.

### Esercizi (autocorretti, progressi in `localStorage`)
Varianti generate con seme e verificate dal motore.
- **Livello 1 — Operatore**: cifra o decifra con impostazioni date; imposta la macchina da un foglio chiave e decifra; segui la procedura dell’indicatore.
- **Livello 2 — Meccanica**: prevedi le posizioni dopo N tasti (doppio passo); calcola a mano una lettera con le tabelle di cablaggio (simulatore bloccato); “perché questo crittogramma non può venire da un’Enigma?”.
- **Livello 3 — Matematica**: spazio delle chiavi con vincoli; numero di plugboard con k cavi; verifica di involuzioni; trova la posizione iniziale conoscendo il resto della chiave (ricerca su uno spazio ridotto).
- **Schede stampabili** (`print.css`, A4): generatore di fogli chiave in stile Heer/Luftwaffe con seme, messaggi da decifrare, soluzioni su una pagina separata, set per classe con semi diversi.

## Fasi (rilasci verticali)

0. **Setup** — scaffold Astro + React + TS + Tailwind + MDX, ESLint/Prettier, Vitest, Playwright, design token, schemi dei contenuti, lint dei contenuti, CI e deploy su GitHub Pages, README con crediti a Summerside Makerspace, LICENSE (MIT) e LICENSE-CONTENT (CC BY-NC-SA 4.0).
1. **v0.1** — motore completo + test; simulatore schematico con configurazione, tastiera, lampade e nastro; link condivisibili; lezioni “Come funziona” 1–6 con animazioni base.
2. **v0.2** — traccia passo-passo, modalità LIM, QR, lezione di matematica + calcolatore, esercizi di livello 1–2, progressi.
3. **v0.3** — storia e procedure, Enigma e l’Italia, galleria con crediti, glossario, schede stampabili, esercizi di livello 3.
4. **v1.0** — crittoanalisi (racconto + animazioni), vista “Macchina” 2.5D SVG, missioni storiche, guida per i docenti, revisione completa di accessibilità e prestazioni.
5. **v2** — vista 3D con React Three Fiber + drei, caricata solo su richiesta, con ricaduta sulla 2.5D se manca WebGL: vista esplosa del pacco rotori, interno del rotore (contatti, tacca, anello), meccanismo dei nottolini che rende visibile il doppio passo. Modello: da realizzare in Blender (licenza propria) o CC BY verificato.

## Verifica

- **Unit test del motore (Vitest)**: tabelle di cablaggio; i 4 messaggi storici dell’originale; test di proprietà con fast-check (`decifra(cifra(x)) = x`, nessuna lettera cifra sé stessa, Uhr reciproca solo alle posizioni multiple di 4, il passo non salta mai stati); regressione per ogni bug elencato (per esempio `"L'ENIGMA È"` non lancia eccezioni e i caratteri non validi non fanno avanzare i rotori).
- **Test differenziale**: `fixtures/legacy-vectors.json`, generato in questa sessione eseguendo il motore originale in Node su ≥ 10.000 configurazioni casuali per modello; il nuovo motore deve coincidere ovunque, tranne dove le divergenze sono volute (UKW commerciale non in posizione A, gestione dell’input).
- **Statico**: `pnpm lint`, `astro check` / `tsc --noEmit`, `pnpm lint:content`, `check-credits`.
- **E2E (Playwright, già installato)**: digitare da tastiera fisica con Shift e Backspace; andata e ritorno di un link condivisibile; modalità LIM; esercizi con salvataggio dei progressi; anteprima di stampa delle schede; axe senza violazioni; budget Lighthouse (prestazioni ≥ 90, accessibilità 100).
- **Verifica visiva**: avvio di `pnpm dev`/`preview` e screenshot delle viste principali a ogni rilascio.
- **Verifiche esterne aperte**: vettori Uhr e UKW-D contro una fonte indipendente; notazione UKW-D; dettagli della K italiana; numeri di pagina delle citazioni di Singh (utente); licenze di ogni immagine.

## Prerequisiti e rischi
- La rete della sessione blocca `cryptomuseum.com`. Per ricerca e immagini vanno aggiunti agli Allowed domains dell’ambiente almeno `cryptomuseum.com`, `cryptocellar.org`, `codesandciphers.org.uk`, `commons.wikimedia.org`, `upload.wikimedia.org` (https://code.claude.com/docs/en/cloud-environments#network-access).
- Creazione di `marcofarina/enigma` da parte dell’utente e aggiunta alla sessione prima della fase 0.
- I testi sono bozze: ogni rilascio passa per una PR di revisione dei contenuti.
