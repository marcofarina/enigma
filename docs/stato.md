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

- Revisione delle bozze delle lezioni da parte dell’autore.
- Le fasi rimaste (4a–4h, 5a, 5b) sono in `docs/piano.md`, sezione «Fasi», ognuna con il suo
  prompt di apertura. La vista 2.5D e i rinviati della 1b sono usciti dal piano il 2026-11-04
  (decisioni D9 e D11).

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

- Storia 2: Crypto Museum porta al 1928 la versione definitiva del pannello a spine; Kozaczuk (p. xiii) data al 1930 la versione militare con il pannello. La lezione tiene il 1928 per il progetto e il 1° giugno 1930 per l’entrata in servizio.
- Storia 4: il primo successo di Knox contro l’Enigma K di Franco «il 4 aprile 1937» viene solo da Crypto Museum; Batey non dà il giorno.
- Italia: nella tabella del cablaggio D (marina italiana) di Crypto Museum il rotore I contiene due volte la U, quindi non è una permutazione; per questo il modello non è stato aggiunto al motore.
- Motore: i rotori commerciali dell’Enigma D in `COMMERCIAL_ROTORS` (rotore I `LPGSZMHAEOQK…`) non coincidono con la tabella di Bauer, *Decrypted Secrets*, p. 124 (rotore I `HRWYIPCGVXL…`, tacca G); il riflettore coincide. Da confrontare con CryptoCellar prima di cambiare il motore.
- Rapporto 6812: nella trascrizione di Tony Sale l’esempio di pannello d’emergenza (parola CHRISTENSEN) ha un refuso (ABDYG al posto di ABDFG); non è usato nei testi.
- Galleria: il foglio chiave della Luftwaffe n. 649 su Commons è marcato solo “PD-US-no notice”; non è stato usato. Il ritratto di Rejewski (CC BY-SA 2.5, archivio della figlia) è piccolo, 200 × 274 pixel.
- Anno del Luftwaffen-Maschinenschlüssel Nr. 619 (1944 per analogia con il 649 di Commons).
- Hamer 1997: l’articolo non è fra i testi consultati. Il volume 21 è coerente con la bibliografia di Craig Bauer, *Secret History* (2021), che cita *Cryptologia* 21 (4) per l’ottobre 1997; la frase della lezione 5 che nomina Hamer resta appoggiata a Crypto Museum, e `hamer-1997` resta fuori dal frontmatter.
- `period` e `users` dei modelli in `src/engine/models.ts`, prima di mostrarli nelle schede storiche.
- Notazione dell’UKW-D (Bletchley J–Y o tedesca B–O): né Bauer (p. 120, «D» o «Dora») né Craig Bauer la danno. Uhr: l’esempio di Crypto Museum (posizione 03, spina 1a verso 5b e 5b verso 4a) coincide con il motore; manca un confronto su un messaggio reale.
- Dettagli tecnici dell’Enigma K usata dalla Regia Marina: Bauer (pp. 281, 284) parla della macchina senza pannello, ma non dà cablaggi.
- Crypto Museum, pagina “How does an Enigma machine work?”: i totali con la correzione del doppio passo sono sbagliati. Per l’Enigma I scrive 685 518 560 invece di 60 × 676 × 16 926 = 686 518 560; per la M4 toglie 650 posizioni una volta sola invece che per ciascuna delle 26 posizioni del rotore sottile (440 076 posizioni distinte, verificato con il motore). Con i rotori navali a due tacche nel mezzo la riduzione è diversa. La lezione 10 usa i valori ricalcolati.
- Lezione 10: Bauer (pp. 119, 122) conta tre anelli, 26³, mentre la lezione ne conta due, 26², come Craig Bauer (p. 226). La lezione può nominare anche questa ipotesi fra le cifre diverse.
- Esercizio sulla procedura dell’indicatore: descrive l’indicatore cifrato due volte con la Grundstellung del giorno, senza date. Le date per esercito e aviazione sono ora verificate (sotto, «Verificato»); per la marina Sebag-Montefiore dà la fine della doppia cifratura al 1° maggio 1937 e un indicatore costruito con il *Kenngruppenbuch*. Prima di aggiungere date all’esercizio, decidere quale rete descrive.

