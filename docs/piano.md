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
| Modelli | Tutti e 15 nel motore; I, M3, M4 in evidenza |
| Funzioni extra | Link condivisibili (+ QR), traccia passo-passo, modalità LIM |
| Vista realistica | Illustrazione SVG parametrica; 3D (React Three Fiber) in fase 2 |
| Licenze | Codice MIT; contenuti CC BY-NC-SA 4.0 (immagini di terzi con licenza propria) |
| Rilasci | Verticali (vedi fasi) |

## Decisioni della revisione

Prese durante la revisione di `docs/piano-aggiornamento.md` (D1–D8, fase A e seguenti) e
nell’intervista della fase I (D9–D14). Valgono per le fasi qui sotto.

| # | Decisione | Raccomandazione | Fasi coinvolte | Risposta |
|---|---|---|---|---|
| D1 | Il symlink `.claude/norms` va tracciato in git o resta solo locale? | Solo locale (in `.gitignore`): nel cloud sarebbe comunque rotto | A | raccomandazione accettata (2026-11-03) |
| D2 | Virgolette: « » per le citazioni come vogliono le norme, o “ ” come prescrive oggi `CLAUDE.md`? | « »: l’eccezione dei caporali vale solo per Python Doesn’t Byte | A, C, E1–E3 | raccomandazione accettata (2026-11-03) |
| D3 | Le lezioni di Enigma adottano lo scheletro di `scrittura-didattica.md` §7 (citazione d’apertura, prerequisiti, obiettivi, riepilogo) e le domande di previsione prima dei componenti? | Sì per «Come funziona»; per la Storia solo obiettivi e riepilogo | D, E1–E3 | raccomandazione accettata (2026-11-03) |
| D4 | La lezione 7 si divide in «Il pannello a spine» e «L’Uhr»? | Sì: sono due tesi | E2 | raccomandazione accettata (2026-11-03) |
| D5 | Crittoanalisi e Docenti escono dal menu finché sono vuote? | Sì; restano raggiungibili dall’indirizzo | F | raccomandazione accettata (2026-11-03) |
| D6 | Design: correggere solo i difetti e tenere il tema neutro, o fare ora l’identità visiva di Rainbow Bits? | Correggere i difetti ora, identità in un piano separato quando esiste un riferimento | G0–G4 | 2026-11-03, rivista: identità ora. La home diventa il simulatore, tutto in una schermata a partire da 1280×720 senza scorrere; su mobile una versione ridotta che rimanda al desktop. La direzione si sceglie fra tre proposte sul canvas di Claude Design. I difetti del §5 della revisione si correggono dentro il nuovo design system |
| D7 | Quali libri delle fonti hai in copia (Singh, Batey, Rejewski, Kozaczuk, Welchman, Bauer, Hamer)? | Le fonti non consultate escono dal frontmatter finché non le verifichi | B | 2026-11-03: Marco ha solo Singh e procurerà i testi degli altri, da usare nella fase V. Fino ad allora escono dal frontmatter le fonti non consultate |
| D8 | La revisione viene prima della fase 4 del piano originale? | Sì: la fase 4 scrive molta prosa nuova, conviene farla con norme e linter a posto | I | raccomandazione accettata (2026-11-03) |
| D9 | La vista «Macchina» 2.5D resta nel piano? | — | fasi 4 e 5 | 2026-11-04: Marco la toglie. Il banco della home ha già i materiali della macchina; la vista realistica sarà solo la 3D, e senza WebGL resta il banco |
| D10 | Quanto va in profondità la crittoanalisi? | Racconto e animazioni, come nel piano originale | 4b–4e | raccomandazione accettata (2026-11-04): niente esercizi di crittoanalisi guidata |
| D11 | Che cosa resta dei rinviati della fase 1b? | — | — | 2026-11-04: escono i cavi trascinabili (bastano i due clic sulle prese, fase G0), lo schema in verticale su mobile (la versione ridotta non ha lo schema, fase G3) e la notazione tedesca dell’UKW-D |
| D12 | Quando vengono le missioni storiche? | Dopo la fase V, in una fase a sé dopo la crittoanalisi | 4f | raccomandazione accettata (2026-11-04) |
| D13 | La vista 3D resta nel piano? | — | 5a, 5b | 2026-11-04: Marco la tiene |
| D14 | Da dove viene il modello 3D: fatto in Blender (licenza propria) o un modello CC BY verificato? | — | 4i, 5a | 2026-11-04: strada 2. Prima si cerca su Sketchfab un modello di Enigma con licenza CC0 o CC BY, rotori già separati e meno di circa 50 000 poligoni; se c’è, lo si adatta e lo si registra con l’attribuzione; se no, la geometria la fa Claude con l’MCP di Blender. In ogni caso materiali, texture e luce possono venire da Poly Haven (CC0). Metodo: `blender-mcp` (Marco vuole imparare a usarlo per PQuest di Python Doesn’t Byte); il codice che costruisce ogni pezzo si salva comunque in `scripts/blender/` |
| D15 | Come entra il modello 3D nel sito? | — | 4i–4j, 5a–5c | 2026-11-04: pagina a sé, `/macchina/`, con voce di menu; la home resta com’è. Nella pagina si esplora la macchina, si cifra e decifra (stesso store del simulatore), si smonta con un selettore a fasi e si tocca un pezzo per leggerne la spiegazione e andare alla lezione. Le posizioni esplose si decidono in Blender e viaggiano nel `.glb`; il cablaggio dei rotori non si modella, lo disegna il codice dai dati del motore. Tetto del `.glb`: 1 MB, caricato solo dopo il pulsante «Avvia la vista 3D». Con tutti i pezzi da separare e nominare, un modello di terzi adatto è improbabile: la ricerca di D14 resta, ma ci si aspetta di costruire quasi tutto |

## Analisi della code base esistente

- `enigma.js` — motore: `Plugboard`, `Uhr`, `EntryWheel`, `Rotor`, `ReflectorWheel`, `EnigmaMachine`; catalogo di 15 modelli costruito per ereditarietà con `$.extend` (il motore dipende da jQuery).
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
- **Vista “Macchina” 2.5D** (tolta il 2026-11-04, decisione D9): illustrazione SVG parametrica dell’Enigma I (finestrelle, lampade che si accendono, tasti animati, scatto dei rotori, Steckerbrett con cavi a curva); varianti M4, G e commerciali generate dai dati del modello. Riusabile come figura nel libro.
- **Traccia passo-passo**: Avanti/Indietro e velocità regolabile; per ogni stadio la permutazione è mostrata in chiaro.
- **Link condivisibili + QR**; **missioni storiche** precaricate (Barbarossa, U-264, Scharnhorst).
- **Modalità LIM**: schermo intero (Fullscreen API), testi grandi, controlli essenziali, target touch ≥ 48 px, alto contrasto.
- **Accessibilità**: WCAG 2.2 AA, tutto usabile da tastiera, regione `aria-live` che annuncia la lampada accesa, `prefers-reduced-motion` rispettato.
- **Responsive**: su mobile tastiera, lampade e finestrelle (versione ridotta della fase G3; lo schema in verticale è uscito, decisione D11).

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

## Fasi

Le fasi 0–3 (v0.1–v0.3) sono fatte e unite in `main`; poi è venuta la revisione di
`docs/piano-aggiornamento.md` (fasi A–H). Il lavoro rimasto è diviso qui in fasi eseguibili
ciascuna in una sessione Claude Code separata, aperta in `enigma/` **in locale** (nel cloud le
norme non sono raggiungibili, quindi niente prosa).

### Stato

