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

- Fase 4d, branch `fase/4d`: crittoanalisi polacca. Tre lezioni in bozza nella sezione
  Crittoanalisi (Rejewski e la teoria dei cicli, il ciclometro e il catalogo, la bomba e i fogli di
  Zygalski), pagina indice e voce di menu; dettagli in `docs/piano.md`, fase 4d, «Esito».

- Fase 4e, branch `fase/4e`: Bletchley Park e la M4. Tre lezioni in bozza nella sezione
  Crittoanalisi (il crib e la Bombe, la M4 e Shark, quanto contò Ultra), voci nuove del glossario e
  pagina di prova delle animazioni tolta; dettagli in `docs/piano.md`, fase 4e, «Esito».

- Fase 4f, branch `fase/4f`: missioni storiche. Il menu «Carica una chiave» della home ha i
  messaggi di Barbarossa (due parti), U-264 e Scharnhorst da `src/content/missioni.yaml`, ognuno con
  il pannello «Contesto»; dettagli in `docs/piano.md`, fase 4f, «Esito».

- Fase 4g, branch `fase/4g`: guida per i docenti in `/docenti/` (testo in
  `src/content/docenti/guida.mdx`), «Docenti» di nuovo nei menu; dettagli in `docs/piano.md`,
  fase 4g, «Esito».

- Fase 4a, branch `fase/4a`: lezione «Modelli a confronto» (11 di «Come funziona», in bozza) con
  il componente `ConfrontoModelli` (tabella e linea del tempo dai dati del motore); `period` e
  `users` dei modelli verificati; dettagli in `docs/piano.md`, fase 4a, «Esito».

- Fase 4h, branch `fase/4h`: `pnpm test:lighthouse` (prestazioni ≥ 90, accessibilità 100, a desktop e
  a 375 px sulle pagine di `scripts/pagine.ts`), anche in CI; axe sulle stesse pagine; stack dei
  caratteri senza `ui-monospace`, preload dei due font della prima schermata e segnaposto a schermo
  intero per i componenti `client:only`; dettagli in `docs/piano.md`, fase 4h, «Esito».

## Prossimo passo

- Revisione delle bozze delle lezioni da parte dell’autore.
- Le fasi rimaste (dalla 4i alla 5e: modello 3D, pagina `/macchina/`, lezione animata) sono in
  `docs/piano.md`, sezione «Fasi», ognuna con il suo prompt di apertura; le decisioni sono D14–D19. La vista 2.5D e i rinviati della 1b sono usciti dal piano il 2026-11-04
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
- Motore, tacche dell’Enigma D: `COMMERCIAL_ROTORS` è condiviso da D, K e G e porta le tacche della K (`Y`, `E`, `N`, sull’anello). Crypto Museum (pagina Enigma D) dà per la D una tacca sola, in G, fissata al corpo del rotore (scatto con Z in finestra a Ringstellung A, «Turnover = RingSetting − 1»; l’anello non conta per lo spazio delle chiavi). Il motore non sa modellare una tacca sul corpo, quindi la D scatta come una K. Nessun testo lo afferma. Decisione di Marco: lasciare com’è e dirlo, oppure aggiungere il tipo di tacca al motore (cambiano i vettori della D). Deciso il 2026-11-04: motore invariato, avvertenza in una `Nota` della lezione 11 («La tacca dell’Enigma D nel simulatore»). Se un giorno si modella la tacca sul corpo, la nota va tolta.
- Rapporto 6812: nella trascrizione di Tony Sale l’esempio di pannello d’emergenza (parola CHRISTENSEN) ha un refuso (ABDYG al posto di ABDFG); non è usato nei testi.
- Galleria: il foglio chiave della Luftwaffe n. 649 su Commons è marcato solo “PD-US-no notice”; non è stato usato. Il ritratto di Rejewski (CC BY-SA 2.5, archivio della figlia) è piccolo, 200 × 274 pixel.
- Anno del Luftwaffen-Maschinenschlüssel Nr. 619 (1944 per analogia con il 649 di Commons).
- Hamer 1997: l’articolo non è fra i testi consultati. Il volume 21 è coerente con la bibliografia di Craig Bauer, *Secret History* (2021), che cita *Cryptologia* 21 (4) per l’ottobre 1997; la frase della lezione 5 che nomina Hamer resta appoggiata a Crypto Museum, e `hamer-1997` resta fuori dal frontmatter.
- Enigma norvegese: nel motore il rotore IV ha il cablaggio del rotore IV dell’Enigma I
  (`ESOVPZJAYQUIRHXLNFTGKDCMWB`), mentre la pagina dei cablaggi di Crypto Museum dà
  `FGZJMVXEPBWSHQTLIUDYKCNRAO` (gli altri quattro rotori e il riflettore coincidono). Da confrontare
  con l’articolo di Hamer e Weierud citato da Crypto Museum; se il motore cambia servono vettori di
  test nuovi.
