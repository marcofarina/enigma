# Piano di aggiornamento: allineare Enigma alle norme del workspace

Corregge quanto elencato in `docs/revisione-2026-11-03.md` (d’ora in poi «la revisione»). Ogni fase
si esegue in una sessione Claude Code separata, aperta in `enigma/` **in locale**: nel cloud le
norme non sono raggiungibili.

## Decisioni

Spostata in `docs/piano.md`, sezione «Decisioni della revisione» (fase I, 2026-11-04), con le
decisioni prese dopo (D9–D14).

## Stato

| Fase | Contenuto | Modello | Effort | Durata | Dipende da | Stato |
|---|---|---|---|---|---|---|
| A | Norme in sessione e documenti operativi | Sonnet | high | 0,5 h | D1, D2 | fatta |
| B | Errori di fatto e incoerenze | Sonnet | high | 1 h | A, D7 | fatta |
| C | Linter dei contenuti | Sonnet | high | 1,5 h | A, D2 | fatta |
| D | Componenti dello scheletro della lezione | Opus | high | 1,5 h | A, D3 | fatta |
| E1 | Riscrittura «Come funziona» 1–4 | Opus | high | 2 h | B, C, D | fatta |
| E2 | Riscrittura «Come funziona» 5–8 | Opus | high | 2,5 h | B, C, D, D4 | fatta |
| E3 | Riscrittura Storia 1–4 e glossario | Opus | high | 2 h | B, C, D | fatta |
| F | Interfaccia e i18n | Sonnet | high | 1 h | A, C, D5 | fatta |
| G0 | Direzione visiva sul canvas | Opus | high | 2 h | F, D6 | fatta |
| G1 | Design system nel codice | Opus | high | 2,5 h | G0, H | fatta |
| G2 | Il simulatore a schermata unica come home | Opus | high | 3 h | G1 | fatta |
| G3 | Il simulatore su mobile | Sonnet | high | 1,5 h | G2 | fatta |
| G4 | Il resto del sito nel nuovo linguaggio | Sonnet | high | 2 h | G1 | fatta |
| H | Pulizia del codice | Sonnet | high | 1 h | A | fatta |
| V | Verifiche sui testi delle fonti | Opus | high | 2 h per gruppo di libri | B, testi forniti da Marco | fatta (manca Hamer 1997) |
| I | Riscrittura delle fasi 4–5 di `docs/piano.md` nel formato dei piani | Opus | high | 1 h | E1–E3, D8 | fatta |

Totale stimato: circa 25 ore di sessione, più la fase V. Dopo A, le fasi B, C, F e H non si
toccano a vicenda e si possono fare in qualunque ordine. E1, E2 ed E3 toccano file diversi e sono
indipendenti fra loro. V tocca le stesse lezioni delle fasi E: non va eseguita insieme a una di
esse. H tocca componenti del simulatore e gli indici delle sezioni, gli stessi file di G2 e G4: va
fatta prima di G1. G4 non tocca `src/components/simulator/` né `src/pages/index.astro` e può
andare in parallelo a G2 e G3.

## Regole comuni a tutte le fasi

- Lavora su un branch `revisione/<lettera della fase>` creato da `main` aggiornato.
- Prima di scrivere o riscrivere prosa leggi `.claude/norms/scrittura-didattica.md`; a fine
  stesura fai la passata di `.claude/norms/scrittura-umana.md` e di `scrittura-parlata.md` §1.
- Le lezioni restano `stato: bozza`: solo Marco le porta a `rivista`.
- Chiusura di ogni fase: spunta la riga nella tabella «Stato», aggiungi sotto la fase le righe
  «Esito» (che cosa è cambiato, che cosa resta, comandi eseguiti) e fai commit. Niente PR: lavori
  da solo, la revisione è la passata sul diff di Claude. Con `pnpm verify && pnpm test:e2e` verdi
  fondi il branch in `main` in locale; il push su `main` pubblica il sito, quindi si fa dopo
  conferma di Marco.

---

## Fase A — Norme in sessione e documenti operativi

**Modello: Sonnet · Effort: high · Durata: 0,5 h · Dipende da: D1, D2**

**Obiettivo.** Ogni sessione locale aperta in `enigma/` riceve le norme di Marco; i documenti
operativi descrivono il progetto com’è oggi.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase A di docs/piano-aggiornamento.md. Leggi prima la fase, le decisioni D1 e D2 nella
tabella in alto e il §1 di docs/revisione-2026-11-03.md. Come modello di CLAUDE.md usa
../python-doesnt-byte/CLAUDE.md (sezione «Norme di contenuto condivise»).
```

**Passi**

1. Crea il symlink: `ln -s ../../norms .claude/norms`. Se D1 = solo locale, aggiungi
   `.claude/norms` e `.claude/launch.json` a `.gitignore`.
2. In `CLAUDE.md` aggiungi in testa la sezione delle norme sul modello di Python Doesn’t Byte:
   importa `@.claude/norms/contenuto.md`; elenca in tabella le altre norme da leggere quando
   servono (`scrittura-didattica.md` prima di scrivere una lezione, `scrittura-tecnica.md` prima di
   un piano o di un README, `scrittura-umana.md` e `scrittura-parlata.md` §1 a fine stesura).
   Aggiungi che il lavoro sui testi si fa solo in locale.
3. Applica D2 alla riga sulle virgolette di `CLAUDE.md`.
4. Aggiorna `README.md`: tabella «Stato» con le fasi 0–3 fatte; togli «Il progetto è agli inizi».
5. In `docs/stato.md` sposta le note sul container cloud in una sezione «Solo nel cloud» e
   aggiungi le note per il locale (Node ≥ 22.23.4, `pnpm exec playwright install chromium`).
6. Esegui i test e2e in locale e annota l’esito in `stato.md`.

**Criteri di accettazione**

```bash
test -f .claude/norms/contenuto.md && echo ok
```

```bash
grep -c '@.claude/norms/contenuto.md' CLAUDE.md
```
deve dare `1`.

```bash
grep -c 'agli inizi' README.md
```
deve dare `0`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-03)**

- Fatto: symlink `.claude/norms` (ignorato da git insieme a `.claude/launch.json`, D1); sezione «Norme di contenuto condivise» in `CLAUDE.md`, con l’import di `contenuto.md`, la tabella delle norme di scrittura e l’avviso che i testi si scrivono solo in locale; regola delle virgolette secondo D2 (« » per le citazioni, “ ” per quelle interne); `README.md` con le fasi 0–3 «fatta» e senza «agli inizi»; `docs/stato.md` diviso in «In locale» e «Solo nel cloud».
- Test: al primo giro quattro e2e fallivano per `networkidle` su due lezioni (dettagli in `docs/stato.md`, «Esito dei test in locale»). Corretta l’attesa in `tests/e2e/lessons.spec.ts`: ogni isola viene portata in vista e si aspetta che si idrati.
- Comandi: `pnpm verify` exit 0 (170 test, 34 pagine); `pnpm test:e2e` exit 0 (99 passati, 3 saltati).
- Resta: le lezioni esistenti usano ancora “ ” per le citazioni; il linter e il testo si allineano alla D2 nelle fasi C ed E.

---

## Fase B — Errori di fatto e incoerenze

**Modello: Sonnet · Effort: high · Durata: 1 h · Dipende da: A, D7**

**Obiettivo.** Nessuna pagina contraddice un’altra pagina o i numeri che riporta; le fonti nel
frontmatter sono solo quelle consultate davvero.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase B di docs/piano-aggiornamento.md. L'elenco esatto delle correzioni è la tabella del
§2 di docs/revisione-2026-11-03.md. Per le fonti segui la risposta a D7. Non riscrivere lo stile
delle frasi che tocchi: lo fanno le fasi E.
```

**Passi**

1. Correggi ogni riga della tabella del §2 della revisione, nell’ordine.
2. Per «Willi/Willy Korn» e per l’attribuzione dell’UKW-D controlla Crypto Museum con `curl`
   (pagine `hist.htm` e `ukwd/index.htm`) e annota in `stato.md` data e pagina consultata.
3. Togli dal frontmatter le fonti non consultate secondo D7, compreso Singh: la copia c’è, ma
   nessuno ha ancora controllato i fatti su di essa. Elencale in `stato.md` sotto
   «Da verificare», con la lezione e il fatto a cui servono: la fase V le rimette.
4. Allinea `period` dell’Enigma I in `src/engine/models.ts`.

**Criteri di accettazione**

```bash
grep -rn 'milioni di miliardi' src/content
```
non deve trovare nulla.

```bash
grep -rhoE 'Will[iy] Korn' src/content | sort -u | wc -l
```
deve dare `1`.

```bash
grep -n 'quindi lo è anche' src/content/glossario.yaml
```
non deve trovare nulla.

```bash
grep -rn 'funzione `step`' src/content
```
non deve trovare nulla.

```bash
pnpm verify
```

**Esito (2026-11-03)**

- Fatto: tutte le righe della tabella del §2 della revisione. Lezione 7: «circa 150 000 miliardi». Lezione 1 allineata alla storia 2 (marina 1926 con la versione dell’Enigma C, Enigma I dell’esercito in servizio nel 1930). Glossario: «involuzione» rimanda alla coniugata, «doppio passo» descrive i due avanzamenti del rotore centrale. Lezione 5 e lezione 8: una frase ciascuna distingue il periodo (16 900) dalle posizioni iniziali distinte (16 926); tolta la nota sulla funzione `step`. Storia 4: didascalia descrittiva, istruzione nella prosa. `period` dell’Enigma I: 1930–1945.
- Verifiche su Crypto Museum (`hist.htm` e `ukwd/index.htm`, 2026-11-03, dettagli in `docs/stato.md`): la pagina scrive «Willy Korn», non «Willi» come ipotizzava la revisione, quindi la grafia unica è «Willy»; l’UKW-D è della Luftwaffe (gennaio 1944), con una variante per la marina. La lezione 6 ora lo attribuisce alla Luftwaffe e cita `crypto-museum-ukw-d`.
- Fonti (D7): tolte dal frontmatter `singh-codici-segreti`, `bauer-decrypted-secrets`, `rejewski-1980`, `hamer-1997`, `batey-dilly`, e dal glossario `hamer-1997` e `rejewski-1980`. Elencate in `docs/stato.md`, «Fonti tolte dal frontmatter», per la fase V.
- Comandi: `pnpm verify` exit 0; `pnpm test:e2e` exit 0 (99 passati, 3 saltati).
- Resta: lo stile delle frasi toccate non è stato riscritto (fasi E). Le frasi che nominano Hamer e Rejewski restano nel testo senza fonte in vista.