| Fase | Contenuto | Modello | Effort | Durata | Dipende da | Stato |
|---|---|---|---|---|---|---|
| 4a | Lezione «Modelli a confronto» | Opus | high | 2 h | G4 | fatta (2026-11-04) |
| 4b | Motore della crittoanalisi | Opus | high | 2,5 h | — | fatta (2026-11-04) |
| 4c | Animazioni della crittoanalisi | Sonnet | high | 2,5 h | 4b, G4 | fatta (2026-11-04) |
| 4d | Crittoanalisi polacca | Opus | high | 3 h | 4c | fatta (2026-11-04) |
| 4e | Bletchley Park e la M4 | Opus | high | 3 h | 4c, V (Welchman, Sebag-Montefiore, Hinsley) | fatta (2026-11-04) |
| 4f | Missioni storiche | Opus | high | 2 h | 4e, V (fonti delle chiavi) | fatta (2026-11-04) |
| 4g | Guida per i docenti | Opus | high | 2 h | G4 | fatta (2026-11-04) |
| 4h | Accessibilità e prestazioni | Sonnet | high | 1,5 h | 4a–4g | fatta (2026-11-04) |
| 4i | Modello 3D: struttura e convenzione dei nodi | Sonnet | high | 3 h | D14; Marco al Mac con Blender aperto | da fare |
| 4j | Modello 3D: smontaggio e posizioni esplose | Sonnet | high | 3 h | 4i; Marco al Mac con Blender aperto | da fare |
| 5a | Pagina 3D: architettura, caricamento e digitazione | Opus | high | 3 h | 4h, 4i | da fare |
| 5b | Pagina 3D: vista esplosa e interno dei rotori | Sonnet | high | 3 h | 4j, 5a | da fare |
| 5c | Pagina 3D: schede dei pezzi | Sonnet | high | 2,5 h | 5b | da fare |

Totale stimato: circa 33 ore di sessione. 4a, 4b e 4g non si toccano a vicenda e si possono
fare in qualunque ordine; 4d e 4e toccano file diversi e sono indipendenti fra loro. 4f viene
dopo la crittoanalisi per decisione di Marco (D12). 4h chiude la v1.0 e va fatta per ultima,
perché misura le pagine nuove. 4i e 4j non si possono fare nel cloud: serve Blender aperto sul Mac di Marco. La 5a parte dopo la 4i, la 5b dopo la 4j e la 5a, la 5c dopo la 5b.

### Fuori dalle fasi

Due compiti piccoli rimasti dalla fase V di `docs/piano-aggiornamento.md` (2026-11-04). Non
dipendono da nessuna fase; vanno chiusi prima della 4h.

| Compito | Chi | Fatto quando |
|---|---|---|
| Rileggere storia 4 (`src/content/lezioni/it/storia/04-enigma-e-l-italia.mdx`), riscritta nella fase V sul racconto di Batey: il messaggio senza L non è più legato a Matapan | Marco | la lezione è `stato: rivista` |
| Confrontare i rotori commerciali dell’Enigma D di `COMMERCIAL_ROTORS` (`src/engine/models.ts`) con CryptoCellar: Bauer, *Decrypted Secrets*, p. 124, dà cablaggi diversi (rotore I `HRWYIPCGVXL…`, tacca G). Sonnet, effort high, 0,5 h; se il motore cambia, servono vettori di test nuovi | sessione Claude (fatto il 2026-11-04: cablaggi corretti, motore invariato; resta aperta la questione delle tacche, in «Da verificare» di `docs/stato.md`) | la voce «Motore» di «Da verificare» in `docs/stato.md` passa a «Verificato», con la fonte |

### Regole comuni a tutte le fasi

- Lavora su un branch `fase/<numero della fase>` (per esempio `fase/4a`) creato da `main`
  aggiornato.
- Prima di scrivere prosa leggi `.claude/norms/scrittura-didattica.md`; a fine stesura fai la
  passata di `.claude/norms/scrittura-umana.md` e di `scrittura-parlata.md` §1. Le lezioni nuove
  nascono `stato: bozza`; solo Marco le porta a `rivista`.
- Ogni fatto storico rimanda a una voce di `src/content/fonti.yaml` consultata davvero; un fatto
  che solo un libro non ancora fornito può confermare va in «Da verificare» di `docs/stato.md` e
  non nel testo.
- Le pagine nuove seguono `docs/design.md`; colori solo dai token di `src/styles/tokens.css`.
- Prima di `pnpm test:e2e` ferma il server di sviluppo: Playwright riuserebbe quello al posto
  della build (fatto verificato il 2026-11-04, fase G0).
- Chiusura di ogni fase: spunta la riga nella tabella «Stato» qui sopra, aggiungi sotto la fase
  le righe «Esito» (che cosa è cambiato, che cosa resta, comandi eseguiti) e fai commit. Niente
  PR: con `pnpm verify && pnpm test:e2e` verdi fondi il branch in `main` in locale; il push su
  `main` pubblica il sito, quindi si fa dopo conferma di Marco.

---

### Fase 4a — Lezione «Modelli a confronto»

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: G4**

**Obiettivo.** «Come funziona» ha una lezione che mette a confronto i 15 modelli del motore con
una tabella e una linea del tempo, costruite dai dati di `src/engine/models.ts`.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 4a di docs/piano.md. Leggi docs/stato.md (sezione «Da verificare», voce su
`period` e `users`) e .claude/norms/scrittura-didattica.md. Avvia il sito con il server
«astro-dev» di .claude/launch.json e verifica la lezione nel browser, a desktop e a 375 px, in
tema chiaro e scuro.
```

**Passi**

1. Verifica `period` e `users` di ogni modello su Crypto Museum (con `curl`, vedi «Note
   operative» di `docs/stato.md`); correggi `models.ts` e aggiungi a `fonti.yaml` le pagine
   consultate. Un valore che non trovi resta fuori dalla tabella, e la lezione lo dice.
2. Componente `ConfrontoModelli` in `src/components/lesson/`: tabella (rotori, tacche, pannello,
   Uhr, riflettore regolabile o rotante, ruota d’ingresso) e linea del tempo, generate dai dati.
3. Lezione `11-modelli-a-confronto.mdx` con lo scheletro completo (decisione D3); la citazione
   d’apertura la sceglie Marco fra tre proposte vere.

**Criteri di accettazione**

```bash
ls src/content/lezioni/it/11-*.mdx && grep -c 'stato: bozza' src/content/lezioni/it/11-*.mdx
```
un file, e `1`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- `period` e `users` di tutti i 15 modelli verificati sulle pagine di Crypto Museum (con `curl`).
  `period` è ora `{ from, to?, basis }`: `basis` distingue gli anni d’uso da quelli di produzione
  (D, K, A28, G31), e `to` manca quando la fonte non dà la fine (norvegese). G111, G260 e G312 non
  hanno `period`: sono esemplari singoli, la fonte dà solo l’anno di fabbricazione o del
  sequestro. Corretti fra l’altro D (1926–1927, non «anni Trenta», niente uso diplomatico), T
  (1943–1945, dalla procedura TIRPITZ), KD (Mil Amt dal 1944, non «anni Quaranta»), G111 (esercito
  ungherese: «Monaco» era l’asta del 2009), G260 (probabilmente il Sicherheitsdienst, non
  l’Abwehr), M3 (dal 1934, perché vale anche per M1 e M2). Undici voci nuove in `fonti.yaml`.
- `src/lib/modelli.ts` (con `modelli.test.ts`) ricava dal catalogo famiglie, tacche, riflettore,
  ruota d’ingresso e barre della linea del tempo; `ALPHABETIC_ETW` e `QWERTZ_ETW` sono esportate dal
  motore. `ConfrontoModelli.astro` è statico (nessuna isola), con `vista="tabella"` o
  `vista="linea"`; stringhe in `lesson.models.*`.
- Lezione `11-modelli-a-confronto.mdx` in bozza, scheletro completo. Citazione d’apertura scelta da
  Marco fra tre proposte: Crypto Museum, pagina della Reichsbahn Enigma, sul traffico Rocket I.
  Previsione: da quale macchina deriva l’Enigma T.
- Provata nel browser con «astro-dev» a 1024 px e a 375 px, in tema chiaro e scuro: a 1024 px la
  tabella sta nella colonna, a 375 px scorre da sola senza allargare la pagina.
- `tests/e2e/smoke.spec.ts`: i link «Simulatore» e «Come funziona» del menu si cercano con
  `exact: true`, perché la descrizione della lezione 11 contiene «simulatore» e la ricerca per
  sottostringa trovava due link.
- Trovato e non corretto: il rotore IV della norvegese nel motore ha il cablaggio dell’Enigma I,
  mentre Crypto Museum ne dà un altro (in «Da verificare» di `docs/stato.md`).
- Comandi: `pnpm verify` (218 unit test, 43 pagine), `pnpm test:e2e` (160 passati, 24 saltati).

---

### Fase 4b — Motore della crittoanalisi

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: —**

**Obiettivo.** `src/engine/` sa calcolare ciò che le animazioni e le lezioni di crittoanalisi
mostrano: le permutazioni AD, BE, CF dagli indicatori doppi e la loro struttura in cicli (la
«caratteristica» di Rejewski); il menu di un crib e i suoi anelli; il controllo di una ipotesi
sul pannello come nella Bombe con il diagonal board.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 4b di docs/piano.md. Leggi src/engine/README.md e la traduzione di Rejewski 1980
indicata in src/content/fonti.yaml (voce rejewski-1980). src/engine resta TypeScript puro.
```