- Swiss-K: Crypto Museum dà il primo lotto nel 1939 nell’introduzione e le macchine «Swiss-K» nel
  1940 (consegne del 5 maggio e del 10 luglio) più avanti nella stessa pagina. Il motore tiene il 1939.
- M4: la pagina della M4 la dà introdotta il 1° febbraio 1942, quella della M3 il 2 febbraio. Il
  sito tiene il 1° febbraio.
- G260: compare nell’elenco dei clienti della G di Crypto Museum sotto «I.G. Farben», ma la
  stessa pagina la attribuisce al Sicherheitsdienst in Argentina. `users` dice «probabilmente».
- Notazione dell’UKW-D (Bletchley J–Y o tedesca B–O): né Bauer (p. 120, «D» o «Dora») né Craig Bauer la danno. Uhr: l’esempio di Crypto Museum (posizione 03, spina 1a verso 5b e 5b verso 4a) coincide con il motore; manca un confronto su un messaggio reale.
- Dettagli tecnici dell’Enigma K usata dalla Regia Marina: Bauer (pp. 281, 284) parla della macchina senza pannello, ma non dà cablaggi.
- Crypto Museum, pagina “How does an Enigma machine work?”: i totali con la correzione del doppio passo sono sbagliati. Per l’Enigma I scrive 685 518 560 invece di 60 × 676 × 16 926 = 686 518 560; per la M4 toglie 650 posizioni una volta sola invece che per ciascuna delle 26 posizioni del rotore sottile (440 076 posizioni distinte, verificato con il motore). Con i rotori navali a due tacche nel mezzo la riduzione è diversa. La lezione 10 usa i valori ricalcolati.
- Lezione 10: Bauer (pp. 119, 122) conta tre anelli, 26³, mentre la lezione ne conta due, 26², come Craig Bauer (p. 226). La lezione può nominare anche questa ipotesi fra le cifre diverse.
- Esercizio sulla procedura dell’indicatore: descrive l’indicatore cifrato due volte con la Grundstellung del giorno, senza date. Le date per esercito e aviazione sono ora verificate (sotto, «Verificato»); per la marina Sebag-Montefiore dà la fine della doppia cifratura al 1° maggio 1937 e un indicatore costruito con il *Kenngruppenbuch*. Prima di aggiungere date all’esercizio, decidere quale rete descrive.

- Riunione di Pyry: Rejewski 1980 (p. 18) la dà al 25 luglio 1939, Rejewski in Kozaczuk (app. D, p. 269) al 25 e 26, Kozaczuk (pp. 59–60) al 24 e 25 con l’arrivo degli ospiti il 24. La lezione 3 di crittoanalisi tiene il 25 e dice la differenza.
- Cambio del riflettore A con il B: 1° novembre 1937 in Rejewski 1980 (p. 18), 2 novembre in Kozaczuk (app. D, p. 264). La lezione 2 di crittoanalisi scrive «all’inizio di novembre del 1937».
- Rejewski 1980 (p. 18) scrive che i cavi del pannello passarono «da 6 a 13»; Kozaczuk (app. D, p. 268) dà da sette a dieci dal 1° gennaio 1939, come le altre fonti. Le lezioni usano il secondo dato.
- Nome della bomba: Kozaczuk (p. 53) lo attribuisce a Różycki, Rejewski (app. D, p. 267) scrive che «noi» lo scegliemmo «in mancanza di un’idea migliore». La lezione 3 cita solo Rejewski.
- Materiale di Asché: Rejewski (app. D, p. 258) parla delle chiavi di settembre e ottobre 1932; l’elenco di Kozaczuk (p. 18) nomina tabelle mensili dell’esercito di altri periodi (la scansione è poco leggibile). La lezione 1 tiene il dato di Rejewski.
- Hinsley, *British Intelligence in the Second World War*: non consultato. La lezione 3 ne riporta la tesi solo attraverso la risposta di Rejewski in Kozaczuk (p. 64, n. 8).