---

## Fase C — Linter dei contenuti

**Modello: Sonnet · Effort: high · Durata: 1,5 h · Dipende da: A, D2**

**Obiettivo.** `pnpm lint:content` controlla le norme meccanizzabili e non produce falsi positivi.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase C di docs/piano-aggiornamento.md. Il punto 6 del §1 di
docs/revisione-2026-11-03.md elenca che cosa manca al linter. Le regole sono in
.claude/norms/contenuto.md e ../paideia-os/templates/scrittura-italiana.md.
```

**Passi**

1. Aggiungi a `scripts/content-rules.ts` le regole: `...` invece di `…`; «sennò»; «qual’è» e
   «qual'è»; caratteri matematici in prosa fuori da `<Formula>` (`⁻`, apici e pedici Unicode,
   `×` fra due numeri); separatore delle migliaia diverso dallo spazio non separabile; virgolette
   secondo D2. Ogni regola con il suo test in `scripts/content-rules.test.ts`.
2. Elimina i falsi positivi attuali: un elenco di nomi propri ammessi nei titoli e dopo i due
   punti, in un file di dati che si aggiorna senza toccare il codice; «all’1» come data.
3. Estendi il controllo a `src/i18n/it.json` (valori delle chiavi).
4. Correggi in questa fase solo i casi meccanici (puntini, spazi non separabili nei numeri). Le
   regole che il testo attuale viola in modo non meccanico entrano come avvisi: diventano errori
   alla fine delle fasi E.

**Criteri di accettazione**

```bash
pnpm lint:content
```
nessun errore, e nessun avviso su nomi propri o date.

```bash
pnpm test
```

**Esito (2026-11-03)**

- Fatto: in `scripts/content-rules.ts` le regole `puntini-sospensione`, `parola-vietata` («sennò»), `qual-e`, `migliaia-non-separabili`, `caporali-annidati` (errori) e `virgolette-fuori-caporali`, `matematica-unicode` (avvisi), ciascuna con il suo test in `scripts/content-rules.test.ts`. Il controllo copre anche i valori di `src/i18n/it.json` (`lintJson`).
- Falsi positivi: i nomi propri ammessi stanno in `scripts/nomi-propri.txt` (una voce per riga, anche di più parole, `#` per i commenti), si aggiornano senza toccare il codice e valgono per `maiuscole-titolo` e `maiuscola-dopo-due-punti`. Un numero dopo un articolo elisso («dal 31 all’1») non è più una quantità.
- Corretti i soli casi meccanici: 17 spazi normali diventati spazi non separabili (U+00A0) in cinque file di `src/content/`. Puntini, «sennò» e «qual’è» non comparivano.
- Scelte da conoscere: in `it.json` `numero-in-cifre` si applica solo alle frasi (stringhe con un punto), perché le etichette brevi come «1 lettera» o «Spine da 1 a 5» sono contatori e restano in cifre. `virgolette-fuori-caporali` segnala ogni “ ” fuori da « »: non distingue una citazione da un termine o da un’etichetta dell’interfaccia, perciò resta un avviso.
- Avvisi che restano (25), da risolvere nelle fasi E e F, poi da promuovere a errori: 14 `virgolette-fuori-caporali` (lezioni 2, 4, 6, 7, 8, storia 1 e 3, due stringhe di `it.json`), 10 `matematica-unicode` (lezioni 4–7, storia 2, due stringhe di `it.json`), 1 `numero-in-cifre` (`it.json:55`, «10 cavi»). Nessun avviso su nomi propri o date.
- Non coperto: `src/lib/format.ts` produce a runtime «1,07 × 10²³» (esponenti Unicode), fuori dalla portata del linter; è un caso per la fase F.
- Comandi: `pnpm lint:content` 0 errori, 25 avvisi; `pnpm verify` exit 0 (187 test, 34 pagine); `pnpm test:e2e` exit 0.

---

## Fase D — Componenti dello scheletro della lezione

**Modello: Opus · Effort: high · Durata: 1,5 h · Dipende da: A, D3**

Se D3 = no, la fase si riduce al componente `Citazione` del piano originale (30 minuti, Sonnet).

**Obiettivo.** Le lezioni hanno i mattoni per lo scheletro di `scrittura-didattica.md` §7 e per
la domanda di previsione prima di un componente interattivo.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase D di docs/piano-aggiornamento.md, secondo la decisione D3. Leggi
.claude/norms/scrittura-didattica.md §6–7 e, come repertorio, i callout di Python Doesn't Byte
(../python-doesnt-byte, cerca :::learn e :::nutshell) e
../paideia-os/templates/lezione-docusaurus.md. Adatta, non copiare: qui i componenti sono Astro e
React, con i token di src/styles/tokens.css.
```

**Passi**

1. Progetta e scrivi i componenti: apertura con citazione (`Citazione` con fonte e pagina, già
   prevista dal piano originale), prerequisiti e obiettivi, riepilogo, previsione (lo studente
   scrive o sceglie la risposta, poi il componente la confronta con l’esito).
2. Usa i componenti in una lezione sola, la 5, come prova; il resto lo fanno le fasi E.
3. Aggiungi i test e2e con axe per i nuovi componenti.
4. Documenta in `CLAUDE.md` quando si usa ciascun componente.

**Criteri di accettazione**

```bash
pnpm verify && pnpm test:e2e
```

```bash
grep -c '<Previsione' src/content/lezioni/it/05-il-passo-e-il-doppio-passo.mdx
```
almeno `1`.

**Esito (2026-11-03)**

- Fatto: in `src/components/lesson/` i componenti `Citazione` (fonte obbligatoria da `fonti.yaml`, pagina, `autore` per il «citato in», `tradotta`, `lingua`), `Prerequisiti`, `Obiettivi` e `Riepilogo` (riquadri con un `h2`, sul `Riquadro` comune; prerequisiti e obiettivi di seguito formano un riquadro solo), `Previsione` con `Risposta` ed `Esito`. La previsione è un componente Astro con uno script senza dipendenze, non un’isola React: domanda, commenti ed esito stanno nel corpo MDX e passano dal linter dei contenuti. A scelta o libera (`libera`: maiuscole, spazi e punteggiatura non contano); dopo il confronto blocca la risposta, dice «La tua previsione» ed «Esito», mostra il commento della risposta data e l’`Esito`; «Ricomincia» rimette tutto com’era. Stringhe in `it.json` (`lesson.prereq`, `lesson.goals`, `lesson.summary`, `lesson.quote.*`, `lesson.predict.*`).
- Lezione 5 come prova: citazione d’apertura scelta da Marco (Crypto Museum, il contachilometri, nuova voce `crypto-museum-funzionamento`), prerequisiti, obiettivi, riepilogo e due previsioni: lettere nelle finestrelle dopo tre tasti da ADU (libera, prima dell’animazione, con i commenti alle risposte AEX, BEX, AFX) e lunghezza del ciclo (a scelta). La spiegazione del doppio passo ora viene dopo l’animazione; tolto «C’è però un dettaglio.»; le due formule del periodo toccate sono passate a `<Formula>`. Il resto dello stile della lezione resta alla fase E2.
- Test: tre e2e nuovi in `tests/e2e/lessons.spec.ts` (scheletro della lezione, previsione libera, previsione a scelta con axe sullo stato rivelato, in tema chiaro e scuro). Verificato anche nel browser a desktop e a 375 px.
- Documentazione: sezione «Lo scheletro della lezione» in `CLAUDE.md`, con quando si usa ciascun componente.
- Comandi: `pnpm verify` exit 0 (187 test, `lint:content` 0 errori e 24 avvisi, uno in meno di prima); `pnpm test:e2e` exit 0 (105 passati, 3 saltati); `grep -c '<Previsione' …05-il-passo-e-il-doppio-passo.mdx` dà 2.
- Per le fasi E: la citazione d’apertura di ogni lezione la sceglie Marco fra tre proposte vere, con la fonte consultata; conviene raccoglierle tutte all’inizio della sessione. Le previsioni vanno prima della spiegazione, non dopo: nella lezione 5 la sezione «Il doppio passo» è stata spostata sotto l’animazione per questo.

---

## Fase E1 — Riscrittura «Come funziona» 1–4

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: B, C, D**

**Obiettivo.** Le lezioni 1–4 rispettano le norme di scrittura e hanno ciascuna una tesi
didattica.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase E1 di docs/piano-aggiornamento.md. Leggi .claude/norms/scrittura-didattica.md
prima di scrivere; i rilievi per lezione sono nel §3 di docs/revisione-2026-11-03.md. Voce di
riferimento: i campioni in .claude/norms/campioni/.
```

**Passi**

1. Per ogni lezione scrivi la tesi didattica in cinque righe (didattica §1) in un commento MDX in
   testa al file; se non sta in cinque righe, proponi a Marco una divisione invece di scriverla.
2. Riscrivi applicando i rilievi del §3 della revisione e i pattern ricorrenti (rimandi alla
   crittoanalisi, «dettaglio», intensificatori, matematica con `<Formula>`).
3. Dove c’è un componente interattivo, metti la previsione prima del risultato (fase D).
4. Togli la ripetizione fra lezione 2 e storia 1: il paragrafo sugli inventori resta in storia 1.
5. Rimandi alla crittoanalisi: tienili solo dove dicono che cosa arriverà e lo dicono una volta.
6. Fai la passata finale di `scrittura-umana.md` e `scrittura-parlata.md` frase per frase.

**Criteri di accettazione**

```bash
grep -rnE 'dettaglio|esattamente|fondamental|geniale' src/content/lezioni/it/0[1-4]-*.mdx
```
non deve trovare nulla.

```bash
grep -rn '[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ᵏⁿ]' src/content/lezioni/it/0[1-4]-*.mdx
```
non deve trovare nulla.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-03)**