## Verificato (fase V, 2026-11-04)

I testi sono in `docs/books/`, fuori da git. Gli epub e la trascrizione di Welchman non hanno pagine: per quei libri si cita il capitolo. Le pagine di Kozaczuk e dei due Bauer sono quelle stampate.

| Fatto | Fonte | Esito e lezione |
|---|---|---|
| Rotori IV e V introdotti il 15 dicembre 1938 (il 15 settembre 1938 cambiò solo l’indicatore) | Kozaczuk, p. 15 n. 7, p. 54, p. 56, p. 242; Bauer, *Decrypted Secrets*, p. 118; Welchman, cap. 1; Sebag-Montefiore, cronologia | Crypto Museum sbagliava: storia 2 corretta (testo e riepilogo) |
| Indicatore: *Grundstellung* comune e chiave cifrata due volte fino al 15 settembre 1938, poi *Grundstellung* scelta dall’operatore e trasmessa in chiaro; la rete SD passa al metodo nuovo il 1° luglio 1939 | Kozaczuk, p. 237, p. 265, p. 274, p. 287; Bauer, p. 122 | Storia 3, con l’aggiunta della rete SD |
| Doppia cifratura contro gli errori di ricezione radio | Kozaczuk, p. 251; Bauer, p. 122 | Storia 3, invariata |
| Fine della doppia cifratura per esercito e aviazione il 1° maggio 1940; per la marina il 1° maggio 1937 | Bauer, p. 123; Sebag-Montefiore, cap. 8 e cronologia; Kozaczuk, p. 105 («subito prima» del 10 maggio 1940) | Storia 3: tolta la causa («matematici appena assunti»), senza fonte; Welchman, cap. 10, scrive di non conoscerla |
| Cavi del pannello: sei fino al 30 settembre 1936, da cinque a otto dal 1° ottobre 1936, da sette a dieci dal 1° gennaio 1939 | Kozaczuk, p. 41, p. 242, p. 263; Welchman, parte 4; Sebag-Montefiore, cronologia; Singh, cap. 4 (dieci da gennaio 1939) | Lezione 7 corretta; la citazione d’apertura di Crypto Museum («sempre un numero fisso») resta, e il testo dice che semplifica |
| Adozione: marina 1926, esercito 1928 con macchine modificate, Enigma I in servizio il 1° giugno 1930, Luftwaffe con chiavi proprie dal 1° agosto 1935 | Kozaczuk, p. xiii, p. 15 n. 7, p. 263; Welchman, prefazione | Storia 2, invariata |
| Biuro Szyfrów: Rejewski al lavoro dall’autunno 1932, Enigma risolta nel gennaio 1933 | Kozaczuk, p. 20, p. 28, p. 33, p. 43 | Lezione 10, invariata |
| La macchina come prodotto di permutazioni | Kozaczuk, app. D di Rejewski, p. 254; app. E, p. 275 | Glossario «permutazione» e lezione 9: fonte `kozaczuk-enigma` |
| M4 dal 1° febbraio 1942; Shark illeggibile per dieci mesi e mezzo, fino al 13 dicembre 1942; dall’U-559 (30 ottobre 1942) libri codice dei messaggi brevi e del meteo, non fogli chiave | Sebag-Montefiore, introduzione, cap. 19 e cap. 20, cronologia | Crypto Museum («nove mesi», «new key sheets») sbagliava: storia 2 corretta |
| *Kenngruppenbuch*: due trigrammi per l’indicatore, poi tabelle dei bigrammi che cambiano ogni giorno | Sebag-Montefiore, cap. 18 e appendice 3 | Storia 3 e glossario: tolto «secondo il giorno e la rete», che nessuna fonte sostiene; le 120 pagine restano su Crypto Museum |
| Italia: il messaggio senza L era un messaggio fittizio di un operatore italiano, di almeno trenta gruppi, letto dopo la prima rottura del settembre 1940; servì a ricostruire un rotore nuovo, con l’aiuto di Keith Batey | Batey, *Dilly*, cap. 8, cronologia, app. 2 | Crypto Museum («tedesco») sbagliava; storia 4 corretta, senza la data del marzo 1941 |
| Matapan: il 25 marzo 1941 il gruppo di Knox decifra il messaggio che fissa la data dell’operazione italiana, grazie alle tabelle sul punto fermo, non al messaggio senza L; le decifrazioni orientano la strategia, la battaglia la decidono i comandanti; Iachino aveva a bordo un crittografo | Batey, cap. 9 | Storia 4 riscritta: la lezione collegava a Matapan il messaggio senza L |
| Sezione di Knox nel *Cottage*, *Dilly’s girls*; ISK solo dopo l’ottobre 1941; Knox malato dal 1939, morto il 27 febbraio 1943; *rodding* del 1937; Abwehr risolta nell’ottobre 1941 | Batey, cap. 5, 6, 8, 10, app. 2, app. 5, cronologia | Storia 4, invariata; l’analisi di Foss è del 1929 (cap. 5): «dieci anni prima» diventa «alla fine degli anni Venti» |
| Alberti: disco cifrante nel trattato del 1466 o 1467; anello esterno con venti lettere e le cifre da 1 a 4 | Bauer, p. 39, pp. 51–52, pp. 139–140; Craig Bauer, *Secret History*, p. 10, p. 61; Singh, cap. 2 («tra il 1460 e il 1470») | Lezione 2: data e nota precisate |
| Al-Kindi: la descrizione più antica dell’analisi delle frequenze, IX secolo; chi l’abbia scoperta non si sa | Singh, cap. 1, «I crittoanalisti arabi» | Lezione 2: «era descritto già» diventa «la descrizione più antica che conosciamo» |
| Cesare e lo spostamento di tre in Svetonio | Singh, cap. 1 | Lezione 2, invariata |
| Brevetto di Scherbius nel 1918; forze armate dal 1926 | Singh, cap. 3 | Lezione 1, invariata |
| Spazio delle chiavi: circa 10¹⁶ con tre rotori, sei cavi e senza anelli; 159 miliardi di miliardi con cinque rotori e dieci cavi; 105 456 posizioni del catalogo di Rejewski | Singh, cap. 3 e cap. 4 | Lezione 10: Singh descrive la macchina di Scherbius in generale, non «quella che Rejewski attaccava nel 1932»; aggiunta la seconda cifra di Singh |
| Citazioni testuali da Singh nelle lezioni | — | Nessuna: il punto aperto sulle pagine delle citazioni si chiude |
| Rotore: cablaggio del rotore I, anello con la tacca solidale (inventato da Paul Bernstein), ruota d’ingresso | Bauer, p. 108, p. 115, p. 121, p. 124, p. 126 | Lezione 4, invariata |
| Riflettore: brevetto di Willi Korn del 21 marzo 1926; nessuna lettera cifrata in sé stessa; fisso nell’Enigma I; UKW-D osservato dal 2 gennaio 1944 | Bauer, pp. 114–115, p. 118, p. 120 | Lezione 6: tolto «alla guida dell’azienda», che Bauer non conferma; Enigma D «fra il 1926 e il 1927» (Crypto Museum 1926, Bauer 1927). Bauer scrive «Willi», Crypto Museum «Willy»: le lezioni tengono «Willy» |
| Doppio passo: periodo 26 × 25 × 26 = 16 900 | Bauer, p. 147; Craig Bauer, p. 224 | Lezione 5 e glossario: fonte `bauer-decrypted-secrets` |