- M4 in posizione neutra: Sebag-Montefiore (cap. 19 e 20) scrive anello in Z e A nella finestrella del rotore sottile; nel motore la M4 con Beta e il riflettore B sottile cifra come la M3 con il riflettore B quando posizione e anello coincidono (A e A, oppure Z e Z), non con anello Z e finestrella A. Forse è una questione di notazione: a Bletchley Park l’anello Z faceva da zero (Welchman, app. I; Turing, cap. 1, p. 5, «window position = rod position + Ringstellung + a constant»). La lezione 5 di crittoanalisi usa nel simulatore Beta in A con l’anello in A e nella parte storica dice solo «posizione neutra».
- Prima Bombe: Singh (cap. 4) dà *Victory* al 14 marzo 1940 e *Agnus Dei* all’8 agosto, con l’interruzione dal 10 maggio all’8 agosto; Welchman (cap. 7 e cap. 13) ricorda le prime Bombe operative non prima del settembre 1940 e la ripresa delle decifrazioni al 20 maggio, senza Bombe; secondo Welchman Hinsley dà l’agosto 1940 (vol. 1, p. 184) e la fine di maggio (vol. 1, p. 494). La lezione 4 di crittoanalisi riporta tutte le versioni.
- Fine della doppia cifratura nel 1940: Bauer (p. 123) 1° maggio, Welchman (cap. 7) 10 maggio, ma nel cap. 13 ricorda il 15; Singh (cap. 4) 10 maggio. La lezione 4 di crittoanalisi scrive «nel maggio del 1940».
- Hinsley, *British Intelligence in the Second World War*, resta non consultato. Le sue tesi su Ultra arrivano da Sebag-Montefiore (introduzione e note 3, 4, 7–10: autunno 1941, maggio 1943, sbarco al 1946 nella conferenza del 18 febbraio 1992) e da Singh (cap. 4: guerra finita nel 1948 invece che nel 1945); la lezione 6 di crittoanalisi le attribuisce a quei libri. Il periodo «between October and November 1941» di Sebag-Montefiore (vol. 2, p. 174) va confrontato con Hinsley.
- Singh (cap. 4) dà al riflettore della macchina navale 26 posizioni; Sebag-Montefiore (cap. 19) e il motore no: le 26 posizioni in più vengono dal rotore sottile della M4, dal 1° febbraio 1942. La lezione 5 di crittoanalisi lo dice.
- Numero di Bombe: Singh (cap. 4) 15 Bombe otto mesi dopo l’agosto 1940 e 49 alla fine del 1942; Welchman (cap. 13 e cap. 8) da otto a dodici alla fine del secondo anno e «some forty to forty-six» con Gayhurst. Le lezioni non danno numeri.

- Missioni della home, traduzioni: sono nostre. In Barbarossa «Aufkl. Abteilung» è reso con
  «reparto esplorante», «Fliegerstraße» resta in tedesco (nome di una strada, forse) e «röm. eins»
  è letto come I battaglione; in U-264 «14 mb» è letto 1014 millibar come fa Krah.
- Missione Scharnhorst: affondamento «una ventina di minuti dopo» e 36 superstiti vengono da
  Beesley, *Very Special Intelligence*, p. 216, letto solo nel brano che riporta Weierud. L’ora
  19:25 è il «T.O.O.» del modulo, senza fuso orario; il Duke of York la ricevette alle 18:32 Z.
- Missione U-264: Erskine non dice che nave fosse HMS Hurricane; il testo la chiama «nave
  britannica».
- Guida per i docenti: lo schermo intero della modalità LIM non è stato provato (il pannello del
  browser della sessione lo rifiuta); da provare su una LIM vera. I collegamenti con il curricolo
  citano la Direttiva 16 gennaio 2012, n. 4: da aggiornare quando le Linee guida della riforma
  degli istituti tecnici arriveranno al triennio.

## Verificato (rotori dell’Enigma D, 2026-11-04)

Il cablaggio dei rotori commerciali in `COMMERCIAL_ROTORS` (`src/engine/models.ts`) è corretto: nessuna modifica al motore, nessun vettore nuovo.