- Tesi: ogni lezione ha la tesi didattica in cinque righe in un commento MDX in testa al file; nessuna ha richiesto una divisione.
- Scheletro: citazione d’apertura scelta da Marco fra tre proposte con la fonte aperta e la pagina controllata (lezione 1 e 3: Turing, *Treatise on the Enigma*, cap. 1, p. 1; lezione 2: Kerckhoffs 1883, p. 24; lezione 4: Crypto Museum, sezione «Rotor wiring», dove «questa lettera» è diventato «la lettera» per non lasciare un pronome senza referente). Obiettivi e riepilogo in tutte; prerequisiti dalla lezione 2 in poi (la 1 non ne ha).
- Previsioni, sette in tutto, ciascuna su un errore che qualcuno fa davvero: lezione 1, dieci A da AAA (BDZGOWCXLT) e FQGAHW battuto da AAB (KVAOJQ, non ENIGMA); lezione 2, il disco mescolato che ruota (EKMFLG, non EFGHIJ); lezione 3, la lampada A che non può accendersi con nessun cablaggio, e la cifratura in AAB e non in AAA; lezione 4, il rotore I in posizione B (J, non la K del disco) e posizione e anello entrambi su B (E). Esiti calcolati con il motore e, per la lezione 1, controllati nel simulatore.
- Lezione 1: era un’introduzione senza tesi; ora fa provare la cifratura e la decifratura in due mini simulatori e definisce la **chiave**. Tolte la telecronaca della struttura e la chiusa da trailer.
- Lezione 2: tolto il paragrafo sugli inventori (resta in storia 1, con un rimando), con «geniale», «esattamente» e la chiusa della `Nota`. Il testo dice dove il disco differisce dal rotore e rimanda il conto alla lezione 4, che lo fa. Definiti «polialfabetico» e «periodo». Nuova fonte `svetonio-divus-iulius` per il cifrario di Cesare.
- Lezione 3: tolta la `Nota` che ripeteva la prosa; «fondamentali» sostituito dalle due proprietà dimostrate con il deviatore; definita la ruota d’ingresso.
- Lezione 4: tolti «il cuore di Enigma», la catena di «si», il titolo-domanda della `Nota` e il «coniugio» anticipato: l’approfondimento scrive il rotore con `<Formula>` e rimanda il nome alla lezione 8. Introdotta la carcassa come riferimento fisso, che spiega lo scarto fra disco e rotore.
- Fonti nuove in `fonti.yaml`: `turing-treatise`, `kerckhoffs-1883`, `svetonio-divus-iulius`; aggiornata la nota di `crypto-museum-funzionamento`.
- Linter: il corpo di `<Citazione>` conta come citazione, quindi le “ ” al suo interno non danno più l’avviso (un test nuovo in `scripts/content-rules.test.ts`). e2e: la lezione 1 entra nel giro di axe.
- Comandi: i due `grep` dei criteri non trovano nulla; `pnpm verify` exit 0 (188 test, `lint:content` 0 errori e 21 avvisi, nessuno nelle lezioni 1–4); `pnpm test:e2e` exit 0 (107 passati, 3 saltati).
- Per E2: la lezione 6 ripete l’esercizio di «Ricomincia» della lezione 1 e le due proprietà della lezione 3; conviene che le riprenda come fatti noti e spieghi solo il ruolo del riflettore. La lezione 8 è ora l’unica a definire il coniugio, e la lezione 4 le rimanda il nome. Il prerequisito della lezione 5 sulla lezione 4 usa «la lettera nella finestrella dice».
- Per V: restano da verificare su un testo al-Kindi (IX secolo), la data e la forma del disco di Alberti e la batteria da 4,5 volt.

---

## Fase E2 — Riscrittura «Come funziona» 5–8

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: B, C, D, D4**

**Obiettivo.** Come E1, per le lezioni 5–8; se D4 = sì, la lezione 7 diventa due lezioni e la 8
scala di numero.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase E2 di docs/piano-aggiornamento.md, secondo la decisione D4. Leggi
.claude/norms/scrittura-didattica.md prima di scrivere; i rilievi per lezione sono nel §3 di
docs/revisione-2026-11-03.md.
```

**Passi**

1. Gli stessi passi 1, 2, 3, 5 e 6 di E1.
2. Se D4 = sì, dividi la lezione 7, rinumera `ordine` e aggiorna i link interni; il crawler
   `tests/e2e/links.spec.ts` deve restare verde.
3. Lezione 8: definisci il principio di Kerckhoffs dove compare; aggiungi la spiegazione delle
   cifre diverse per lo spazio delle chiavi promessa dal piano originale, solo con fonti
   consultate (D7).
4. Lezione 7: trova la fonte della misconcezione «l’Uhr rende Enigma non reciproca» o togli il
   «si legge a volte».

**Criteri di accettazione**

```bash
grep -rnE 'dettaglio|esattamente|curiosamente|proprio' src/content/lezioni/it/0[5-9]-*.mdx
```
non deve trovare nulla.

```bash
grep -rn '[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ᵏⁿ]' src/content/lezioni/it/0[5-9]-*.mdx
```
non deve trovare nulla.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-03)**

- Divisioni: secondo D4 la lezione 7 è diventata «Il pannello a spine» (7) e «L’Uhr» (8). Anche la tesi della vecchia lezione 8 non stava in cinque righe; su proposta accettata da Marco è diventata «La matematica di Enigma» (9: permutazioni, cicli, coniugio, involuzioni) e «Quante chiavi» (10: principio di Kerckhoffs, fattori, cifre diverse, chiavi e sicurezza). Ogni lezione ha la tesi in cinque righe in un commento MDX in testa al file.
- Scheletro: citazioni d’apertura scelte da Marco fra tre proposte con la fonte aperta (6: Rejewski 1980, p. 3 della trascrizione di CryptoCellar; 7: Crypto Museum, «The Steckerbrett»; 8: Crypto Museum, pagina dell’Uhr; 9: Rejewski 1980, p. 1; 10: Crypto Museum, «Cipher strength»). Prerequisiti, obiettivi e riepilogo in tutte; la 5 aveva già lo scheletro dalla fase D.
- Previsioni nuove, cinque, ciascuna su un errore che qualcuno fa davvero: lezione 6, la A da AAA non accende la Y del riflettore ma la B; lezione 7, il massimo delle configurazioni è a 11 cavi, non a 13; lezione 8, la macchina resta reciproca con l’Uhr in 03 (WETTER → CLSXQB → WETTER); lezione 9, in posizione B il ciclo (AELTPHQXRU) diventa (DKSOGPWQTZ), un posto indietro e non avanti; lezione 10, Singh e Crypto Museum non sbagliano, partono da ipotesi diverse. Esiti calcolati con il motore.
- Lezione 5: tolti «proprio» e «in dettaglio», matematica dell’approfondimento in `<Formula>`, il 16 926 rimanda ora a «Quante chiavi».
- Lezione 6: riprende reciprocità e assenza di punti fissi dalla lezione 3 come fatti noti e spiega il ruolo del riflettore: le coppie della macchina sono quelle del riflettore viste attraverso i rotori, e cambiano a ogni tasto (tabella delle coppie in AAB e AAC). La debolezza non è più annunciata: WETTER fatta scorrere sotto un cifrato vero scarta cinque posizioni su dieci. Tolti «Sembra un dettaglio», «comodità enorme», l’elenco di negazioni, la `Nota` e l’approfondimento con la matematica in Unicode, che ripetevano la lezione 9.
- Lezione 7: il percorso della A con i dieci cavi (A → Z, Z → U in AAB, lampada U), il conteggio con `<Formula>` nel testo invece che nell’approfondimento. Verificati su Crypto Museum (nuova voce `crypto-museum-steckerbrett`) il brevetto della Reichswehr, la prova del 14 febbraio 1928 e il limite pratico di dieci cavi. Tolti «proprio», «curiosamente», «Ecco la stessa macchina», il conteggio che «dice».
- Lezione 8: il «si legge a volte» è sostituito dalla previsione sulla reciprocità, perché la misconcezione nasce dalla lezione stessa (l’Uhr in 03 non scambia a coppie). Crypto Museum la registra («It is sometimes suggested…») senza dire chi la sostiene. Spine con la notazione del componente (1a, 1b), non a1 come Crypto Museum. Nuova voce `crypto-museum-uhr`.
- Lezione 9: tolti «che sembra un dettaglio» e la chiusa da articolo; i numeri puri non sono più in `<Formula>`; al posto del rimando vuoto, che cosa Rejewski ricavò dalla struttura in cicli (le lunghezze non dipendono dal pannello), con Rejewski e Singh.
- Lezione 10: principio di Kerckhoffs definito dove compare, con la citazione a p. 12. Le cifre diverse: Singh (edizione per ragazzi di «The Code Book», Delacorte 2003, cap. 3, dall’epub di Marco) conta tre rotori, sei cavi e niente anelli, circa 10¹⁶; Crypto Museum cinque rotori, dieci cavi e due anelli, circa 1,07 × 10²³; lo studio NSA di Miller, citato da Crypto Museum, suppone ignoti i cablaggi. Il calcolatore riproduce le prime due.
- Link e fonti: aggiornati glossario (`chiave` → quante-chiavi, `pannello a spine`, `Uhr`), storia 2 e test e2e. `rejewski-1980` ha ora l’URL della traduzione consultata; nuove voci `crypto-museum-steckerbrett`, `crypto-museum-uhr`, `singh-code-book-ragazzi`. Nuovo test e2e sulla reciprocità con l’Uhr.
- Comandi: i due `grep` dei criteri, estesi a `10-*.mdx`, non trovano nulla; `pnpm verify` exit 0 (188 test, `lint:content` 0 errori e 9 avvisi, nessuno nelle lezioni 5–10); `pnpm test:e2e` exit 0 (113 passati, 3 saltati).
- Restano: il vecchio indirizzo `come-funziona/il-pannello-a-spine-e-l-uhr/` non ha un redirect. In Crypto Museum, sezione «Key space», 685 518 560 è un refuso per 686 518 560: la lezione non usa quel numero. Per V: Singh è citato dall’edizione per ragazzi senza pagina; se Marco preferisce l’edizione Rizzoli già in `fonti.yaml`, il conto va ritrovato lì.

---

## Fase E3 — Riscrittura Storia 1–4 e glossario

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: B, C, D**

**Obiettivo.** Le lezioni di storia e il glossario rispettano le norme; il glossario copre i
termini usati nelle lezioni.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase E3 di docs/piano-aggiornamento.md. Leggi .claude/norms/scrittura-didattica.md
prima di scrivere; i rilievi sono nel §3 di docs/revisione-2026-11-03.md, sezioni «Storia» e
«Glossario».
```

**Passi**

