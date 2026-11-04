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
| D14 | Da dove viene il modello 3D: fatto in Blender (licenza propria) o un modello CC BY verificato? | — | 5a | da decidere prima della fase 5a |

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
| 4a | Lezione «Modelli a confronto» | Opus | high | 2 h | G4 | da fare |
| 4b | Motore della crittoanalisi | Opus | high | 2,5 h | — | fatta (2026-11-04) |
| 4c | Animazioni della crittoanalisi | Sonnet | high | 2,5 h | 4b, G4 | da fare |
| 4d | Crittoanalisi polacca | Opus | high | 3 h | 4c | da fare |
| 4e | Bletchley Park e la M4 | Opus | high | 3 h | 4c, V (Welchman, Sebag-Montefiore, Hinsley) | da fare |
| 4f | Missioni storiche | Opus | high | 2 h | 4e, V (fonti delle chiavi) | da fare |
| 4g | Guida per i docenti | Opus | high | 2 h | G4 | da fare |
| 4h | Accessibilità e prestazioni | Sonnet | high | 1,5 h | 4a–4g | da fare |
| 5a | Vista 3D: architettura e caricamento | Opus | high | 3 h | 4h, D14 | da fare |
| 5b | Vista 3D: pacco rotori e doppio passo | Sonnet | high | 2,5 h | 5a | da fare |

Totale stimato: circa 24 ore di sessione. 4a, 4b e 4g non si toccano a vicenda e si possono
fare in qualunque ordine; 4d e 4e toccano file diversi e sono indipendenti fra loro. 4f viene
dopo la crittoanalisi per decisione di Marco (D12). 4h chiude la v1.0 e va fatta per ultima,
perché misura le pagine nuove.

### Fuori dalle fasi

Due compiti piccoli rimasti dalla fase V di `docs/piano-aggiornamento.md` (2026-11-04). Non
dipendono da nessuna fase; vanno chiusi prima della 4h.

| Compito | Chi | Fatto quando |
|---|---|---|
| Rileggere storia 4 (`src/content/lezioni/it/storia/04-enigma-e-l-italia.mdx`), riscritta nella fase V sul racconto di Batey: il messaggio senza L non è più legato a Matapan | Marco | la lezione è `stato: rivista` |
| Confrontare i rotori commerciali dell’Enigma D di `COMMERCIAL_ROTORS` (`src/engine/models.ts`) con CryptoCellar: Bauer, *Decrypted Secrets*, p. 124, dà cablaggi diversi (rotore I `HRWYIPCGVXL…`, tacca G). Sonnet, effort high, 0,5 h; se il motore cambia, servono vettori di test nuovi | sessione Claude | la voce «Motore» di «Da verificare» in `docs/stato.md` passa a «Verificato», con la fonte |

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

---

### Fase 5a — Vista 3D: architettura e caricamento

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 4h, D14 (il modello 3D)**

**Obiettivo.** Una vista 3D della macchina con React Three Fiber e drei, caricata solo su
richiesta: chi non la apre non scarica nulla in più, e senza WebGL resta il banco della home.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase 5a di docs/piano.md. Leggi la decisione D14 in docs/piano.md: dice da dove viene
il modello 3D e con quale licenza. Se D14 non ha risposta, fermati e chiedila a Marco.
```

**Passi**

1. Dove si apre la vista (un pulsante del banco o una pagina) e come prende lo stato dallo store
   del simulatore.
2. Caricamento pigro: il pacchetto di three.js è in un pezzo separato, scaricato al primo uso.
3. Senza WebGL un avviso e il banco; con `prefers-reduced-motion` niente rotazioni automatiche.
4. Il modello con la sua voce di licenza (come `immagini.yaml` per le immagini).

**Criteri di accettazione**

```bash
pnpm build && ls dist/_astro | grep -ci three
```
almeno `1`, e la home senza la vista aperta non lo scarica (test e2e sulle richieste di rete).

```bash
pnpm verify && pnpm test:e2e
```

---

### Fase 5b — Vista 3D: pacco rotori e doppio passo

**Modello: Sonnet · Effort: high · Durata: 2,5 h · Dipende da: 5a**

**Obiettivo.** Nella vista 3D si vedono la vista esplosa del pacco rotori, l’interno del rotore
(contatti, tacca, anello) e i nottolini che rendono visibile il doppio passo.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase 5b di docs/piano.md, partendo dalla vista costruita in 5a. Avvia il sito con il
server «astro-dev» e verifica nel browser.
```

**Passi**

1. Vista esplosa del pacco rotori, comandata da un controllo accessibile da tastiera.
2. Interno di un rotore: contatti, cablaggio, tacca, anello che si sposta.
3. Nottolini e doppio passo, sincronizzati con lo stato del motore a ogni tasto.

**Criteri di accettazione**

```bash
pnpm verify && pnpm test:e2e
```
con un test che batte le lettere del doppio passo (da ADU) e controlla le posizioni mostrate.

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