**Passi**

1. `src/engine/cryptanalysis.ts`: dagli indicatori doppi di una giornata (generati con il motore
   e una chiave del giorno) le permutazioni AD, BE, CF e la loro struttura in cicli, riusando
   `cycles()` e `cycleType()`.
2. Menu di un crib: grafo delle coppie lettera in chiaro–lettera cifrata con la posizione,
   anelli del grafo, scarto delle posizioni in cui una lettera cifrerebbe sé stessa.
3. Prova di un’ipotesi sul pannello lungo il menu, con e senza diagonal board, che restituisce le
   contraddizioni trovate.
4. Test di proprietà: i cicli di AD, BE e CF hanno lunghezze a coppie uguali (teorema di
   Rejewski); con la chiave giusta l’ipotesi corretta non dà contraddizioni.

**Criteri di accettazione**

```bash
pnpm exec vitest run src/engine/__tests__/cryptanalysis.test.ts
```
exit 0.

```bash
grep -rnE "from '(react|astro)|document\.|window\." src/engine | wc -l
```
`0`.

```bash
pnpm verify
```

**Esito (2026-11-04)**

- Nuovo `src/engine/cryptanalysis.ts`, esportato da `src/engine/index.ts` e descritto in
  `src/engine/README.md` (sezione «Crittoanalisi»). Per la fase 4c servono: `addIndicator` e
  `chains` (un indicatore alla volta, cicli chiusi e catene aperte); `buildMenu`, `menuLoops`,
  `menuCentre` e `testHypothesis`, le cui deduzioni ricordano da quale sono nate, così
  l’animazione può ripercorrere la propagazione fino alla contraddizione.
- In più rispetto ai passi: `transpositionsFromPair` e `secondFactorTranspositions` per l’esempio
  «jjj» di Rejewski 1980, p. 10 (utile alla fase 4d), e `loopPermutation`, il punto fisso di un
  anello su cui Turing costruì la Bombe.
- I test usano come vettori fissi gli esempi di Rejewski 1980 (traduzione CryptoCellar): la
  caratteristica (1) di p. 5, i frammenti dvpf, oumb, cqny di p. 6 e la deduzione di ppp e zzz da
  jjj di p. 10. Tutti e tre tornano con il motore.
- Sul menu di prova (crib WETTERVORHERSAGE, chiave M3 del README del motore), su 200 posizioni
  sbagliate dei rotori × 26 ipotesi ne restano coerenti 7 senza diagonal board e nessuna con: il
  test lo controlla.
- Differenza dalla Bombe vera, scritta nel README: le permutazioni dei rotori seguono il passo
  esatto della macchina, doppio passo compreso.
- Comandi eseguiti: `pnpm exec vitest run src/engine/__tests__/cryptanalysis.test.ts` (22 test
  verdi), il `grep` di purezza (`0`), `pnpm verify` (214 test, 0 errori; i 4 avvisi di
  `lint:content` su `src/i18n/it.json` c’erano già), `pnpm test:e2e` (125 passati, 19 saltati).

---

### Fase 4c — Animazioni della crittoanalisi

**Modello: Sonnet · Effort: high · Durata: 2,5 h · Dipende da: 4b, G4**

**Obiettivo.** Due componenti interattivi per le lezioni di crittoanalisi: la struttura in cicli
di AD, BE, CF che si costruisce indicatore dopo indicatore, e il menu di un crib con un anello
che la Bombe percorre.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 4c di docs/piano.md, usando le funzioni di src/engine/cryptanalysis.ts e il
catalogo delle animazioni di docs/design.md. Avvia il sito con il server «astro-dev» di
.claude/launch.json e verifica ogni modifica nel browser, a desktop e a 375 px, in tema chiaro e
scuro.
```

**Passi**

1. `src/components/lesson/CicliIndicatori.tsx`: aggiunge un indicatore alla volta e disegna i
   cicli che si chiudono; con `prefers-reduced-motion` lo stato cambia senza movimento.
2. `src/components/lesson/MenuBombe.tsx`: crib e testo cifrato allineati, grafo del menu, un
   anello evidenziato, ipotesi sul pannello che si propaga e si contraddice.
3. Colori del segnale (`--signal-forward-paper`, `--signal-return-paper`) per i due versi, come
   nelle altre figure; solo `transform`, `opacity` e `stroke-dashoffset`.
4. Test e2e con axe in chiaro e in scuro su una pagina di prova o sulla prima lezione che li usa.

**Criteri di accettazione**

```bash
ls src/components/lesson/CicliIndicatori.tsx src/components/lesson/MenuBombe.tsx
```

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- Nuovi `src/components/lesson/CicliIndicatori.tsx` e `MenuBombe.tsx`, usati con `client:visible`
  come gli altri componenti delle lezioni. Le stringhe stanno in `src/i18n/it.json`
  (`lesson.indicators.*` e `lesson.menu.*`).
- `CicliIndicatori`: una giornata d’esempio fissa (Enigma I, rotori II-I-III, posizione KUL, sei
  cavi) e una sequenza fissa di chiavi di messaggio, che si fermano quando AD, BE e CF sono
  complete (110 indicatori). Ogni pressione aggiunge un indicatore con `addIndicator`; `chains`
  separa cicli chiusi, disegnati come anelli, e catene aperte. Alla fine mostra la notazione a cicli
  e il teorema dei cicli a coppie.
- `MenuBombe`: crib `WETTERVORHERSAGE` sul messaggio e sulla chiave M3 del README del motore;
  allineamento crib e testo cifrato, grafo del menu, anello scelto con «Percorri l’anello»,
  ipotesi sul pannello (lettera, compagna, rotori nella posizione giusta o spostati, diagonal board)
  che si propaga una deduzione alla volta. La prova si ferma alla prima contraddizione: con i rotori
  sbagliati `testHypothesis` continua per centinaia di deduzioni, che nell’elenco non servono.
- Colori: `--signal-forward-paper` per il verso dalla lettera in chiaro alla cifrata (e per le prime tre
  lettere dell’indicatore), `--signal-return-paper` per il verso opposto; il verso è scritto anche
  con le frecce → e ←, e le contraddizioni anche a parole.
- Animazioni: solo `stroke-dashoffset` (nuova classe `.tracciato` in `global.css`, con `--dur` e
  `--ritardo`) e `inchiostro` (opacità e `translateY`). Nessun timer: ogni nuova azione rimonta
  l’elemento e riparte. Con `prefers-reduced-motion` `.tracciato` non ha animazione.
- Pagina di prova `src/pages/prove/crittoanalisi.astro`, non collegata da nessuna parte: serve ai
  test e2e finché le fasi 4d e 4e non usano i componenti in una lezione; allora va tolta.
- Test: `tests/e2e/crittoanalisi.spec.ts` (axe in chiaro e in scuro, comportamento dei due
  componenti, movimento ridotto), a desktop e mobile.
- Verificato nel browser con il server «astro-dev»: desktop in tema chiaro (entrambe le figure) e
  375 px per `MenuBombe` in chiaro e in scuro e per `CicliIndicatori` in chiaro, senza scorrimento
  orizzontale. Non guardati a occhio: desktop in tema scuro e `CicliIndicatori` a 375 px in scuro;
  li copre solo axe nei test e2e.
- Comandi eseguiti: `pnpm verify` (214 test, 0 errori; i 4 avvisi di `lint:content` su
  `src/i18n/it.json` c’erano già) e `pnpm test:e2e` (135 passati, 19 saltati). Con il server di
  sviluppo acceso sulla porta 4321, Playwright lo usa al posto di `astro preview` e molti test
  falliscono: va fermato prima.

---

### Fase 4d — Crittoanalisi polacca

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 4c; i fatti che solo Kozaczuk
conferma aspettano la fase V**

**Obiettivo.** La sezione Crittoanalisi ha le lezioni sul Biuro Szyfrów: Rejewski e la teoria
dei cicli, il ciclometro, i fogli di Zygalski, la bomba, la riunione di Pyry del luglio 1939.
Crittoanalisi torna nel menu (decisione D5).

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 4d di docs/piano.md. Leggi .claude/norms/scrittura-didattica.md, la traduzione di
Rejewski 1980 (fonti.yaml, rejewski-1980) e docs/stato.md («Da verificare»). Se in
~/Developer/github/enigma-fonti/ c'è Kozaczuk, usalo; altrimenti i fatti che solo lui conferma
vanno in «Da verificare» e non nel testo.
```