1. Riscrivi le lezioni di storia applicando i rilievi del §3 (aperture a massima, antitesi in coda,
   titoli-slogan, «dettaglio», rimandi alla crittoanalisi).
2. Storia 4: didascalia del simulatore descrittiva, istruzione nella prosa.
3. Glossario: aggiungi nottolino, deviatore, coniugio, principio di Kerckhoffs, Kenngruppenbuch;
   usa «nottolino» ovunque al posto di «leva»; scegli una forma per le definizioni e tienila per
   tutte le voci.
4. Passata finale come in E1.

**Criteri di accettazione**

```bash
grep -rnE 'dettaglio|esattamente|Più rotori, più chiavi' src/content/lezioni/it/storia
```
non deve trovare nulla.

```bash
grep -c 'id: nottolino' src/content/glossario.yaml
```
deve dare `1`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-03)**

- Tesi: ogni lezione di storia ha la tesi didattica in cinque righe in un commento MDX in testa al file; nessuna ha richiesto una divisione. Scheletro secondo D3: obiettivi dopo l’aggancio e riepilogo in fondo, niente citazione d’apertura né prerequisiti.
- Storia 1: l’apertura afferma il fatto (Enigma era un prodotto in catalogo) invece della negazione-vetrina; l’antitesi «comodità… regalo» è diventata il rimando concreto alla lezione sul riflettore (scartare le posizioni di una parola sospetta). Tolta la `Nota` sul pannello, che ripeteva didascalia e prosa: il fatto sta ora nella prosa. Tolte la massima «Una macchina in vendita si può comprare, e quindi studiare» e «come vedremo». «Leve» diventa «nottolini». Il paragrafo sugli inventori resta qui (E1 l’ha tolto dalla lezione 2).
- Storia 2: sezioni in ordine cronologico (i rotori IV e V vengono prima di «tre su otto», che prima li anticipava); il titolo-slogan è diventato «Da tre a otto rotori», con i conti 6, 60 e 336 in `<Formula>`. «Una novità che ne cambiava la sicurezza» sostituito dal fatto. Il rimando alla crittoanalisi su Shark è sostituito da ciò che dice Crypto Museum: nove mesi, fino alla cattura di nuovi fogli chiave.
- Storia 3: tolta la massima d’apertura, «la stessa identica sequenza» e il frammento «Più sotto, un avvertimento». L’approfondimento non rimanda più alla sezione che manca: dice che cosa davano le coppie di lettere dell’indicatore doppio (tre permutazioni senza conoscere il testo) e rimanda alla lezione 9, che spiega perché i loro cicli non dipendono dal pannello. La lezione 9, a sua volta, rimanda alla crittoanalisi per come Rejewski costruì quelle permutazioni: storia 3 ora ne dà l’origine. Aggiunta `rejewski-1980` al frontmatter, consultata in E2. Traduzioni dal tedesco tra « ».
- Storia 4: tolti «grazie a un dettaglio», «esattamente» e il frammento «un punto debole evidente». Il simulatore è preceduto dall’istruzione (premi la L una ventina di volte) e seguito dall’esito, con il rimando alla lezione sul riflettore; la didascalia descrive la macchina e avverte che i rotori della Regia Marina avevano un altro cablaggio. Tolto il «ma non…» in apertura.
- Glossario: forma unica, scritta in testa al file (prima frase da vocabolario senza articolo, poi frasi intere con il soggetto). Corrette le voci che cominciavano con l’articolo o non avevano verbo («chiave», «chiave del giorno», «cillies», «ordine dei rotori», «posizione iniziale», «testo cifrato», «testo in chiaro»). «Leva» diventa «nottolino» in «doppio passo» e «tacca». Voci nuove: le cinque del piano (nottolino, deviatore, coniugio, principio di Kerckhoffs, Kenngruppenbuch) e i termini definiti in grassetto nelle lezioni che mancavano (analisi delle frequenze, carcassa, ciclo, cifrario polialfabetico, periodo, punto fisso, reciprocità, sostituzione monoalfabetica, spazio delle chiavi). Ogni voce nuova riprende la definizione della lezione a cui rimanda. Restano fuori di proposito «scambiatore» (solo il modello della lezione 3), «composizione», «inversa» e «identità» (matematica generale).
- Verifiche su Crypto Museum (pagina della M4), annotate in `docs/stato.md`: *Kenngruppenbuch* del 1941 di 120 pagine, M4 del 1° febbraio 1942, Shark illeggibile per nove mesi.
- Comandi: il `grep` del primo criterio non trova nulla; il secondo dà `1`; `pnpm verify` exit 0 (188 test, `lint:content` 0 errori e 5 avvisi, tutti in `it.json`, per la fase F); `pnpm test:e2e` exit 0 (113 passati, 3 saltati).
- Restano: le voci del glossario senza termine tedesco scrivono ancora «—», che la fase F deve nascondere; quasi tutti i fatti della storia 4 (Mavis Lever, Matapan, biografia di Knox) poggiano su Crypto Museum in attesa di `batey-dilly` (fase V). Gli inglesi «changeover switch» (deviatore) e «pawl» (nottolino) sono traduzioni tecniche, non termini trovati in una fonte su Enigma.

---

## Fase F — Interfaccia e i18n

**Modello: Sonnet · Effort: high · Durata: 1 h · Dipende da: A, C, D5**