### Per la fase 4e (Bletchley Park)

- *Diagonal board*: idea di Welchman nell’autunno 1939; Turing, dapprima incredulo, la sostenne con Travis; il progetto fu di Harold «Doc» Keen della BTM. Welchman, cap. 4.
- U-110 (9 maggio 1941): macchina, libri codice, impostazioni *Offizier* di giugno, libri dei messaggi brevi, tavole dei bigrammi; Sebag-Montefiore nega che sia stata la cattura decisiva. Sebag-Montefiore, cap. 13.
- U-559 (30 ottobre 1942): Fasson e Grazier annegano; libri dei messaggi brevi; la rottura del 13 dicembre viene anche dall’abitudine di impostare il quarto rotore in modo che la M4 si comportasse come una macchina a tre rotori. Sebag-Montefiore, cap. 20.
- Ultra: Sebag-Montefiore riporta la tesi di Hinsley (sbarco in Normandia rinviato al 1946 senza la vittoria sugli U-Boot) e i suoi limiti; Welchman non dà cifre. Sebag-Montefiore, introduzione; Welchman, prefazione.

### Fonti tolte dal frontmatter (fase B, D7, 2026-11-03)

La fase V (2026-11-04) le ha rimesse dove i libri confermano i fatti: `singh-codici-segreti` nelle lezioni 1, 2 e 10; `bauer-decrypted-secrets` nelle lezioni 2, 4, 5, 6 e 10 e nella voce «doppio passo» del glossario; `batey-dilly` in storia 4. Si sono aggiunte `kozaczuk-enigma` (lezioni 7 e 9, storia 2 e 3, voce «permutazione»), `welchman-hut-six` e `sebag-montefiore-enigma` (storia 2 e 3; la seconda anche nella voce `kenngruppenbuch`). Resta fuori solo `hamer-1997`: l’articolo non è fra i testi consultati.