| Fatto | Fonte | Dove |
|---|---|---|
| Rotori I `LPGSZMHAEOQKVXRFYBUTNICJDW`, II `SLVGBTFXJQOHEWIRZYAMKPCNDU`, III `CJGDPSHKTURAWZXFMYNQOBVLIE` e riflettore `IMETCGFRAYSQBZXWLHKDVUPOJN` coincidono con le pagine «Enigma D» e «Cablaggi» di Crypto Museum, che li dichiara identici a quelli della K | `crypto-museum-enigma-d`, `crypto-museum-cablaggi` | `models.ts` |
| Le stesse stringhe sono nel catalogo dei cablaggi dell’NSA (modulo del luglio 1952, pubblicato da CryptoCellar, cap. 4, p. 44) sotto «“A” or Old Commercial» | `cryptocellar` | `models.ts` |
| Il rotore I `HRWYIPCGVXLAFUJBKODTSMZNQE` che dà Bauer, *Decrypted Secrets*, p. 124, è un altro cablaggio: lo stesso catalogo lo elenca a p. 43 sotto «“A” (Old Commercial)», con il riflettore uguale e rotori II e III diversi. Appartiene a una macchina più antica, non alla D | `cryptocellar` | non usato |
| Cablaggio delle cinque D «STAB» (A327, A328, A343, A344, A345), con i rotori ritoccati: I `LZGSPMHAEOQKUXRFYBVTNICJDW`, II `SLVJBTFXGQOHEWIRCYAMKPZNDU`, III `CJGDPSAKTURHWZXFMQNYOBVLIE` | `crypto-museum-cablaggi` | non nel motore |

Nota: la lettura del catalogo viene da `pdftotext` su una scansione; nella pagina 71 (A-837) c’è un refuso evidente di OCR (`VKRF` al posto di `VXRF`), che conferma di non fidarsi di una sola stringa letta così.

## Verificato (fase 4a, 2026-11-04)

Pagine di Crypto Museum consultate il 4 novembre 2026 con `curl`; ognuna ha una voce in
`src/content/fonti.yaml`.

| Fatto | Fonte | Dove |
|---|---|---|
| Enigma I introdotta nel 1930, esercito e aviazione; il pannello a spine esclusivo delle forze armate tedesche | `crypto-museum-enigma-i` | `models.ts`, lezione 11 |
| M1 dal 1934, M2 dal 1938, M3 dal 1940, elettricamente identiche; M4 dal 1° febbraio 1942 | `crypto-museum-m3`, `crypto-museum-m4`, `crypto-museum-cablaggi` | `models.ts`, lezione 11 |
| Enigma D del 1926, sostituita dalla K nel 1927; K prodotta dal 1927 al 1944, usata dalla marina italiana per tutta la guerra | `crypto-museum-enigma-d`, `crypto-museum-enigma-k` | `models.ts`, lezione 11 |
| Swiss-K dal 1939, ricablata dagli svizzeri, ritirata nel 1946; KD del Mil Amt dal 3 dicembre 1944 sulla linea Berlino–Madrid–Lisbona, esemplare del FRA; Reichsbahn: traffico dal 25 luglio 1940, difficoltà dal 19 settembre al 28 ottobre 1944 per i crib | `crypto-museum-swiss-k`, `crypto-museum-enigma-kd`, `crypto-museum-railway` | `models.ts`, lezione 11 |
| Enigma T derivata dalla K, procedura TIRPITZ dal 1° agosto 1943 | `crypto-museum-enigma-t` | `models.ts`, previsione della lezione 11 |
| A28 del 1928, sostituita dalla G31 nel 1931, A865 alla marina olandese; G prodotta dal 1931 al 1943; l’Abwehr cablava da sé i rotori; G111 del 1931 all’esercito ungherese; G312 del 1940 circa; G260 sequestrata in Argentina nel marzo 1945 | `crypto-museum-a28`, `crypto-museum-enigma-g`, `crypto-museum-g111`, `crypto-museum-g312` | `models.ts`, lezione 11 |
| Norvegese: Enigma I catturate, ricablate dal 1945 dall’Overvaakingspolitiet | `crypto-museum-cablaggi` | `models.ts`, lezione 11 |

## Verificato (fase 4f, 2026-11-04)

Fonti consultate in rete il 4 novembre 2026 con `curl` (la pagina di Franklin Heath da Internet
Archive, perché il sito rispondeva con un errore del database). Ogni chiave e ogni indicatore
sono controllati anche dal motore: la build decifra ogni parte di `src/content/missioni.yaml`.