**Obiettivo.** Tutti i testi dell’interfaccia stanno in `it.json` e rispettano le norme; il menu
porta solo a pagine con contenuto.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase F di docs/piano-aggiornamento.md. I rilievi sono nel §4 di
docs/revisione-2026-11-03.md. Non cambiare il layout della home: lo fa la fase G; qui sposti e
correggi i testi.
```

**Passi**

1. Correggi le stringhe della tabella del §4 della revisione.
2. Sposta in `it.json` i testi scritti nelle pagine (`index.astro`, `come-funziona/index.astro`,
   `crittoanalisi`, `docenti`, `fonti`) e usa `t()`.
3. Riscrivi i testi della home: niente verbi da pulsante, niente «fedele» senza oggetto, aggiungi
   la Storia.
4. Applica D5 al menu; aggiungi il Glossario al menu.
5. Glossario: non mostrare «DE —» per le voci senza termine tedesco.

**Criteri di accettazione**

```bash
grep -nE "title: '|text: '|intro=\"" src/pages/index.astro src/pages/*/index.astro
```
non deve trovare nulla.

```bash
pnpm lint:content && pnpm verify && pnpm test:e2e
```

**Esito (2026-11-03)**

- Fatto: stringhe del §4 corrette in `it.json` («dieci cavi», «multiple di quattro», «una lettera», «un cavo», «Corretto.», `ex.intro` e `sheet.intro` senza la formula ripetuta, `ex.sheetsLink` senza la domanda retorica). Testi di `index`, `come-funziona/index`, `crittoanalisi`, `docenti` e `fonti` spostati in `it.json` e letti con `t()`; il `grep` di accettazione non trova nulla. Home riscritta: titolo «La macchina Enigma», descrizione di 15 modelli e dei tre percorsi, quattro schede senza verbi da pulsante (Simulatore, Come funziona, Storia, Esercizi). Menu: via Crittoanalisi e Docenti (D5; le pagine restano raggiungibili dall’indirizzo), dentro Glossario. Glossario: `tedesco` e `inglese` sono opzionali nello schema, tolti i «—» da `glossario.yaml`, la riga «DE · EN» compare solo con almeno un termine.
- Unico tocco al layout della home: la griglia passa da tre a due colonne perché le schede sono quattro; il resto è della fase G. L’occhiello resta in maiuscolo con la classe `uppercase`, e il testo in `it.json` è in minuscolo normale.
- Comandi: `pnpm lint:content` 0 errori, 4 avvisi; `pnpm verify` exit 0; `pnpm test:e2e` exit 0 (113 passati, 3 saltati). Negli e2e `Corretto!` diventa `Corretto.`.
- Resta: i quattro avvisi di `lint:content` su `it.json` (“ ” attorno al testo del messaggio in `ex.solution.plain` e `sheet.solutions.message`; `×` nelle soluzioni di `ex.spazio.*`): sono segnaposto con testo generato e non si possono scrivere con `<Formula>` in una stringa JSON, da decidere. Il messaggio di errore dell’engine in `src/engine/config.ts:146` dice ancora «esattamente 10 cavi» ed è controllato da un e2e: non è in `it.json`, non l’ho toccato. Le chiavi `nav.cryptanalysis` e `nav.teachers` non sono più usate dal menu e servono quando le due pagine avranno contenuto.

---

## Fase G — Design

D6 rivista il 2026-11-03: l’identità visiva si fa ora. La fase G si divide in cinque sottofasi.
G0 decide la forma su un canvas di Claude Design; G1 e G2 la costruiscono; G3 e G4 la estendono a
mobile e al resto del sito.

Vincoli decisi da Marco il 2026-11-03, validi per tutte le sottofasi:

- la home del sito è il simulatore: si apre il sito e la macchina è pronta a cifrare, senza
  passaggi intermedi;
- a partire da 1280×720 (LIM e portatili dell’aula) tutto il simulatore sta nella schermata,
  senza scorrere la pagina;
- su mobile una versione ridotta, con un avviso che rimanda al desktop per l’esperienza completa;
- animazioni che accompagnano ogni tasto, mai a costo della velocità: digitare in fretta non
  perde lettere e non accumula ritardo;
- nessun ornamento da modello generico (bordi colorati a sinistra delle schede, gradienti di
  riempimento, schede tutte uguali): ogni scelta visiva nasce da Enigma e dalla didattica.

Riferimento: il simulatore originale (`marcofarina/EnigmaMachine`) sta in una schermata. Fatto
verificato il 2026-11-03: `/simulatore/` oggi è alto 2704 px a 1024×768, tre schermate e mezza.

---

## Fase G0 — Direzione visiva sul canvas

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: F, D6**

**Obiettivo.** Marco ha scelto una direzione visiva guardando tre proposte della schermata del
simulatore; la direzione è descritta in `docs/design.md` con abbastanza precisione da costruirla
senza riaprire il canvas.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase G0 di docs/piano-aggiornamento.md. Carica la skill frontend-design prima di
progettare. Avvia il sito con il server «astro-dev» di .claude/launch.json per gli screenshot
«prima».
```

**Passi**

1. Salva gli screenshot «prima» in `docs/screenshot/prima/`: home, `/simulatore/`, lezione 5
   (`il-passo-e-il-doppio-passo`), lezione 8 (`la-matematica-di-enigma`), ciascuna a 1280×720 e a
   375 px, in tema chiaro; home e simulatore anche in scuro.
2. Fai l’inventario del simulatore attuale: ogni pezzo di `Simulator.tsx` (configurazione,
   finestre, lampade, tastiera, nastro, traccia, schema, testo da digitare, link condivisibile,
   modalità LIM, avvisi) con la sua funzione didattica. Nessun pezzo sparisce senza una decisione
   di Marco scritta in `docs/design.md`.
3. Crea un canvas di Claude Design (Artifact di tipo «Design») con tre direzioni della stessa
   schermata a 1280×720, ognuna con la sua artboard a 375 px. Spunti di partenza, da superare:
   la macchina come oggetto materiale; il circuito come protagonista; un linguaggio editoriale da
   libro. Ogni direzione mostra almeno tre animazioni: tasto → lampada, scatto dei rotori, percorso
   del segnale. Usa lettere e configurazioni vere, non testo segnaposto.
4. Fai scegliere Marco (una direzione, o una combinazione dichiarata). Itera sul canvas finché
   non approva.
5. Scrivi `docs/design.md`: link al canvas; principi della direzione scelta; palette chiara,
   scura e LIM come valori pronti per `tokens.css`; font con licenza OFL e pesi usati; scala
   tipografica; griglia della schermata a 1280×720 e a 1920×1080 con la posizione di ogni pezzo
   dell’inventario; catalogo delle animazioni con durata, curva e comportamento con
   `prefers-reduced-motion`; regole per tabelle, blocchi di codice, intestazione e pagine di
   lezione.

**Criteri di accettazione**

```bash
ls docs/screenshot/prima/*.png | wc -l
```
almeno `12`.

```bash
grep -cE '^## ' docs/design.md && grep -c 'claude.ai/' docs/design.md
```
il primo almeno `7`, il secondo almeno `1`.

La riga «Esito» di G0 dice quale direzione ha scelto Marco e in che data.

**Esito** (2026-11-04)

- Direzione scelta da Marco il 2026-11-04: «Bachelite con il foglio», cioè i materiali della
  direzione A, lo schema a tutta altezza con tutti i fili della direzione B e il foglio della
  chiave e del messaggio della direzione C. Descritta in `docs/design.md`, con il link al canvas.
- Il pannello a spine diventa un pannello ancorato, non modale, aperto dall’intestazione
  (richiesta di Marco: una finestra modale; la variante non modale lascia lo schema scoperto
  mentre si collegano i cavi, e Marco l’ha accettata).
- Screenshot «prima» in `docs/screenshot/prima/` (12 file), presi con
  `pnpm exec playwright screenshot` sul server di sviluppo: includono la barra degli strumenti di
  sviluppo di Astro. Gli screenshot «dopo» vanno presi allo stesso modo, perché si confrontino.
- Restano da confermare con Marco i tre punti in fondo a `docs/design.md` (simulatore scuro anche
  nel tema chiaro, nota sull’annullare spostata nella lezione 1, chiavi storiche solo dopo la
  fase V). G1 può partire: nessuno dei tre cambia token o stili globali.
- Comandi eseguiti: `ls docs/screenshot/prima/*.png | wc -l` → `12`;
  `grep -cE '^## ' docs/design.md` → `10`; `grep -c 'claude.ai/' docs/design.md` → `1`.
- `pnpm verify && pnpm test:e2e` verdi il 2026-11-04. Fatto verificato quel giorno: con il server
  «astro-dev» acceso sulla porta 4321, Playwright lo riusa (`reuseExistingServer`) al posto della
  build e 16 test falliscono per gli `h1` della barra di Astro. Prima di `pnpm test:e2e` ferma il
  server di sviluppo.

---

## Fase G1 — Design system nel codice

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: G0, H**

**Obiettivo.** Token, font e stili globali del sito seguono `docs/design.md`; i difetti del §5
della revisione sono corretti.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase G1 di docs/piano-aggiornamento.md. La direzione visiva è in docs/design.md, i
difetti nel §5 di docs/revisione-2026-11-03.md. Carica la skill frontend-design. Avvia il sito con
il server «astro-dev» di .claude/launch.json e verifica ogni modifica nel browser, a desktop e a
375 px, in tema chiaro e scuro.
```

**Passi**

1. `tokens.css`: palette chiara, scura e LIM, famiglie di font, scala tipografica, durate e curve
   delle animazioni come custom property. Font in locale (`woff2` in `public/fonts/`) con la
   licenza accanto; nessuna richiesta a server esterni.
2. `global.css`: tabelle in `.prose-it`, blocchi di codice con il tema di Shiki chiaro e scuro
   legato a `data-theme`, margini e padding; numeri a gruppi che non si spezzano a fine riga.
3. `SiteHeader.astro`, `SiteFooter.astro`, `ThemeToggle.astro` nel nuovo linguaggio; a 375 px
   l’intestazione sta su una riga e ogni bersaglio misura almeno 44 px.
4. Nessun colore letterale fuori da `tokens.css` e `print.css`.

**Criteri di accettazione**

```bash
grep -c 'table' src/styles/global.css
```
almeno `1`.

```bash
grep -rnoE "#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(" src --include='*.css' --include='*.tsx' --include='*.astro' | grep -vE 'tokens\.css|print\.css' | wc -l
```
`0`.

```bash
pnpm verify && pnpm test:e2e
```

Controllo visivo: la tabella della lezione 5 si legge come tabella; i blocchi di codice della
lezione 8 hanno margini e seguono il tema; a 375 px l’intestazione sta su una riga.

**Esito** (2026-11-04)

- `tokens.css`: i materiali di `docs/design.md` (macchina, foglio chiaro, foglio scuro, LIM), le
  variabili `--code-*` dei blocchi di codice, la scala tipografica `--type-*` e il catalogo delle
  animazioni (`--ease-snap`, `--dur-*`, `--delay-*`). I nomi semantici `--color-*` usati dai
  componenti restano e puntano ai materiali: il simulatore e le pagine non ancora rifatti
  prendono la nuova palette senza essere toccati. La classe `.machine` riporta i nomi semantici
  sui colori della macchina (fuoco ambra), `.machine-paint` dà la vernice raggrinzita.
- Font: Archivo variabile (`wght` e `wdth`, tondo e corsivo), Courier Prime 400 e 700, Saira
  Stencil One, in `woff2` latino e latino esteso presi dai pacchetti Fontsource 5.3.0, con
  `OFL.txt` accanto. Stanno in `src/assets/fonts/` e non in `public/fonts/` come diceva il passo
  1: in un `url()` del CSS Vite non aggiunge `/enigma/` ai file di `public/`, e in sviluppo
  davano 404. Importati dal CSS escono in `dist/_astro/` con l’hash e il prefisso giusto.
- `global.css`: tabelle come tavola stampata (filetti in `--print-red`, intestazione a 13 px,
  scorrimento orizzontale sugli schermi stretti); blocchi di codice con fondo, padding 16 × 20 e
  margine 24, colori da un tema di Shiki fatto di sole variabili (`temaCodice` in
  `astro.config.mjs`) che segue `data-theme`; `.katex` non va a capo. I link sono inchiostro con
  la sottolineatura in rosso tenue, piena al passaggio.
- Intestazione nel linguaggio della macchina in entrambi i temi. A 375 px marchio e pulsante
  «Menu» da 44 px su una riga; il menu è un foglio sotto la barra con il pulsante del tema,
  si chiude con Esc (il fuoco torna al pulsante), con un clic fuori o allargando la finestra.
  Piè di pagina su foglio, link da 44 px. Chiavi nuove in `it.json`: `nav.menu`, `theme.label`.
- Test: in `smoke.spec.ts` il test del tema apre il menu su mobile; nuovo test dell’intestazione
  a 375 px (una riga, bersaglio da 44 px, fuoco nel menu, Esc).
- Il §5 della revisione: tabelle, codice, numeri spezzati e intestazione a 375 px corretti. La
  home resta della fase G2, i font sono fatti. Verificato nel browser a 1280×720 e a 375 px, in
  chiaro e in scuro: lezione 5 (`il-passo-e-il-doppio-passo`), lezione 9
  (`la-matematica-di-enigma`, che il controllo visivo chiama ancora «lezione 8» dalla numerazione
  prima di E2), lezione 10 (nessuna formula oltre i 375 px), home e simulatore.
- Resta per G4: i componenti della lezione hanno ancora la forma vecchia (bordo rosso a sinistra
  di `Citazione`, etichette in maiuscolo di `Prerequisiti`, `Obiettivi`, `Previsione`, riquadro
  della bozza). Da confermare con Marco: «Rainbow Bits» resta accanto al marchio solo da 1024 px
  in su.
- Comandi: `grep -c 'table' src/styles/global.css` → `1`; il `grep` dei colori letterali → `0`;
  `pnpm verify` exit 0 (188 unit test); `pnpm test:e2e` exit 0 (115 passati, 3 saltati).
  Fatto verificato il 2026-11-04: con la macchina sotto carico (un gioco al 74 % di CPU, load
  oltre 20) i primi test degli esercizi scadono sui 5 s di `toBeVisible` anche su `main`, che nelle
  stesse condizioni ne ha fatti fallire 35. Se succede, rilanciare a macchina scarica.

---

## Fase G2 — Il simulatore a schermata unica come home

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: G1**

**Obiettivo.** La home è il simulatore. A 1280×720, 1440×900 e 1920×1080 tutto sta nella
schermata senza scorrere; le animazioni del catalogo di `docs/design.md` accompagnano ogni tasto
senza rallentare la digitazione.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase G2 di docs/piano-aggiornamento.md. La griglia e il catalogo delle animazioni sono
in docs/design.md. Carica la skill frontend-design. Avvia il sito con il server «astro-dev» di
.claude/launch.json e verifica ogni modifica nel browser a 1280×720, 1440×900 e 1920×1080, in tema
chiaro e scuro.
```

**Passi**

1. `src/pages/index.astro` monta il simulatore a tutta finestra; il percorso didattico si
   raggiunge dalla barra prevista da `docs/design.md`.
2. `/simulatore/` porta alla home conservando la query: i link condivisi già distribuiti
   continuano ad aprire la stessa configurazione. `ShareLink.tsx` genera i link nuovi verso la
   home.
3. Riorganizza `Simulator.tsx` sulla griglia di `docs/design.md`. Ogni pezzo dell’inventario di G0
   resta raggiungibile senza scorrere la pagina.
4. Animazioni nel catalogo: solo `transform` e `opacity`, guidate dallo stato dello store e non da
   timer che si accodano; con `prefers-reduced-motion` gli stati cambiano senza movimento.
5. Ripensa la modalità LIM per la nuova schermata (secondo `docs/design.md`).
6. Test Playwright in `tests/e2e/simulator.spec.ts`: altezza della pagina non maggiore della
   finestra alle tre risoluzioni; un vecchio link `/simulatore/?…` apre la stessa configurazione;
   50 lettere digitate in fretta danno il testo cifrato atteso.

**Criteri di accettazione**

```bash
pnpm verify && pnpm test:e2e
```
con i tre test nuovi del passo 6 fra quelli eseguiti:

```bash
grep -cE '1280|1440|1920' tests/e2e/simulator.spec.ts
```
almeno `3`.

**Esito** (2026-11-04)

- La home è il simulatore: `src/pages/index.astro` monta `Simulator.tsx` a tutta finestra, senza
  intestazione né piè di pagina del sito; la barra del simulatore porta a Come funziona, Storia,
  Esercizi e Glossario. Finché l’isola non è pronta (e senza JavaScript) la stessa barra è già
  nell’HTML, così i link restano raggiungibili. La testa comune delle pagine sta ora in
  `src/components/layout/Head.astro`, usata anche da `BaseLayout.astro`.
- `/simulatore/` rimanda alla home con `location.replace`, conservando query e frammento, e ha un
  link per chi non ha JavaScript. Il pannello «Condividi» e «Rivedi nel simulatore» degli esercizi
  generano link verso la home; nell’intestazione del sito «Simulatore» punta alla home ed è
  corrente solo lì.
- Il banco sta in `src/components/simulator/bench/`: `geometry.ts` (colonne, fili, percorso del
  segnale, con test), `Header.tsx`, `Keyboard.tsx`, `Sheet.tsx`, `Well.tsx`, `Panel.tsx` e
  `Panels.tsx` (spine con l’Uhr, cablaggio dell’UKW-D, opzioni del testo, condividi), `bench.css`
  e `ui.ts` (pannello aperto, modalità del segnale). La griglia è quella di `docs/design.md` al
  pixel: a 1280×720 il vano misura 794 × 642 in (466, 64), il foglio 430 × 352. Radice
  `min(100vw / 80, 100vh / 45)` fra 12,8 e 24 px; a 1440×900 l’altezza in più va al foglio.
- I vecchi componenti (`Machine.tsx`, `Tape.tsx`, `TracePanel.tsx`, `ConfigPanel.tsx`,
  `SchematicView.tsx`) restano per lezioni ed esercizi; `ShareLink.tsx` e `TextInput` sono
  usciti, con le chiavi `home.*` e quelle della vecchia modalità LIM.
- Animazioni del catalogo, solo `transform`, `opacity`, `filter` e `stroke-dashoffset` (il
  segnale con `pathLength="1"`). Le guida lo store: `pulse` cresce a ogni tasto e fa ripartire le
  animazioni cambiando la chiave React (lampade, lettera nuova, percorso, fili) o alternando due
  nomi di keyframe uguali dove rimontare toglierebbe il fuoco (tasti). Nessun timer per le
  animazioni; l’unico timer è «Digita» (45 ms per lettera), nello store, che ogni altro comando
  ferma. Con `prefers-reduced-motion` niente movimento e «Al rallentatore» diventa «Passo passo».
- Modalità LIM: `data-lim` sul banco (contrasti di `tokens.css`) e schermo intero sul documento;
  la griglia è la stessa, scalata.
- Scelte prese qui, da rivedere con Marco se non vanno: le tre modalità del segnale («Normale»,
  «Al rallentatore», «Passo passo») sono un menu «Segnale» e non tre pulsanti, perché nel piede
  dello schema il testo del passo passo occupa due righe e non c’era spazio; il menu «Carica una
  chiave» ha due chiavi di prova inventate (I II III senza cavi; III I V con dieci cavi), in
  attesa delle chiavi storiche dopo la fase V; la nota sull’annullare resta come `title` del
  pulsante Annulla e non è ancora stata spostata nella lezione 1 (punto 2 da confermare in
  `docs/design.md`).
- Sotto 1024×576 la pagina per ora scorre in orizzontale sul fondo della macchina: la versione
  ridotta è della fase G3. Per questo i test di `simulator.spec.ts` saltano il progetto mobile, e
  il test del tema in `smoke.spec.ts` parte da `come-funziona/`.
- Test nuovi in `tests/e2e/simulator.spec.ts`: altezza e larghezza della pagina entro la finestra
  a 1280×720, 1440×900 e 1920×1080, con ogni pezzo dell’inventario nella finestra; un vecchio
  link `/simulatore/?…` apre la stessa configurazione; 50 lettere battute senza pause danno il
  testo atteso (calcolato con il motore). Gli altri test del simulatore sono riscritti per la
  nuova interfaccia (prese e Esc, Uhr, UKW-D, passo passo, «Digita», LIM, QR, axe in chiaro e in
  scuro).
- Verificato nel browser a 1280×720, 1440×900 e 1920×1080, in chiaro e in scuro: Enigma I con il
  link di Barbarossa (decifra «AUFKL XABTE ILUNG»), M4 a quattro rotori, Enigma G con il
  riflettore regolabile e la colonna «ingresso ETW», pannello a spine, passo passo, LIM.
- Comandi: `grep -cE '1280|1440|1920' tests/e2e/simulator.spec.ts` → `3`; il `grep` dei colori
  letterali → `0`; `pnpm verify` exit 0 (192 unit test); `pnpm test:e2e` exit 0 (111 passati,
  19 saltati).

---

## Fase G3 — Il simulatore su mobile

**Modello: Sonnet · Effort: high · Durata: 1,5 h · Dipende da: G2**

**Obiettivo.** A 375 px la home mostra la versione ridotta disegnata nella artboard mobile di
G0, con l’avviso che rimanda al desktop.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase G3 di docs/piano-aggiornamento.md, secondo la versione mobile descritta in
docs/design.md. Avvia il sito con il server «astro-dev» di .claude/launch.json e verifica ogni
modifica nel browser a 375 px e a 768 px, in tema chiaro e scuro.
```

**Passi**

1. Sotto la soglia di `docs/design.md`, la home mostra solo i pezzi della versione ridotta.
2. L’avviso per il desktop sta in `src/i18n/it.json` e passa da `pnpm lint:content`.
3. Bersagli di almeno 44 px; la tastiera della macchina non fa aprire quella del telefono.
4. Test Playwright a 375 px: nessuno scorrimento orizzontale, avviso visibile, axe senza
   violazioni.

**Criteri di accettazione**

```bash
grep -c '375' tests/e2e/simulator.spec.ts
```
almeno `1`.

```bash
pnpm verify && pnpm test:e2e
```

**Esito** (2026-11-04)

- Sotto 1024×576 la home è la versione ridotta di `docs/design.md`. `Simulator.tsx` sceglie con
  `useCompact()` (`bench/compact.ts`, stessa condizione del CSS) fra la schermata unica e
  `bench/Compact.tsx`; store, tastiera fisica e indirizzo con la configurazione sono gli stessi.
  A 375 e a 768 px non c’è scorrimento orizzontale; in verticale la pagina scorre di una
  quarantina di pixel a 375 × 812 (le frecce da 44 px costano più dei 30 della artboard).
- Pezzi: intestazione da 52 con marchio e menu da 44 px (foglio sotto la barra: Simulatore, Come
  funziona, Storia, Esercizi, Glossario e il tema; Esc lo chiude e riporta il fuoco), tre
  finestrelle con frecce da 44 px (quattro sulla M4, da un link) e il nome del rotore, lampade da
  31, tasti da 34 × 46, foglio del messaggio a quattro gruppi per riga con Annulla, Ricomincia e
  Copia, avviso con il link «Apri le lezioni». Niente schema, pannelli, menu di configurazione né
  campi di testo: i tasti sono pulsanti e toccarli non fa salire la tastiera del telefono.
  Lampade e tasti si stringono sotto i 343 px di spazio (320 px compresi). I tasti restano da
  34 px di larghezza, come disegnato, e non da 44: sono l’unica eccezione al bersaglio minimo.
- Il testo dell’avviso sta in `src/i18n/it.json` (`bench.compact.*`) e passa `pnpm lint:content`.
  `Dial` (`Well.tsx`) ha l’opzione `stacked`, `Message` (`Sheet.tsx`) le opzioni `perRow`, `minRows`
  e `compact`; sotto la soglia la radice torna a 16 px e le misure sono quelle della artboard.
  Senza JavaScript la barra va a capo e resta raggiungibile.
- Scelte prese qui, da rivedere con Marco: nel foglio ridotto ci sono Annulla, Ricomincia e Copia
  (la artboard ha solo il nastro, ma sul telefono un tasto sbagliato non si recupera altrimenti) e
  non Ripeti; l’avviso ha il link a una riga propria, alta 44 px, e non in coda al testo; a 768 px
  vale lo stesso disegno, centrato, senza scalarlo; il menu segue il tema (carta e inchiostro), come
  quello delle altre pagine; il «Condividi» e la modalità LIM non ci sono.
- Test in `tests/e2e/simulator.spec.ts`, con l’etichetta `@compact` (girano anche sul progetto
  mobile; il `beforeEach` salta gli altri): a 375 e a 768 px nessuno scorrimento orizzontale, avviso
  visibile con il link, niente schema né campi; bersagli da 44 px, lampade 31, tasti 34 × 46 e quattro
  gruppi per riga; tasti che cifrano senza campi di testo e frecce che girano la finestrella; menu;
  axe in chiaro e in scuro, anche con il menu aperto; link con quattro rotori. `expectAccessible`
  ora attende la fine delle animazioni: con più lavoro in parallelo axe misurava il contrasto del
  pannello a spine a metà dissolvenza (difetto di G2, riprodotto con `--repeat-each`).
- Verificato nel browser a 375 e 768 px, in chiaro e in scuro: tasti, frecce, menu, link con
  messaggio, M4 a quattro rotori, avviso di link non valido. Gli screenshot «dopo» di home e
  simulatore restano alla fase G4, che li fa con G3 fatta.
- Comandi: `grep -c '375' tests/e2e/simulator.spec.ts` → `13`; il `grep` dei colori letterali →
  `0`; `pnpm verify` exit 0 (192 unit test, 4 avvisi di `lint:content` già presenti su righe che
  G3 non tocca); `pnpm test:e2e` exit 0 (125 passati, 19 saltati).

---

## Fase G4 — Il resto del sito nel nuovo linguaggio

**Modello: Sonnet · Effort: high · Durata: 2 h · Dipende da: G1**

Non tocca `src/components/simulator/` né `src/pages/index.astro`: può andare in parallelo a G2 e
G3.

**Obiettivo.** Lezioni, indici delle sezioni, glossario, galleria, esercizi e schede seguono
`docs/design.md`.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase G4 di docs/piano-aggiornamento.md, secondo le regole per le pagine in
docs/design.md. Avvia il sito con il server «astro-dev» di .claude/launch.json e verifica ogni
modifica nel browser, a desktop e a 375 px, in tema chiaro e scuro.
```

**Passi**

1. Pagine di lezione e componenti di `src/components/lesson/` (citazione, prerequisiti,
   obiettivi, previsione, riepilogo) nel nuovo linguaggio.
2. Indici di «Come funziona» e Storia, glossario, galleria, esercizi, schede.
3. I componenti interattivi delle lezioni (`MiniSimulatore`, `AnimazionePasso`, viste) usano
   token e animazioni del catalogo.
4. Screenshot «dopo» in `docs/screenshot/dopo/`, con gli stessi nomi di quelli «prima». Quelli
   della home e del simulatore si fanno solo con G3 fatta; se G3 non lo è, la riga «Esito» lo
   dice e chi chiude G3 li aggiunge.

**Criteri di accettazione**

```bash
diff <(ls docs/screenshot/prima) <(ls docs/screenshot/dopo)
```
nessuna differenza.

```bash
pnpm verify && pnpm test:e2e
```


**Esito** (2026-11-04)

- Componenti della lezione nel linguaggio di `docs/design.md`. `Obiettivi`, `Riepilogo` e
  `Prerequisiti` sono tavole (filetto rosso sopra e sotto, titolo rosso in Archivo, una riga per
  voce); obiettivi e riepilogo hanno la numerazione `01 02 03` in Courier Prime, così la voce 2 del
  riepilogo si legge accanto alla voce 2 degli obiettivi. `Riquadro.astro` ha ora le opzioni `chiusura`
  e `numerata` e niente più box, fondo o bordo tratteggiato fra riquadri. `Previsione` è un modulo
  (filetto rosso in alto, risposte come righe con una casella quadrata che si riempie quando è
  scelta, campo libero come riga di modulo); il verdetto e l’esito compaiono con «Lettera nuova sul
  foglio» del catalogo (160 ms, `--dur-ink`). `Citazione` in Archivo corsivo 20 px, fonte in Courier
  Prime 13 px, un filetto rosso corto al posto del bordo a sinistra. Tolti anche il bordo a sinistra
  di `Nota` (ora una lastra `--paper-deep`), i riquadri di `Approfondimento`, della bozza, di
  `ComingSoon` e dei link alla lezione precedente e successiva (filetti e testo).
- Stili condivisi in `global.css`: `.page-title`, `.page-lead`, `.section-title`, `.tavola` (indici),
  `.btn` e `.btn-primary` (inchiostro su carta), `.field`, `.casella`, `.figure-panel` e
  `.figure-result` (figure interattive), `.sheet` (la scheda per la classe è un foglio: nel tema
  scuro ha la carta attenuata e gli inchiostri chiari, come il foglio del simulatore) e
  `.machine-insert`. Quest’ultima sta fuori da `@layer` perché `.machine` di `tokens.css` non ha
  layer e vincerebbe. Colori nuovi: nessuno; aggiunto solo `--color-field-border` al tema Tailwind.
- Indici di «Come funziona», Storia ed esercizi: tavole a righe (numero, titolo, descrizione) al
  posto delle schede una per voce; in «Esercizi» l’intera riga è il link. Glossario, galleria,
  esercizi, schede e fonti usano i titoli di pagina comuni. Tutti i `text-3xl font-bold` delle
  pagine sono spariti.
- `MiniSimulatore` e il simulatore degli esercizi (lampade, tastiera, finestrelle) stanno su
  vernice raggrinzita con i colori della macchina in entrambi i temi; nastro, traccia e schema
  nel `MiniSimulatore` ereditano gli stessi colori. `AnimazionePasso` ha le finestrelle chiare con
  la cornice scura e lo scatto del catalogo; il rotore che avanza ha un doppio anello d’inchiostro.
  Le altre viste (`CircuitoTasto`, `RotoreSingolo`, `CicliRotore`, `DiscoCifrante`, `UhrSelettore`,
  `CalcolatoreChiavi`, `PannelloASpine`) usano i nuovi pulsanti, campi e figure. In `UhrSelettore` la
  cella `th` nascosta di ogni riga è diventata un `aria-label` della riga, perché in tabella a
  larghezza piena occupava una colonna.
- `Machine.tsx`, `Tape.tsx`, `TracePanel.tsx`, `ConfigPanel.tsx` e il resto di
  `src/components/simulator/` non sono stati toccati: cambiano aspetto solo per i token. Cose
  rimaste: i pulsanti di `Tape`, `TracePanel` e `ConfigPanel` hanno ancora i bordi arrotondati da
  6 px e le etichette `text-xl font-semibold` del vecchio linguaggio; `ConfigPanel` negli esercizi
  è su carta con i suoi `fieldset` a scheda. Si sistemano quando chi tocca `simulator/` ha finito.
- Nella tabella del `CalcolatoreChiavi` a 375 px i numeri molto lunghi vanno a capo fra un gruppo
  e l’altro (già così prima di G4).
- Scelte prese qui: il pulsante primario è inchiostro pieno e non rosso (il rosso resta inchiostro
  di stampa); il test della previsione in `lessons.spec.ts` ora attende la fine delle animazioni
  prima di axe, come già `expectAccessible` in `simulator.spec.ts`; nel `.machine-insert`
  `--color-surface-muted` è `--machine-well`, perché con `--machine-line` il testo secondario
  del nastro scendeva a 4,33:1.
- Screenshot «dopo» in `docs/screenshot/dopo/`, stessi nomi e stesso metodo di G0
  (`pnpm exec playwright screenshot --full-page`, 1280×720 e 375×812, schema colore con
  `--color-scheme`, sul server di sviluppo). Con G3 fatta ci sono anche quelli di home e simulatore.
  `/simulatore/` rimanda alla home, quindi i quattro `simulatore-*` mostrano la home con la chiave
  di Barbarossa e le lettere `EDPUD` battute (query `?v=1&m=I&w=II-IV-V&r=BUL&p=BLA&u=B&s=…&t=EDPUD`).
  Le altezze di home e simulatore non coincidono con quelle «prima» perché le pagine sono cambiate.
- Verificato nel browser (Playwright su Chromium e riquadro del browser) a 1280 px e a 375 px, in
  chiaro e in scuro: lezioni 2, 3, 4, 5, 6, 7, 8, 9, 10 e storia 1, tre esercizi, indici,
  glossario, galleria, schede, anche con previsione libera e a scelta già compilate.
- Comandi: `diff <(ls docs/screenshot/prima) <(ls docs/screenshot/dopo)` → nessuna differenza;
  il `grep` dei colori letterali → `0`; `pnpm verify` exit 0 (192 unit test, gli stessi 4 avvisi di
  `lint:content` già presenti); `pnpm test:e2e` exit 0 (125 passati, 19 saltati).

---

## Fase H — Pulizia del codice

**Modello: Sonnet · Effort: high · Durata: 1 h · Dipende da: A**

**Obiettivo.** Nessuna regola di accessibilità silenziata senza motivo; nessun markup duplicato
fra gli indici delle sezioni.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui la fase H di docs/piano-aggiornamento.md. I rilievi sono nel §6 di
docs/revisione-2026-11-03.md.
```

**Passi**

1. Per ogni `eslint-disable` di `jsx-a11y`: dai al contenitore un ruolo e un nome accessibile
   (per esempio `role="group"` con `aria-label`) o sposta il gestore su un elemento interattivo.
   Lascia il commento di disattivazione solo dove la regola sbaglia, con il motivo.
2. `AnimazionePasso.tsx`: togli i due `exhaustive-deps` silenziati (memo dei nomi dei rotori,
   `advance` in `useCallback`).
3. Estrai un componente per l’elenco delle lezioni, usato da `come-funziona/index.astro` e
   `storia/index.astro`.

**Criteri di accettazione**

```bash
grep -rn 'eslint-disable' src | wc -l
```
minore di `8`, e ogni riga rimasta ha un commento con il motivo.

```bash
pnpm verify && pnpm test:e2e
```

**Esito (2026-11-04)**

- Fatto: gli `eslint-disable` in `src` passano da otto a uno. I quattro contenitori che scorrono in orizzontale (`TracePanel`, `Blocks`, `SheetGenerator`, `SchematicView`) usano il nuovo `src/components/ui/ScrollRegion.tsx` (`role="region"`, nome accessibile, `tabIndex={0}` per WCAG 2.1.1): l’unica disattivazione rimasta sta lì, con il motivo (la regola considera `region` non interattivo). I due contenitori che raccoglievano i tasti (`MiniSimulatore`, `ExerciseSimulator`) hanno ora `role="group"` con `aria-label`, e il gestore è nell’hook `useKeyCapture` di `store.ts`: con `role="group"` e `onKeyDown` nel JSX la regola `no-noninteractive-element-interactions` scatta comunque, quindi l’ascoltatore si registra sul contenitore con `addEventListener`. `AnimazionePasso`: nomi dei rotori in `useMemo`, `advance` in `useCallback`, nessun `exhaustive-deps` silenziato. Nuovo `src/components/content/ListaLezioni.astro` (prop `sezione`) usato da `come-funziona/index.astro` e `storia/index.astro`.
- Comandi: `grep -rn 'eslint-disable' src | wc -l` dà 1; `pnpm verify` exit 0; `pnpm test:e2e` exit 0 (113 passati, 3 saltati). La tastiera fisica nel simulatore ridotto è coperta dal test già presente in `tests/e2e/lessons.spec.ts` («il mini simulatore usa la tastiera fisica solo quando ha il focus»).
- Resta: il quinto rilievo del §6 (controllo automatico della matematica in prosa) era già chiuso dalla regola `matematica-unicode` della fase C. Nel gruppo `ExerciseSimulator` il nome del gruppo («Simulatore») ripete quello del titolo della sezione: innocuo, ma si può distinguere se la fase G ridisegna la pagina.

---

## Fase V — Verifiche sui testi delle fonti

**Modello: Opus · Effort: high · Durata: 2 h per gruppo di libri · Dipende da: B, testi forniti
da Marco**

**Obiettivo.** Ogni fatto storico delle lezioni rimanda a una fonte effettivamente consultata,
con la pagina; l’elenco «Da verificare» di `docs/stato.md` si svuota.

**Dove sono i testi.** In `docs/books/`, ignorata da git (2026-11-04): i libri sono coperti da
copyright e non entrano mai nel repo, che è pubblico. I file hanno il nome originale, non l’`id`
di `src/content/fonti.yaml`. Tutti hanno il testo estraibile, scansione di Kozaczuk compresa (ha
il livello OCR), quindi non si leggono pagina per pagina: si cerca la parola chiave e si legge
solo l’intorno.

- PDF: `pdftotext -layout file.pdf - | grep -n …`, poi `pdftotext -f N -l N` per la pagina.
  Il numero di pagina del PDF non è quello stampato: la pagina da citare è quella stampata.
- EPUB: `unzip -p file.epub '*.html' '*.xhtml' | sed 's/<[^>]*>//g' | grep -n …`. Gli EPUB non hanno
  pagine stampate: si cita il capitolo, oppure Marco manda lo screenshot della pagina del
  cartaceo.
- TXT (Welchman): `grep -n` direttamente.

I numeri di pagina valgono per l’edizione del file: se non è quella di `fonti.yaml`, la sessione
aggiorna la voce.

| `id` previsto | File in `docs/books/` |
|---|---|
| `singh-codici-segreti` | `Codici & segreti … BUR …epub` (c’è anche *The Code Book*, in inglese) |
| `batey-dilly` | `Dilly · The Man who broke Enigmas …epub` |
| Kozaczuk, *Enigma* | `Enigma_ How the German Machine Cipher Was Broken …pdf` |
| `bauer-decrypted-secrets` | `Decrypted Secrets_ … 4th …pdf` |
| Welchman, *The Hut 6 Story* | `The Hut 6 Story …txt` |
| Sebag-Montefiore, *Enigma* | `Enigma _ The Battle for the Code …epub` |
| di appoggio, non nel piano | Craig Bauer, *Secret History* (2021); Stallings, *Cryptography and Network Security* (2022); Bernasconi, Ferragina, Luccio, *Elementi di crittografia* (2015) |

Mancano Rejewski 1980, Hamer 1997 e Hinsley.

**Ordine dei libri**, secondo quanti fatti aperti verificano:

| Libro | Che cosa verifica | Serve per |
|---|---|---|
| Singh, *Codici & segreti* | Alberti e la data del trattato, al-Kindi, cifra dello spazio delle chiavi, pagine delle citazioni | lezioni 2 e 8 |
| Batey, *Dilly* | Mavis Lever, il messaggio di prova, Matapan, ruolo della sezione di Knox | storia 4 |
| Kozaczuk, *Enigma*, o Rejewski 1980 | procedura dell’indicatore 1938–1940, numero di cavi nel tempo, data dei rotori IV e V | storia 2 e 3, lezione 7 |
| Hamer 1997 | solo il numero del volume di Cryptologia | voce di `fonti.yaml` |
| Welchman, Sebag-Montefiore, Hinsley | diagonal board, Shark, U-110 e U-559, dibattito su Ultra | fase 4 (crittoanalisi), non le lezioni attuali |

Prima di comprare un testo, la fase cerca una versione liberamente accessibile: articoli come
Rejewski 1980 potrebbero esserlo.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase V di docs/piano-aggiornamento.md per i libri presenti in docs/books/ (ignorata
da git: la tabella della fase dice quale file corrisponde a quale fonte). Non leggere i libri
interi: cerca le parole chiave con i comandi della fase e leggi solo l'intorno. L'elenco dei fatti
da controllare è in docs/stato.md, «Fonti tolte dal frontmatter» e «Da verificare». Non copiare
brani dei libri nel repo: nelle lezioni solo citazioni brevi, con la pagina, come prevede
docs/piano.md (art. 70 LdA).
```

**Passi**

1. Per ogni fatto della sezione «Da verificare» coperto dai libri presenti: cerca il passo, annota
   in `stato.md` libro, edizione e pagina, e se il libro contraddice la lezione correggi la
   lezione.
2. Rimetti la fonte nel frontmatter delle lezioni che usano quel fatto.
3. Dove Singh diverge dagli specialisti, la lezione lo dice (`docs/piano/archivio.md`, «Bibliografia di
   base»).
4. Sposta i fatti verificati da «Da verificare» a una sezione «Verificato», con la data.

**Criteri di accettazione**

```bash
grep -c 'p\. [0-9]' docs/stato.md
```
almeno uno per ogni fatto verificato.

```bash
pnpm verify
```

**Esito (2026-11-04)**

- Fatto: la ricerca nei libri l’hanno svolta cinque sottoagenti Sonnet (effort high) in sola lettura, uno per gruppo: Singh; Batey; Kozaczuk; i due Bauer; Welchman con Sebag-Montefiore. Le decisioni sulle lezioni sono state prese nella sessione Opus. I fatti verificati sono in `docs/stato.md`, sezione «Verificato», con la pagina per Kozaczuk e i due Bauer e il capitolo per gli epub e per Welchman.
- Correzioni di fatto: rotori IV e V al 15 dicembre 1938, non al 15 settembre (storia 2). Shark resta illeggibile per dieci mesi e mezzo, e dall’U-559 arrivano libri codice, non fogli chiave (storia 2). Numero di cavi nel tempo (lezione 7). Tolta la causa senza fonte dell’abbandono della doppia cifratura (storia 3). In storia 4 il messaggio senza L viene da un operatore italiano, dopo il settembre 1940, e non è legato a Matapan, dove servì un altro messaggio. Precisati Alberti e al-Kindi (lezione 2), Korn e l’Enigma D (lezione 6), il conto di Singh (lezione 10) e la voce `kenngruppenbuch`.
- Fonti rimesse o aggiunte nel frontmatter delle lezioni 1, 2, 4, 5, 6, 7, 9 e 10, di storia 2, 3 e 4 e di tre voci del glossario. Le edizioni dei file sono ora in `fonti.yaml`: Singh BUR 2001, Welchman M&M Baldwin 1998, Bauer quarta edizione.
- Resta: l’articolo di Hamer (1997), non fra i testi; la discrepanza fra i rotori commerciali D del motore e Bauer, p. 124; le note per la fase 4e, raccolte in `stato.md`, che aspettano anche Hinsley.
- Comandi: `grep -c 'p\. [0-9]' docs/stato.md` dà 29; `pnpm verify` exit 0; `pnpm test:e2e` exit 0 (125 passati, 19 saltati).

---

## Fase I — Le fasi 4–5 di `docs/piano.md` nel formato dei piani

**Modello: Opus · Effort: high · Durata: 1 h · Dipende da: E1–E3, D8**

**Obiettivo.** Il lavoro rimasto del piano originale è diviso in fasi eseguibili ciascuna in una
sessione, con modello, effort, prompt, criteri verificabili e durata.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui la fase I di docs/piano-aggiornamento.md. Leggi docs/piano.md, docs/stato.md, il §7 di
docs/revisione-2026-11-03.md e .claude/norms/scrittura-tecnica.md. Prima di scrivere, fai a Marco
le domande sulle decisioni che cambiano intere fasi (per esempio: missioni storiche prima o dopo la
crittoanalisi; vista 2.5D disegnata a mano o generata dai dati).
```

**Passi**

1. Intervista Marco sulle decisioni aperte della fase 4.
2. Riscrivi la sezione «Fasi» di `docs/piano.md` per il lavoro rimasto: lezione «Modelli a
   confronto», rinviati della 1b, crittoanalisi (racconto e animazioni), vista 2.5D, missioni
   storiche, guida per i docenti (con `scrittura-istituzionale.md`), accessibilità e Lighthouse,
   vista 3D.
3. Sposta in `docs/piano.md` la tabella delle decisioni prese in questa revisione.

**Criteri di accettazione**

```bash
grep -c '^\*\*Modello:' docs/piano.md
```
uguale al numero di fasi rimaste.

```bash
pnpm format:check
```

**Esito** (2026-11-04)

- Intervista a Marco il 2026-11-04, risposte in `docs/piano.md` come decisioni D9–D13: la vista
  2.5D esce dal piano; la crittoanalisi resta racconto e animazioni, senza esercizi guidati; dei
  rinviati della 1b resta solo la vista 3D (escono cavi trascinabili, schema verticale su mobile
  e notazione tedesca dell’UKW-D); le missioni storiche vengono dopo la fase V e dopo la
  crittoanalisi. Resta aperta D14: da dove viene il modello 3D, da decidere prima della fase 5a.
- `docs/piano.md`: la sezione «Fasi» è riscritta per il lavoro rimasto, con tabella «Stato»,
  regole comuni e dieci fasi (4a–4h, 5a, 5b), ognuna con modello, effort, durata, dipendenze,
  prompt di apertura, passi e criteri verificabili con un comando. La tabella delle decisioni
  della revisione (D1–D8) è spostata lì, nella sezione «Decisioni della revisione»; qui resta un
  rimando.
- Fatti verificati il 2026-11-04 che hanno cambiato la lista del §7 della revisione: la
  spiegazione delle cifre di Singh e di Crypto Museum sullo spazio delle chiavi è già nella
  lezione 10 (`10-quante-chiavi.mdx`, fase E2) e `<Citazione fonte pagina>` esiste dalla fase D:
  nessuna delle due torna nel piano. Rejewski 1980 e il trattato di Turing sono già consultati
  online (`fonti.yaml`), quindi la fase 4d non dipende dalla fase V se non per i fatti che solo
  Kozaczuk conferma.
- Comandi: `grep -c '^\*\*Modello:' docs/piano.md` → `10`, uguale alle fasi della tabella
  «Stato» di `docs/piano.md`; `pnpm format:check` exit 0.