**Passi**

1. Collezione delle lezioni di crittoanalisi (`src/content/lezioni/it/crittoanalisi/`) e pagina
   indice al posto di `ComingSoon` in `src/pages/crittoanalisi/index.astro`.
2. Due o tre lezioni, con obiettivi e riepilogo come la Storia (decisione D3), che usano
   `CicliIndicatori`.
3. «Crittoanalisi» torna nel menu dell’intestazione del sito e della home.

**Criteri di accettazione**

```bash
ls src/content/lezioni/it/crittoanalisi/*.mdx | wc -l
```
almeno `2`.

```bash
grep -c 'nav.cryptanalysis' src/components/layout/SiteHeader.astro
```
almeno `1`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- Kozaczuk non era in `~/Developer/github/enigma-fonti/` ma in `docs/books/`, con le appendici di
  Rejewski: i fatti che solo lui conferma sono nel testo, con la pagina nei commenti di
  `docs/stato.md` («Verificato», fase 4d). Rejewski 1980 riscaricato da CryptoCellar.
- Tre lezioni in bozza in `src/content/lezioni/it/crittoanalisi/`, con obiettivi e riepilogo come
  la Storia (D3) e una `Previsione` ciascuna:
  - `01-rejewski-e-la-teoria-dei-cicli.mdx`: indicatori doppi, AD, BE e CF, teorema dei cicli a
    coppie, esempio «jjj», chiavi francesi del 1932 e ruota d’ingresso. Usa `CicliIndicatori` e il
    ritratto `marian-rejewski-1932`, finora solo in galleria.
  - `02-il-ciclometro-e-il-catalogo.mdx`: griglia, caratteristica con e senza pannello (calcolata
    con il motore sulla giornata di `CicliIndicatori`), ciclometro, catalogo, riflettore B, 15
    settembre 1938.
  - `03-la-bomba-e-i-fogli-di-zygalski.mdx`: femmine, bomba, fogli, rotori IV e V, riunione di Pyry
    e il disaccordo fra Rejewski e Hinsley sul perché.
- Numeri calcolati con il motore e scritti nelle lezioni: forme della caratteristica sulle 105 456
  posizioni (20 680 forme, una posizione su dieci con forma unica, mediana 20 schede), posizioni
  con punti fissi in AD (6 640 su 17 576, «circa il 40%» di Rejewski).
- `src/pages/crittoanalisi/index.astro` elenca le lezioni con `ListaLezioni` al posto di
  `ComingSoon`; nuova `src/pages/crittoanalisi/[...slug].astro`. «Crittoanalisi» torna nel menu
  (D5) in `SiteHeader.astro`, nella home e nelle due barre del simulatore (`Header.tsx`,
  `Compact.tsx`). Con sei voci, a 1024 px «Come funziona» andava a capo nella barra del
  simulatore: `bench.css` ora tiene le voci su una riga e stringe lo spazio sotto i 1200 px.
- Rimandi aggiornati nella lezione 9 e in storia 3; nomi nuovi in `scripts/nomi-propri.txt`.
- `src/pages/prove/crittoanalisi.astro` resta: `MenuBombe` non è ancora in una lezione (fase 4e).
- Test: le tre lezioni in `lessons.spec.ts` (axe in chiaro e in scuro), `crittoanalisi/` in
  `smoke.spec.ts`. Verificato nel browser: menu del sito a 768 px, barra del simulatore a 1024 px,
  lezione 1 a 375 px.
- Comandi eseguiti: i due criteri (`3` lezioni, `1` occorrenza), `pnpm verify` (214 test, 0
  errori, 40 pagine; i 4 avvisi di `lint:content` su `it.json` c’erano già), `pnpm test:e2e` (143
  passati, 19 saltati).
- Per Marco: le lezioni non hanno citazione d’apertura, come la Storia; se la vuole, servono tre
  proposte. Da rileggere in particolare il paragrafo su Hinsley (lezione 3), che riporta Hinsley
  solo attraverso la risposta di Rejewski in Kozaczuk.

---

### Fase 4e — Bletchley Park e la M4

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 4c, V (Welchman, Sebag-Montefiore,
Hinsley)**