| Fatto | Fonte | Dove |
|---|---|---|
| Barbarossa: messaggio n. 20 del 7 luglio 1941, da «SS-T Div Kdr» a «LVI AK», alle 19:25, due parti (RFUGZ, FNJAU); chiave del giorno B, II IV V, anelli BUL, spine AV … RX; indicatori WXC KCH → BLA e CRS YPJ → LSD | Ostwald e Weierud, pp. 1, 7–8 | missione Barbarossa |
| Barbarossa: la seconda parte ha 150 lettere cifrate; la versione di Franklin Heath (e del simulatore di Summerside) si ferma a 135 e perde «KAMENEC X DIV X KDR X» | Ostwald e Weierud, p. 8; motore | missione e `historical.test.ts` |
| Oltre 500 messaggi del 1941 e del 1945 dalle carte di Waldemar Werther, ufficiale del servizio d’ascolto della Luftwaffe; messaggi del 1941 dal gruppo d’armate Nord durante Barbarossa, tutti di unità SS o Waffen-SS; attacco al solo testo cifrato con metodi statistici | Sullivan e Weierud, pp. 193–195 | missione Barbarossa |
| U-264: ricevuto alle 18:40 Z del 19 novembre 1942 (T.O.R. 1840/19Z), dall’appendice II al rapporto n. 110/S di HMS Hurricane del 25 novembre 1942; intercettato durante il blackout di Triton; pubblicato come sfida su Cryptologia nell’ottobre 1996 | Erskine 1996 | missione U-264; il nome del test in `historical.test.ts` diceva 25 novembre ed è stato corretto |
| U-264: chiave (Beta II IV I, B sottile, anelli AAAV, chiave del messaggio VJNA), rotto il 20 febbraio 2006 dal progetto M4 con il calcolo distribuito; testo ritrovato da Dan Girard nel diario di guerra di U-264 (NARA T1022, bobina 2886); Looks Kapitänleutnant su U-264 | Krah, «First break» e pagina del progetto | missione U-264 |
| Scharnhorst: intercettato da D. Rough sul Duke of York, 6475 kHz, la sera del 26 dicembre 1943; decifrato a Bletchley Park il 13 gennaio 1944 con la nota «ultima trasmissione»; modulo fra le carte di Edward Thomas; chiave (B, III VI VIII, anelli AHM, UZV) trovata dal progetto M4 il 28 maggio 2008 in meno di un giorno | Weierud, «Scharnhorst’s Last Message?» | missione Scharnhorst |

## Verificato (fase 4e, 2026-11-04)

Fonti: Welchman (trascrizione senza pagine, si citano capitoli e appendice), Sebag-Montefiore (epub senza pagine, capitoli, appendici e cronologia), Singh (epub, capitolo 4 «Far breccia in Enigma», e l’edizione inglese per ragazzi per la frase di Hinsley), Turing, *Treatise*, cap. 1 (pagine dell’originale). Lezioni della sezione Crittoanalisi. I numeri del crib WETTERVORHERSAGE sono calcolati con il motore (`src/engine/cryptanalysis.ts`) sulla chiave di `MenuBombe`.