### Consultato in fase B (2026-11-03, `curl`)

- `cryptomuseum.com/crypto/enigma/hist.htm`: scrive «Willy Korn» (non «Willi»), collega di Scherbius e poi alla guida dell’azienda, a cui si deve l’idea del riflettore. Le lezioni usano «Willy».
- `cryptomuseum.com/crypto/enigma/ukwd/index.htm`: l’UKW-D fu introdotto nel gennaio 1944 dalla Luftwaffe; esisteva anche una variante per la marina (M3 e M4). Le lezioni lo attribuiscono alla Luftwaffe. Il cablaggio cambiava ogni dieci giorni circa, secondo i fogli chiave.
- Date di adozione armonizzate sulla ricostruzione di Crypto Museum (lezione di storia 2): marina nel 1926 (Funkschlüssel C), Enigma I dell’esercito pronta nel 1927 e in servizio dal 1° giugno 1930. `period` dell’Enigma I è ora «1930–1945».

### Consultato in fase D (2026-11-03, `curl`)

- `cryptomuseum.com/crypto/enigma/working.htm`, sezione «Enigma stepping»: «Rotor movement is much like the odometer in a car.» È la citazione d’apertura della lezione 5, tradotta da noi; voce `crypto-museum-funzionamento` di `fonti.yaml`.
- Scartata come citazione d’apertura, ma utilizzabile: il rapporto 6812 (`us-6812-bombe-report`), p. 3 della trascrizione di Tony Sale, descrive il nottolino che deve «cadere nell’incavo» del rotore precedente per farlo avanzare.

### Consultato in fase E3 (2026-11-03, WebFetch)

- `cryptomuseum.com/crypto/enigma/m4/index.htm`: il *Kenngruppenbuch* («K. Buch») è un libro A4 di 120 pagine; la versione mostrata è stata stampata a Berlino nel 1941 (M. Dv. Nr. 98). L’operatore ne sceglieva due trigrammi, che formavano l’indicatore prima della conversione con le tabelle dei bigrammi. La M4 fu introdotta «unexpectedly» il 1° febbraio 1942; il traffico degli U-Boot cifrato con la M4 si chiamava SHARK e restò illeggibile per nove mesi, «until new key sheets were captured». Sono la fonte della voce `kenngruppenbuch` del glossario e della chiusa della storia 2.