**Obiettivo.** Le lezioni su Bletchley Park: Turing e Welchman, la Bombe e il diagonal board, crib
e menu, la M4 e il blackout di Shark nel 1942, U-110 e U-559, l’impatto di Ultra presentato come
dibattito storiografico aperto.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 4e di docs/piano.md. Leggi .claude/norms/scrittura-didattica.md, il trattato di
Turing (fonti.yaml, turing-treatise), i libri presenti in ~/Developer/github/enigma-fonti/ e
docs/stato.md («Da verificare»). Ultra si presenta come dibattito: tesi e autori, non una cifra.
```

**Passi**

1. Tre lezioni circa nella collezione di crittoanalisi, che usano `MenuBombe`.
2. Dove Singh semplifica o diverge dagli specialisti, la lezione lo dice («Bibliografia di base»).
3. Sposta in «Verificato» di `docs/stato.md` i fatti controllati sui libri, con libro e pagina.

**Criteri di accettazione**

```bash
grep -l 'MenuBombe' src/content/lezioni/it/crittoanalisi/*.mdx | wc -l
```
almeno `1`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- Fonti: Welchman e Sebag-Montefiore da `docs/books/`, Singh (edizione italiana e, per la frase di
  Hinsley, quella inglese per ragazzi), il capitolo 1 del trattato di Turing (riscaricato da
  CryptoCellar). Hinsley non è fra i libri: le sue tesi arrivano attraverso Sebag-Montefiore,
  Singh e Welchman, e la lezione lo dice. I fatti controllati sono in «Verificato (fase 4e)» di
  `docs/stato.md`; le divergenze fra le fonti in «Da verificare». La sezione «Per la fase 4e» è
  stata assorbita da quelle due.
- Tre lezioni in bozza in `src/content/lezioni/it/crittoanalisi/`, con obiettivi e riepilogo come
  la Storia (D3), ognuna con una forma diversa:
  - `04-il-crib-e-la-bombe.mdx`: crib, menu, anelli che il pannello non cancella, deduzioni da
    un’ipotesi, diagonal board, fermate. Usa `MenuBombe` con una `Previsione` (ipotesi sbagliata
    con i rotori giusti) e una citazione breve di Turing (cap. 1, p. 2). Numeri calcolati con il
    motore sulla chiave del componente: il crib sta in 19 posizioni su 33; un anello lascia
    11 064 posizioni su 17 576, due ne lasciano 7 117; con il diagonal board la scansione si ferma
    una volta (BLA), senza 648 volte; le 25 ipotesi sbagliate si contraddicono entro la
    quattordicesima deduzione.
  - `05-la-m4-e-shark.mdx`: Enigma della marina, tabella delle catture del 1941, quarto rotore,
    blackout di Shark, U-559 e 13 dicembre 1942. Una `Previsione` con `MiniSimulatore` su una M4
    con Beta in A, che cifra WETTER in OOHJSF come la M3 della lezione 4 (verificato nel motore e
    nel browser).
  - `06-quanto-conto-ultra.mdx`: casi documentati (PQ12, PQ17, sbarco), stima controfattuale, una
    sezione per autore (Hinsley, Singh, Sebag-Montefiore, Welchman) e il confronto fra il 1946 e il
    1948 attribuiti a Hinsley. Niente cifra come risposta.
- Dove Singh diverge, le lezioni lo dicono: date della prima Bombe e della ripresa del maggio 1940,
  diagonal board non nominato, progetto attribuito al solo Turing (lezione 4); riflettore navale a
  26 posizioni (lezione 5); Hinsley con il 1948 (lezione 6).
- Rimandi aggiornati: «Il riflettore», «Il pannello a spine» e «La bomba e i fogli di Zygalski»
  ora collegano la lezione 4. Glossario: voci nuove `diagonal-board` e `menu`; `bombe` riscritta
  (non più «la diagonal board», Turing non più unico autore), `crib` e `ultra` rimandano alle
  lezioni nuove. Nomi nuovi in `scripts/nomi-propri.txt`.
- Tolta `src/pages/prove/crittoanalisi.astro`: `tests/e2e/crittoanalisi.spec.ts` prova ora
  `CicliIndicatori` nella lezione 1 e `MenuBombe` nella lezione 4; l’accessibilità delle due la
  controlla `lessons.spec.ts`, che ha le tre lezioni nuove.
- Nella lezione 6 una tabella di prosa a quattro colonne faceva fallire axe a 375 px (regione che
  scorre senza tastiera): è diventata una sezione per autore.
- Verificato nel browser con «astro-dev»: lezione 5 a desktop (tabella e simulatore) e a 375 px,
  lezione 4 a 375 px (`MenuBombe`, «Percorri l’anello»), lezione 6 a 375 px; nessuno scorrimento
  orizzontale. Non guardato a occhio il tema scuro: lo copre axe.
- Comandi eseguiti: il criterio (`1` lezione con `MenuBombe`), `pnpm verify` (214 test, 0 errori;
  i 4 avvisi di `lint:content` su `it.json` c’erano già), `pnpm test:e2e` (147 passati, 19
  saltati).
- Per Marco: come in 4d, niente citazione d’apertura; se la vuole, servono tre proposte. Da
  rileggere in particolare la sezione «Il diagonal board» della lezione 4 (il modello delle
  fermate senza diagonal board è quello del motore, non la Bombe di Turing del 1940) e le quattro
  tesi della lezione 6.

---

### Fase 4f — Missioni storiche

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: 4e, V (fonti delle chiavi)**

**Obiettivo.** Il menu «Carica una chiave» del foglio della home ha le chiavi storiche
(Barbarossa, U-264, Scharnhorst), ognuna con il messaggio, un breve contesto e la voce verificata
in `fonti.yaml`.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 4f di docs/piano.md. I vettori dei messaggi sono già in
src/engine/__tests__/historical.test.ts. Leggi docs/design.md («Da confermare con Marco», punto 3)
e .claude/norms/scrittura-didattica.md.
```

**Passi**

1. Per ogni missione una voce in `fonti.yaml` consultata davvero (per esempio la trascrizione di
   Hamer, CryptoCellar o il libro che la riporta), con la pagina.
2. Dati delle missioni in `src/content/` (chiave, testo cifrato, contesto in prosa), letti dal
   menu del foglio al posto delle chiavi di prova; le chiavi di prova restano in fondo al menu.
3. Un test e2e per missione: caricata la chiave e battuto il testo cifrato, il foglio mostra il
   testo in chiaro atteso.

**Criteri di accettazione**

```bash
grep -cE 'barbarossa|u-264|scharnhorst' tests/e2e/simulator.spec.ts
```
almeno `3`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- Fonti cercate in rete, perché nessun libro del progetto riporta i tre messaggi. La pagina di
  Franklin Heath (da Internet Archive: il sito rispondeva con un errore) rimanda alle fonti
  primarie, che sono le voci nuove di `fonti.yaml`: `ostwald-weierud-1941` (il PDF di CryptoCellar
  con il modulo n. 20 del 7 luglio 1941, chiave e indicatori) e `sullivan-weierud-2005` per
  Barbarossa; `krah-m4-first-break` ed `erskine-1996` per U-264; `weierud-scharnhorst` per
  Scharnhorst. Fatti e pagine in «Verificato (fase 4f)» di `docs/stato.md`.
- Due correzioni ai vettori di `src/engine/__tests__/historical.test.ts`: la seconda parte di
  Barbarossa ha 150 lettere e non 135 (le ultime 15 decifrano «KAMENEC X DIV X KDR X»); U-264 fu
  ricevuto il 19 novembre 1942, non il 25, che è la data del rapporto di HMS Hurricane.
- `src/content/missioni.yaml`, collezione `missioni` in `src/content.config.ts`: per ogni messaggio
  chiave del giorno, parti (chiave del messaggio, indicatore se riproducibile, testo cifrato nei
  gruppi del modulo, testo in chiaro), contesto, «da notare», traduzione nostra, fonti e lezione.
  La build decifra ogni parte con il motore e controlla l’indicatore: una lettera sbagliata la
  ferma (provato alterando una lettera). Barbarossa usa l’Enigma I, non la M3 dei test.
- Menu «Carica una chiave» (`Sheet.tsx`): gruppo «Messaggi storici» in ordine di data (Barbarossa
  parte 1 e 2, U-264, Scharnhorst) e, in fondo, «Chiavi di prova». Una missione carica la chiave,
  mette il testo cifrato nel campo «Digita» e mostra la riga «Messaggio storico» con il pulsante
  «Contesto», che apre un pannello ancorato (`MissionPanel` in `Panels.tsx`). I campi `contesto`,
  `procedura` e `traduzione` passano da `lint:content`; nomi nuovi in `scripts/nomi-propri.txt`.
- Barbarossa mostra la procedura del 1940 con un indicatore vero: con i rotori in WXC, KCH dà
  BLA. Le due missioni della marina caricano direttamente la chiave del messaggio, perché
  l’indicatore navale passa da tabelle di bigrammi che il simulatore non riproduce.
- `docs/design.md`, «Da confermare», punto 3 (solo Barbarossa): superato da questa fase, che chiede
  le tre missioni.
- Test e2e in `tests/e2e/simulator.spec.ts`: uno per parte (selezionata la missione e premuto
  «Digita», le lampade danno il testo in chiaro scritto nel test, indipendente dai dati) e uno per
  l’indicatore di Barbarossa, il pannello con fonti e lezione, axe in chiaro e in scuro, Esc e la
  chiave di prova che toglie la missione. Verificato nel browser con «astro-dev» a 1280×720: la
  pagina resta alta 720 px con la riga della missione e il pannello scorre.
- Comandi eseguiti: il criterio (`6` righe), `pnpm verify` (214 test, 0 errori, 42 pagine; i 4
  avvisi di `lint:content` su `it.json` c’erano già), `pnpm test:e2e` (152 passati, 24 saltati).
- Per Marco: da rileggere i testi delle missioni in `src/content/missioni.yaml` e le traduzioni,
  che sono nostre (le scelte incerte sono in «Da verificare» di `docs/stato.md`). La versione
  ridotta per il telefono non ha il menu delle chiavi, quindi nemmeno le missioni.

---

### Fase 4g — Guida per i docenti

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: G4**

**Obiettivo.** `/docenti/` è una guida per l’uso in classe: modalità LIM, link condivisibili e
QR, esercizi con il seme, schede stampabili, collegamenti con Informatica, Sistemi e reti e TPSIT.
Docenti torna nel menu (decisione D5).

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 4g di docs/piano.md. Leggi .claude/norms/scrittura-istituzionale.md: la guida si
rivolge ai colleghi docenti. Avvia il sito con il server «astro-dev» e prova nel browser ogni
procedura che la guida descrive prima di scriverla.
```

**Passi**

1. Pagina `src/pages/docenti/index.astro` al posto di `ComingSoon`, con i testi in
   `src/content/` o in `it.json` (che passano da `pnpm lint:content`).
2. Ogni procedura descritta (aprire la LIM, assegnare la stessa variante alla classe, stampare
   una serie di schede) è provata nel browser e ha un link diretto.
3. Se la fase 4f è fatta, la guida cita le missioni; altrimenti l’«Esito» lo dice.
4. «Docenti» torna nel menu dell’intestazione.

**Criteri di accettazione**

```bash
grep -c 'ComingSoon' src/pages/docenti/index.astro
```
`0`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- `src/pages/docenti/index.astro` mostra `src/content/docenti/guida.mdx` (avviso di bozza in
  testa), al posto di `ComingSoon`, che non serviva più ed è stato tolto con la stringa
  `status.comingSoon`. Il testo sta in `src/content/`, quindi passa da `lint:content`; i link sono
  relativi a `/docenti/` e rispettano `base`.
- Registro di `scrittura-istituzionale.md`: il paragrafo d’apertura ha il sito come soggetto, le
  procedure usano l’infinito («Aprire», «Premere») per non dare del tu ai colleghi. È
  un’interpretazione della norma, che non parla delle procedure: da confermare con Marco.
- Sezioni: simulatore alla LIM (con «Digita», «Opzioni», le velocità dello schema e la versione
  ridotta sotto 1024 × 576), link e QR, messaggi storici (fase 4f fatta, quindi la guida li
  cita), esercizi e varianti, schede stampabili, collegamenti con il curricolo.
- Ogni procedura provata nel browser con «astro-dev» a 1280×720: modalità LIM; «Condividi» con e
  senza «Includi le lettere digitate» e il QR; il link della chiave d’esempio decifra
  QEZKD XNWJF UKNMF S in ATTACCATEALLALBA anche a 375 px nella versione ridotta; Barbarossa e
  «Contesto»; variante 4827 di «Decifra un messaggio» riaperta dal link e dal campo «Numero della
  variante»; serie `schede/?seme=100&copie=25`. La stampa è stata provata con un PDF di Chromium
  (Playwright) di tre schede: tre pagine A4 per scheda con le opzioni di partenza, soluzioni in
  pagine separate. La scheda n. 100 ha la stessa variante di `esercizi/posizioni/?seme=100`.
- Non provato: lo schermo intero della modalità LIM, che il pannello del browser della sessione
  rifiuta («Permissions check failed»); la guida lo descrive dal codice di `Simulator.tsx`.
- Collegamenti con il curricolo dalle Linee guida della Direttiva 16 gennaio 2012, n. 4,
  articolazione Informatica, lette nella copia dell’allegato pubblicata dall’ITIS Fauser
  (`netlab.fauser.edu/risorse/doc/C4_Informatica.pdf`): Informatica (secondo biennio), Sistemi e
  reti (quinto anno), TPSIT (secondo biennio e quinto anno). Le voci citate sono testuali.
- «Docenti» è tornata nei tre menu: `SiteHeader.astro`, `bench/Header.tsx` e `bench/Compact.tsx`.
  Con sette voci a 768 px «Come funziona» andava a capo: le voci hanno `whitespace-nowrap` e sotto
  `lg` un margine interno più stretto. A 1024×576 la barra del banco ci sta senza scorrere.
- Test e2e: `docenti/` fra le pagine di axe in `smoke.spec.ts`; un test che apre la guida dal
  menu e ne segue i link della serie di schede e della variante 4827; un test sulle sette voci a
  768 px; «Docenti» nel menu della versione ridotta in `simulator.spec.ts`.
- Comandi eseguiti: il criterio (`0`), `pnpm verify` (214 test, 0 errori, 42 pagine; i 4 avvisi di
  `lint:content` su `it.json` c’erano già), `pnpm test:e2e` (158 passati, 24 saltati).
- Per Marco: rileggere la guida, in particolare i collegamenti con il curricolo. La riforma degli
  istituti tecnici porta Linee guida nuove; per il triennio di quest’anno valgono ancora quelle del
  2012, ma il riferimento va aggiornato quando le nuove arriveranno alle terze. Notato in passata,
  fuori fase: nelle soluzioni delle schede il titolo «Dove saranno i rotori?» è seguito dai due
  punti («rotori?:»).

---

### Fase 4h — Accessibilità e prestazioni

**Modello: Sonnet · Effort: high · Durata: 1,5 h · Dipende da: 4a–4g**

**Obiettivo.** Il budget del piano diventa un test: Lighthouse con prestazioni almeno 90 e
accessibilità 100 sulle pagine principali, axe senza violazioni su tutte.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 4h di docs/piano.md. Il budget è nella sezione «Verifica» di docs/piano.md.
```

**Passi**

1. Script `pnpm test:lighthouse` sulla build (home, una lezione per sezione, esercizi, schede,
   glossario, docenti), a desktop e a 375 px.
2. Correggi ciò che resta sotto il budget; ciò che non si può correggere in questa fase va
   nell’«Esito» con il motivo.
3. Il test di axe di `tests/e2e/smoke.spec.ts` copre tutte le pagine elencate al passo 1.

**Criteri di accettazione**

```bash
pnpm build && pnpm test:lighthouse
```
exit 0.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04, branch `fase/4h`)**

- `pnpm test:lighthouse` (`scripts/lighthouse.ts`): avvia `astro preview` su una porta sua (4322),
  apre il Chromium di Playwright (o `CHROME_PATH`) e misura le dieci pagine di
  `scripts/pagine.ts` — home, simulatore, «Modelli a confronto», «Enigma e l’Italia», «La bomba e
  i fogli di Zygalski», indice degli esercizi, «Decifra un messaggio», schede, glossario, docenti —
  a desktop (preset di Lighthouse) e a 375 px (mobile con schermo 375 × 812, throttling di
  Lighthouse). Esce con 1 se una misura sta sotto il budget; una pagina sotto soglia si rimisura
  fino a tre volte e conta la migliore, perché le prestazioni oscillano. Dipendenze nuove:
  `lighthouse` 13.6.0 e `chrome-launcher` 1.2.2. Il passo è anche in `ci.yml`, dopo gli e2e.
- Lo stesso elenco serve ad axe: `tests/e2e/smoke.spec.ts` legge `pagineAxe` da `scripts/pagine.ts`
  (le dieci di Lighthouse più indici di sezione, galleria e fonti); sono entrate `simulatore/`,
  `esercizi/`, `esercizi/decifra/` e una lezione di Storia, una di Crittoanalisi e «Modelli a
  confronto».
- Prima misura: accessibilità 100 ovunque, prestazioni 50–76 a quasi tutte le pagine (18 misure su
  20 sotto 90). Cause trovate, in ordine di peso:
  1. **`ui-monospace` nello stack di `--font-mono`**. In Chromium su macOS la prima risoluzione di
     quel nome blocca il primo rendering per circa 2 s (FCP 2,1 s contro 30 ms, riprodotto con
     Playwright cambiando solo la famiglia). Tolto da `src/styles/tokens.css`: lo stack è
     `'Courier Prime', Menlo, Consolas, monospace`. Effetto: prestazioni 95–100 a desktop e 97–100
     a 375 px; anche la suite e2e passa da 1,4 min a 45 s.
  2. **Spostamento di layout dei componenti `client:only`** (`esercizi/[id]`, `schede/`): il
     segnaposto era una riga, il componente porta la pagina a 3000 px e il piè di pagina, già in
     vista, scivolava (CLS 0,2). Classe `.fallback-schermo` in `global.css` (altezza `100svh`):
     sempre per gli esercizi con simulatore e per le schede, solo sotto 48 rem per gli altri
     (a desktop stanno in una schermata). CLS misurato su tutte le 11 pagine di esercizi e le
     schede a 375, 1350 e 1920 px: 0 ovunque tranne `esercizi/` a 375 px (0,05, sotto la soglia
     di 0,1).
  3. **Cambio di carattere**: a seconda che Archivo arrivi prima o dopo il primo rendering, il
     glossario a 375 px aveva un CLS di 0,25 (prestazioni 87) o 0,02. `Head.astro` ora precarica
     `archivo-latin-normal` e `courier-prime-latin-400-normal` (importati con `?url`, quindi con
     lo stesso hash del CSS). Resta un CLS di 0,02 al massimo, dal grassetto della macchina da
     scrivere.
- Risultato finale (tre misure di ogni pagina a 375 px più due giri completi del comando): prestazioni da 96
  a 100, accessibilità 100 in tutte le 20 combinazioni. Non c’è nulla che non si sia potuto
  correggere. La pagina `simulatore/` ha un reindirizzamento (audit `redirects`): costa pochi
  punti a 375 px (96–98) e non è stato toccato.
- Test instabile, trovato per via della velocità nuova: i due test di `simulator.spec.ts` che
  battono la tastiera fisica (`50 lettere battute in fretta…`, `la tastiera fisica cifra…`)
  fallivano una volta ogni tre giri completi. Il simulatore registra la tastiera in un effetto
  dopo il primo disegno e `open()` aspettava solo il titolo; ora `open()` aspetta anche due
  fotogrammi. Cinque giri completi consecutivi: 172 passati, 24 saltati. Il difetto era del test,
  non del sito (un lettore non batte 50 tasti in 5 ms).
- Per Marco: i due compiti di «Fuori dalle fasi» non risultano chiusi (storia 4 ancora da
  rileggere; i rotori commerciali dell’Enigma D da confrontare con CryptoCellar): il piano li
  voleva prima della 4h, ma nessuna riga della 4h ne dipende e non li ho toccati. La CI su
  GitHub (Linux) non è stata provata: i punteggi di Lighthouse cambiano con la macchina; se
  `pnpm test:lighthouse` fallisse lì per pochi punti, il budget va riletto, non allentato a occhio.
- Comandi eseguiti: `pnpm build && pnpm test:lighthouse` (exit 0, due volte di fila dopo le
  correzioni), `pnpm verify` (218 test, 0 errori, 43 pagine), `pnpm test:e2e` (172 passati, 24
  saltati, cinque giri).

---

### Fase 4i — Modello 3D: struttura e convenzione dei nodi

**Modello: Sonnet · Effort: high · Durata: 3 h · Dipende da: D14, D15; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** Un `.glb` dell’Enigma I a tre rotori con la struttura esterna e i rotori come pezzi
interi, i nodi chiamati secondo una convenzione fissa e i file che lo rigenerano nel repo. La 5a lo
carica; la 4j lo completa con lo smontaggio.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 4i di docs/piano.md. Leggi le decisioni D14 e D15. Controlla che gli strumenti
dell’MCP di Blender siano disponibili in questa sessione; se non lo sono, fermati e dimmi che cosa
manca (Blender, l’addon, il server).
```

**Prima della sessione (Marco, una volta sola).**

1. `brew install --cask blender` e `brew install uv`.
2. Installare in Blender l’addon di [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)
   e avviarne il server dal pannello laterale.
3. Registrare il server per l’utente, così serve anche a Python Doesn’t Byte (il comando esatto è
   nel README del progetto; di solito `claude mcp add --scope user blender -- uvx blender-mcp`).
4. Salvare il file `.blend` prima di ogni sessione: lo strumento `execute_blender_code` esegue
   codice Python arbitrario.

**Passi**

1. **Ricerca (30 minuti al massimo).** Cerca su Sketchfab un modello di Enigma con i requisiti di
   D14: licenza CC0 o CC BY, pezzi già separati e nominati (almeno rotori, tasti e lampade), meno
   di circa 50 000 poligoni. Verifica la licenza sulla pagina del modello e annotala. Se ne trovi
   uno, mostralo a Marco prima di adattarlo. Se no, scrivilo nell’«Esito» e passa al passo 2.
2. **Costruzione.** Dove serve la geometria, usa l’MCP con le foto della galleria
   (`enigma-i-milano`, `rotori-e-perno`, `rotori-con-anelli`) come riferimento per le proporzioni.
   Materiali, texture e luce possono venire da Poly Haven (CC0): annotane gli id nell’«Esito». Niente
   altri asset di terzi. Pezzi uguali (tasti, lampade, contatti) sono istanze della stessa mesh.
3. **Convenzione dei nodi** (la 4j, la 5a e la 5b la usano). Nomi in minuscolo: `scatola`,
   `coperchio`, `tasto_a`…`tasto_z`, `lampada_a`…`lampada_z`, `pannello_spine`, `riflettore`,
   `ruota_ingresso`, e per ogni rotore (`rotore_destro`, `rotore_centrale`, `rotore_sinistro`) un
   nodo con i figli `corpo`, `anello`, `tacca`, `contatti`; poi `nottolino_destro` e
   `nottolino_centrale`. L’origine di ogni rotore sta sul suo asse e l’asse è X, così girarlo in
   three.js è una sola proprietà. I nomi che servono alla 4j in più li sceglie la 4j e li aggiunge
   alla convenzione.
4. **Il codice resta nel repo.** Ogni pezzo costruito con `execute_blender_code` si salva anche in
   `scripts/blender/<pezzo>.py`, e un `scripts/blender/costruisci.py` li esegue in ordine ed esporta
   il `.glb`. Il `.blend` non va in git.
5. **Esportazione** in `public/modelli/enigma-i.glb` (glTF binario), sotto 500 KB in questa fase.
6. **Verifica dei nodi.** `scripts/verifica-modello.ts`, senza dipendenze nuove: legge il blocco
   JSON del `.glb`, controlla il peso e che esistano tutti i nodi dell’elenco `NODI_ATTESI`
   definito in testa al file. Si lancia con `node scripts/verifica-modello.ts`.
7. **Licenza.** Chiedi a Marco con quale licenza pubblica la geometria fatta da lui e da Claude; se
   c’è una base di terzi, ripeti titolo, autore, URL e licenza. Scrivi la risposta nell’«Esito» e in
   «Da verificare» di `docs/stato.md`: la voce nel sito la crea la 5a.

**Criteri di accettazione**

```bash
node scripts/verifica-modello.ts
```
exit 0, con il peso sotto 500 KB e tutti i nodi della convenzione.

```bash
ls scripts/blender/costruisci.py
```

```bash
pnpm verify
```

**Esito.** Da compilare: modello scelto (di terzi o fatto da zero, con licenza e URL), peso,
numero di poligoni, id Poly Haven usati, licenza della geometria, che cosa ha richiesto più tempo
con l’MCP e che cosa conviene sapere per PQuest.

---

### Fase 4j — Modello 3D: smontaggio e posizioni esplose

**Modello: Sonnet · Effort: high · Durata: 3 h · Dipende da: 4i; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** Il `.glb` di 4i diventa un modello smontabile: ogni componente è un pezzo a sé e
porta nel file la posizione esplosa e la fase in cui si stacca, così la pagina non ha tabelle sue.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 4j di docs/piano.md, partendo dal modello e dalla convenzione dei nodi dell’«Esito»
della fase 4i. Controlla che gli strumenti dell’MCP di Blender siano disponibili in questa
sessione; se non lo sono, fermati e dimmi che cosa manca.
```

**Passi**

1. **Pezzi in più.** Aggiungi ciò che si vede aprendo la macchina: dentro ogni rotore il disco dei
   contatti destro e sinistro, la molla del puntale, la tacca e l’anello come pezzi separati; sotto
   i tasti la leva e il trascinatore; il fondo della scatola con le batterie e i fili delle
   lampade. Il cablaggio dei rotori non si modella (D15). Un nome per ogni pezzo, in minuscolo,
   aggiunti a `NODI_ATTESI`.
2. **Fasi dello smontaggio.** Quattro: 1 apertura (coperchio e pannello a spine); 2 rotori e
   riflettore estratti dalla macchina; 3 rotori aperti (anello, dischi, tacca, molla); 4 meccanica
   sotto i tasti e fondo. Ogni pezzo che si stacca ha un nodo genitore con la sua fase.
3. **Dati nel file.** Per ogni pezzo staccabile, nelle proprietà personalizzate del nodo (in
   glTF finiscono in `extras`): `esploso`, il vettore `[x, y, z]` dello spostamento in unità del
   modello, e `fase`, un intero da 1 a 4. Lo spostamento lo scegli guardando la scena: i pezzi
   non devono sovrapporsi nella posizione finale e restano allineati sull’asse del loro gruppo.
4. **Anteprima di ogni fase.** Renderizza un PNG per fase con `bpy` (o con una schermata dell’MCP)
   e guardalo prima di esportare. Salva lo script in `scripts/blender/`.
5. **Peso.** Il tetto del `.glb` passa a 1 MB. Se lo si supera, riduci i poligoni dei pezzi
   piccoli, non le fasi.
6. **Verifica.** Estendi `scripts/verifica-modello.ts`: ogni nodo con `esploso` ha tre numeri e una
   `fase` fra 1 e 4, ogni fase ha almeno un pezzo, nessun nodo di `NODI_ATTESI` manca.

**Criteri di accettazione**

```bash
node scripts/verifica-modello.ts
```
exit 0, con il peso sotto 1 MB, i dati `esploso` e `fase` su ogni pezzo staccabile e tutti i nodi
della convenzione.

```bash
pnpm verify
```

**Esito.** Da compilare: elenco dei pezzi e delle fasi, peso, difficoltà incontrate con le
proprietà personalizzate e l’esportazione di `extras`.

---

### Fase 5a — Pagina 3D: architettura, caricamento e digitazione

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 4h, 4i (il modello 3D)**

**Obiettivo.** La pagina `/macchina/` con la macchina in 3D (React Three Fiber e drei), caricata
solo su richiesta. Si ruota la camera, si digita da tastiera fisica o dai tasti del modello e si
vedono lampade e rotori reagire al motore. Senza WebGL resta un avviso e il rimando al simulatore.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 5a di docs/piano.md. Leggi le decisioni D14 e D15 e l’«Esito» della fase 4i: dicono
dove sta il modello 3D, come si chiamano i suoi nodi e con quale licenza. Se la 4i non è fatta,
fermati e dimmelo.
```

**Passi**

1. **Pagina e menu.** `/macchina/` con `url()`, una voce di menu come le altre sezioni, la home
   invariata. La pagina si apre con una scena statica di anteprima (immagine o scena minima) e un
   pulsante «Avvia la vista 3D».
2. **Caricamento pigro.** Il pacchetto di three.js e il `.glb` si scaricano dopo il pulsante, non
   prima.
3. **Stato condiviso.** La vista usa lo store del simulatore: stessa sessione, stessi link
   condivisibili. Il tasto premuto sul modello o sulla tastiera fisica passa dallo stesso punto del
   simulatore schematico; il motore resta unico.
4. **Segnale.** Lampada accesa e rotori che girano nelle finestrelle; un’area `aria-live` fuori
   schermo annuncia «Lampada E» a ogni tasto, e serve anche ai test.
5. **Accessibilità e preferenze.** Senza WebGL un avviso e il rimando al simulatore; con
   `prefers-reduced-motion` niente rotazioni automatiche e transizioni di camera senza animazione.
6. **Licenza del modello** con la sua voce di crediti (come `immagini.yaml` per le immagini), a
   partire dalla risposta registrata dalla 4i.
7. **Prestazioni.** `/macchina/` entra in `scripts/pagine.ts`, quindi nel budget di Lighthouse
   (prestazioni ≥ 90, accessibilità 100) e nei test di axe, misurate sullo stato iniziale.

**Criteri di accettazione**

```bash
pnpm build && ls dist/_astro | grep -ci three
```
almeno `1`; né la home né `/macchina/` prima del clic scaricano three.js o il `.glb` (test e2e sulle
richieste di rete).

```bash
pnpm build && pnpm test:lighthouse
```
exit 0, con `/macchina/` nel budget.

```bash
pnpm verify && pnpm test:e2e
```
con un test che avvia la vista, batte una lettera e legge l’annuncio della lampada.

---

### Fase 5b — Pagina 3D: vista esplosa e interno dei rotori

**Modello: Sonnet · Effort: high · Durata: 3 h · Dipende da: 4j, 5a**

**Obiettivo.** Un selettore fa scorrere la macchina dalla posizione chiusa a quella smontata; si
vede l’interno dei rotori con il cablaggio disegnato dal codice, e i nottolini mostrano il doppio
passo a ogni tasto.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 5b di docs/piano.md, partendo dalla pagina costruita in 5a e dai dati `esploso` e
`fase` del modello di 4j. Avvia il sito con il server «astro-dev» e verifica nel browser.
```

**Passi**

1. **Selettore.** Un `input type="range"` nativo da 0 a 4 (a passi continui): ogni intero è una
   fase. `aria-valuetext` dice in parole la fase («rotori estratti»). Il valore sposta ogni pezzo
   dalla posizione di riposo a `esploso`, con la sua fase come inizio e fine dell’interpolazione.
2. **Cablaggio.** Disegnato dal codice a partire dai dati del modello selezionato nel simulatore
   (`models.ts`), come linee fra i contatti dei due dischi; cambia quando cambia il rotore scelto.
3. **Nottolini.** Si muovono secondo lo stato del motore a ogni tasto, e il doppio passo si
   riconosce: il nottolino centrale spinge insieme il rotore centrale e quello di sinistra.
4. **Preferenze.** Con `prefers-reduced-motion` il selettore sposta i pezzi senza animare la camera.

**Criteri di accettazione**

```bash
pnpm verify && pnpm test:e2e
```
con un test che porta il selettore a 4 e controlla `aria-valuetext`, e un altro che batte le
lettere del doppio passo (da ADU) e controlla le posizioni mostrate.

---

### Fase 5c — Pagina 3D: schede dei pezzi

**Modello: Sonnet · Effort: high · Durata: 2,5 h · Dipende da: 5b**

**Obiettivo.** Toccando un pezzo (o scegliendolo da un elenco accessibile) si apre una scheda con il
suo nome, una spiegazione breve e il link alla lezione che lo tratta.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 5c di docs/piano.md. Prima di scrivere le schede leggi
.claude/norms/scrittura-didattica.md; a fine stesura fai la passata di scrittura-umana.md e di
scrittura-parlata.md §1. Si lavora in locale: nel cloud le norme non sono raggiungibili.
```

**Passi**

1. **Dati.** `src/content/pezzi.yaml`, una voce per pezzo: `id` (il nome del nodo), `nome`,
   `descrizione` (due o tre frasi, controllate da `lint:content`), `lezione` (percorso della
   lezione che lo spiega) e `fonti` se c’è un fatto storico. La scheda rimanda alla lezione, non
   la ripete.
2. **Interazione.** Il clic (o il tocco) su un pezzo lo evidenzia e apre la scheda; un elenco dei
   pezzi, navigabile da tastiera e leggibile da uno screen reader, fa lo stesso senza il mouse. Il
   focus passa alla scheda e torna all’elemento che l’ha aperta.
3. **Raccordo con l’esploso.** Dall’elenco o dalla scheda un pulsante porta il selettore alla fase
   in cui il pezzo è visibile.
4. **Test di coerenza.** Un test unitario controlla che ogni nodo con `fase` abbia una voce in
   `pezzi.yaml`, e viceversa; che ogni `lezione` esista; che ogni `fonti` sia in `fonti.yaml`.
5. **Prosa.** Le schede nascono come bozza e le rivede Marco. Fatti non confermati da una fonte
   consultata vanno in «Da verificare» di `docs/stato.md`.

**Criteri di accettazione**

```bash
pnpm lint:content
```
exit 0.

```bash
pnpm verify && pnpm test:e2e
```
con un test che apre la scheda dalla lista con la tastiera e controlla il link alla lezione, e il
crawler dei link interni che include le nuove pagine.

---

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