| Fatto | Fonte | Lezione |
|---|---|---|
| Fine dei fogli britannici (*Jeffreys sheets*) con il cambio di procedura del maggio 1940; Welchman a capo della Hut 6 | Welchman, cap. 7, cap. 11 | 4 |
| Crib: definizione, gergo scolastico, indirizzi e firme stereotipati | Welchman, cap. 4 | 4 |
| «Il risultato della cifratura di G non può mai essere G» | Turing, *Treatise*, cap. 1, p. 2 | 4 |
| Menu come grafo con le posizioni; nome «menu» | Welchman, cap. 4; Sebag-Montefiore, app. 2 | 4 |
| Macchina di Turing: rotori sfalsati mossi insieme su 26³ posizioni, test automatico; menu con tre anelli; crib lunghi | Welchman, cap. 4; Sebag-Montefiore, app. 2 | 4 |
| Deduzioni da un’ipotesi sul pannello, fatte a mano su una copia senza pannello | Sebag-Montefiore, app. 2 | 4 |
| Diagonal board: idea di Welchman nell’autunno 1939 («before the war was three months old»), Turing incredulo e poi convinto, Travis vicedirettore, Keen della BTM e due prototipi; matrice 26 × 26, nome forse di Keen | Welchman, cap. 4, app. I | 4 |
| Numero delle configurazioni non misura la sicurezza, «it could happen again» | Welchman, cap. 4 | 4 |
| Menu corti e scatto del rotore di mezzo | Welchman, app. I | 4 |
| *Simultaneous scanning*; fermata quando la corrente non raggiunge tutte le lettere | Sebag-Montefiore, app. 2; Welchman, cap. 8 | 4 |
| Dodici gruppi di tre tamburi; Wrens; 12–15 minuti per ordine, 12–15 ore e più per 60 ordini; fermate false | Welchman, app. I, cap. 8 | 4 |
| Bombe «non fu figlia di una sola persona», sviluppata dalle idee polacche | Welchman, cap. 4 | 4 |
| Otto rotori e 336 ordini; operatori senza formule fisse | Singh, cap. 4; Sebag-Montefiore, cap. 19 | 5 |
| Indicatore navale: due trigrammi dal *Kenngruppenbuch*, uno cifrato dalla *Grundstellung*, tabelle dei bigrammi | Sebag-Montefiore, app. 3 | 5 |
| Venti minuti per ordine, 112 ore per 336 ordini; *Banburismus* per ridurre gli ordini, con tabelle dei bigrammi anche parziali | Sebag-Montefiore, cap. 19, app. 3 | 5 |
| *Krebs* (4 marzo 1941), *München* (7 maggio), U-110 (9 maggio), *Lauenburg* (28 giugno): che cosa diede ciascuna; tempi di lettura da dieci giorni a sei ore; tabelle cambiate il 15 giugno e il 29 novembre | Sebag-Montefiore, cap. 13, cronologia | 5 |
| U-110: Balme, un’ora e mezza; Giorgio VI («perhaps the most important single event…») e Sebag-Montefiore che lo smentisce | Sebag-Montefiore, cap. 13 | 5 |
| Nessuna cattura basta una volta per tutte; storie interne rese pubbliche nel dicembre 1999 | Sebag-Montefiore, introduzione | 5 |
| M4 dal 1° febbraio 1942 su Triton/Shark; rotore nuovo regolabile a mano, fermo, non intercambiabile; 336 invece di 3 024 ordini; cablaggi ricavati dagli errori di dicembre 1941 | Sebag-Montefiore, cap. 19 | 5 |
| Crib dai bollettini meteorologici brevi fino al 20 gennaio 1942; crib di Dönitz del 14 marzo 1942, sei Bombe per 17 giorni; *Banburismus* inutile con la M4 | Sebag-Montefiore, cap. 19, cronologia | 5 |
| Rapporto del 9 febbraio 1942 («out of focus»); più di quattro milioni di tonnellate nei primi otto mesi del 1942; costa americana e cifrario navale n. 3 | Sebag-Montefiore, cap. 19 | 5, 6 |
| U-559 (30 ottobre 1942): cinque cacciatorpediniere, dieci ore, Fasson, Grazier, Brown; libro arrivato il 24 novembre; rottura del 13 dicembre con il rotore sottile neutro nei messaggi brevi; messaggio di Pound a King | Sebag-Montefiore, cap. 20, cronologia | 5 |
| Bombe a quattro rotori: britanniche non affidabili, statunitensi dopo il maggio 1943 | Sebag-Montefiore, introduzione | 5 |
| Winterbotham nel 1974, Ultra, segreto di trent’anni | Welchman, prologo; Singh, cap. 4 | 6 |
| PQ12 (marzo 1942, 18 navi, decifrazioni in due o tre ore); PQ17 (luglio 1942, Denning e Pound, 23 navi su 35) | Sebag-Montefiore, cap. 19, cronologia | 6 |
| 58 divisioni stimate prima dello sbarco | Singh, cap. 4 (citazione di Hinsley) | 6 |
| Rischio di affondare troppe navi e tradire il segreto | Sebag-Montefiore, introduzione | 6 |
| Tesi di Singh («fuori discussione», «non in modo unanime», 1948) | Singh, cap. 4; *The Code Book* per ragazzi, cap. 4 | 6 |
| Tesi di Sebag-Montefiore su catture, Schmidt e polacchi; bomba atomica | Sebag-Montefiore, introduzione e note 2–4, 10 | 6 |
| Tesi di Welchman: persone e organizzazione; Hinsley sulla prima Bombe senza i polacchi «utter nonsense»; 34 commenti di Rejewski (*Cryptologia*, gennaio 1982) | Welchman, cap. 13 | 6 |
| Welchman scrive a memoria e non conosce i metodi dei «wizards» | Welchman, cap. 13, app. I | 6 |

## Verificato (fase 4d, 2026-11-04)

Fonti: Rejewski 1980 (traduzione CryptoCellar, pagine della trascrizione) e Kozaczuk, con le appendici di Rejewski (pagine stampate). Lezioni della sezione Crittoanalisi.

| Fatto | Fonte | Lezione |
|---|---|---|
| Primi messaggi militari cifrati con Enigma intercettati dal 15 luglio 1928; corso di Poznań fra il 1928 e il 1929; Rejewski, Różycki e Zygalski assunti a Varsavia il 1° settembre 1932 | Kozaczuk, app. D, pp. 246–247 | 1 |
| Indicatori doppi, AD, BE e CF, circa 80 messaggi, frammenti DVPF, OUMB, CQNY, caratteristica (1) | Rejewski 1980, pp. 5–6 | 1 |
| Teorema dei cicli a coppie, candidati per A, B, C, esempio «jjj», «long tests, imagination…» | Rejewski 1980, pp. 9–11 | 1 |
| Equazioni con S, N, Q; chiavi francesi del dicembre 1932 con il pannello; Bertrand a Varsavia dal 7 all’11 dicembre 1932; Asché identificato da Kahn con Hans-Thilo Schmidt | Rejewski 1980, pp. 7–11; Kozaczuk, pp. 17–18, p. 22 n. 2; app. D, pp. 258–259 | 1 |
| Ruota d’ingresso in ordine alfabetico, indovinata; chiavi di settembre e ottobre 1932, ordine dei rotori trimestrale; materiale francese «decisivo»; copie dell’AVA | Kozaczuk, app. D, pp. 257–259, p. 261 | 1 |
| Griglia, ANX, orologio di Różycki; ordine dei rotori mensile dal 1° febbraio 1936 e giornaliero dal 1° ottobre 1936; da cinque a otto cavi dal 1° ottobre 1936 | Kozaczuk, app. D, pp. 259–263; p. 63 n. 3 | 2 |
| Ciclometro dell’AVA, due serie con il rotore destro sfalsato di tre, lampadine in numero doppio della lunghezza del ciclo; 105 456 posizioni; più di un anno di lavoro; dai dieci ai venti minuti per chiave | Rejewski 1980, pp. 14–15; Kozaczuk, app. D, pp. 263–264 | 2 |
| Statistica del 75 % dei messaggi letti all’inizio del 1938 | Kozaczuk, app. D, p. 265 | 2 |
| Procedura del 15 settembre 1938 (SHP; CHV PZT), rete SD alla vecchia procedura fino al 1° luglio 1939 | Kozaczuk, app. D, pp. 265–266, p. 269 | 3 |
| Femmine (*samiczki*); circa il 40 % delle posizioni con punti fissi; fogli di Zygalski (26 per serie, 51 × 51, circa 60 cm, circa mille fori, quattro volte), due serie al 15 dicembre 1938 | Rejewski 1980, pp. 16–18; Kozaczuk, p. 54; app. D, pp. 267–268 | 3 |
| Bomba: tre messaggi con la stessa lettera, sei serie di rotori, circa due ore, sei bombe dell’AVA (Palluth) nel novembre 1938, pannello che non tocca la lettera una volta su due | Kozaczuk, pp. 53–54; app. D, pp. 266–267 | 3 |
| Rotori IV e V dal 15 dicembre 1938, ricostruiti dalla rete SD; 58 serie e 36 rotori per tipo mancanti; un giorno su dieci; 60 bombe per circa 1,5 milioni di złoty contro 100 000 | Kozaczuk, pp. 54–55, p. 63 n. 6 e 7; app. D, pp. 268–269 | 3 |
| Pyry: sezione nel bosco dal 1937; partecipanti; due copie della macchina a Bertrand, una ai britannici il 16 agosto alla stazione Victoria; domanda di Knox sulla ruota d’ingresso; 60 serie di fogli dai britannici, 83 chiavi su 100 | Kozaczuk, p. 43, pp. 59–60; app. D, p. 257, pp. 269–270 | 3 |
| Rejewski contro Hinsley sul motivo della condivisione | Kozaczuk, p. 64 n. 8 | 3 |

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
