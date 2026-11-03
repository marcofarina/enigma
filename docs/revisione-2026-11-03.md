# Revisione del progetto contro le norme del workspace

Revisione del 2026-11-03, prima sessione in locale. Il lavoro precedente (fasi 0–3d, PR
marcofarina/enigma#1–#10) è stato fatto in sessioni cloud, che non avevano accesso a
`norms/`. Questo documento elenca che cosa ne è risultato; il piano per correggerlo è in
`docs/piano-aggiornamento.md`.

Fonti delle regole: `norms/contenuto.md`, `scrittura-umana.md`, `scrittura-didattica.md`,
`scrittura-tecnica.md`, `scrittura-parlata.md`, `paideia-os/templates/scrittura-italiana.md`.
Le citazioni «§n» rimandano a quei file.

## Stato verificato

| Fatto | Come è stato accertato (2026-11-03) |
|---|---|
| `pnpm verify` passa: 170 test, 34 pagine | `pnpm install --frozen-lockfile && pnpm verify` → exit 0 |
| `lint:content`: 0 errori, 8 avvisi, tutti falsi positivi | `node scripts/lint-content.ts` |
| I test e2e non sono stati eseguiti in locale | Playwright è fissato a 1.63.0 per il container cloud |
| Il repo non importa le norme del workspace | `ls .claude` → non esiste; `CLAUDE.md` non contiene `@.claude/norms/` |

## 1. Infrastruttura e documenti operativi

1. **Le norme non arrivano alle sessioni.** Manca il symlink `.claude/norms -> ../../norms` e
   `CLAUDE.md` non importa nulla. È la causa dei problemi di testo elencati sotto. Nel cloud il
   symlink resterebbe comunque rotto, perché `norms/` è un repo separato e privato.
2. **Conflitto sulle virgolette.** `CLAUDE.md` di enigma prescrive “curve” ovunque; le norme
   (`contenuto.md`, `scrittura-italiana.md`) vogliono « » per le citazioni e “ ” solo per le
   virgolette interne. L’eccezione che toglie i caporali vale solo per Python Doesn’t Byte. Oggi
   tutto il sito usa “ ”. Va deciso quale regola vince (vedi le decisioni nel piano).
3. **`docs/piano.md` non segue il formato dei piani di Marco**: niente modello ed effort per fase,
   niente prompt di apertura, criteri di accettazione a parole, nessuna stima di durata.
4. **`README.md` è fermo alla fase 0**: la tabella «Stato» dà la fase 0 «in corso» e le fasi 1–3
   «da fare», mentre sono unite in `main`. Anche la frase «Il progetto è agli inizi» è falsa.
5. **`docs/stato.md` contiene note valide solo nel container cloud**: Node in `/opt/node24`,
   browser in `/opt/pw-browsers`, simulatore originale in `/home/user/EnigmaMachine`, Playwright
   fissato «finché l’ambiente non cambia».
6. **Il linter dei contenuti non controlla buona parte delle norme.** Mancano: `...` al posto di
   `…`, «sennò», «qual’è», matematica fuori da `<Formula>` (caratteri come `⁻¹`, `ⁿ`, `×`),
   separatore delle migliaia non separabile, caporali, `src/i18n/it.json`. Gli otto avvisi attuali
   sono tutti nomi propri o date («Cesare», «Spagna», «dal 31 all’1»): un linter che segnala solo
   falsi positivi insegna a ignorarlo.

## 2. Errori di fatto e incoerenze tra pagine

Da correggere per primi: sono sbagliati indipendentemente dallo stile.

| Dove | Problema | Correzione |
|---|---|---|
| `come-funziona/07…:39` | «150 738 274 937 250, circa 150 milioni di miliardi»: il numero vale $1{,}5 \times 10^{14}$, cioè circa 150 000 miliardi. 150 milioni di miliardi sono $1{,}5 \times 10^{17}$ | «circa 150 000 miliardi» (come già scrive `storia/02…:26`) |
| `come-funziona/06…:18` e `storia/01…:34` | Lo stesso ingegnere è «Willi Korn» in una lezione e «Willy Korn» nell’altra | Una grafia sola, verificata (Crypto Museum usa «Willi») |
| `come-funziona/01…:12` e `storia/02` | La lezione 1 dà «marina nel 1926, esercito nel 1928»; la storia 2 dà Enigma I pronta nel 1927 e in servizio dal 1° giugno 1930. Il sito si contraddice. Già segnalato in `stato.md`, mai corretto | Allineare la lezione 1 alla storia 2 |
| `glossario.yaml:87` (involuzione) | «Il riflettore e il pannello a spine sono involuzioni, e quindi lo è anche la sostituzione di Enigma»: il «quindi» è falso, la composizione di involuzioni non è in generale un’involuzione. La lezione 8 dà il motivo giusto (coniugio) | Riscrivere la definizione rimandando al coniugio |
| `glossario.yaml:59` (doppio passo) | «avanza per due tasti di seguito insieme al rotore di sinistra»: il centrale avanza con il sinistro solo al secondo tasto; al primo lo trascina il veloce | Riscrivere come in `come-funziona/05…:33` |
| `glossario.yaml:128`, `come-funziona/06…:42`, `storia/03…:35` | L’UKW-D è introdotto «dalla Luftwaffe» (glossario) e «dalle forze armate tedesche» (lezione 6) | Una sola attribuzione, con fonte |
| `come-funziona/05…:50` e `08…:97` | La lezione 5 presenta il 16 926 di Crypto Museum come un periodo calcolato male; la lezione 8 usa lo stesso 16 926 come numero corretto delle posizioni iniziali distinte. Sono due grandezze diverse, ma nessuna delle due lezioni lo dice | Una frase in ciascuna che distingua periodo e posizioni distinte |
| `come-funziona/05…:50` | «Chi vuole può verificarlo con la funzione `step` del motore»: lo studente non ha accesso al motore. È una nota per sviluppatori finita nella prosa | Toglierla o sostituirla con un’azione nel simulatore |
| `storia/04…:34` | Didascalia «Prova come Mavis Lever: premi la L…»: Mavis Lever non premeva tasti, dedusse dall’assenza della L nel cifrato. La didascalia contiene anche un’istruzione, che non è il suo compito | Didascalia descrittiva; l’istruzione va nella prosa |
| fonti nel frontmatter | `singh-codici-segreti` (lezioni 1, 2), `batey-dilly` (storia 4), `bauer`, `rejewski-1980`, `hamer-1997` compaiono come fonti, ma `stato.md` dice che i fatti relativi sono ancora «da controllare su Singh / Batey». La pagina mostra al lettore come fonte un libro che nessuno ha consultato | Tenere solo le fonti effettivamente consultate; le altre tornano quando Marco verifica sulla sua copia |
| `src/engine/models.ts:124` | `period: '1932–1945'` per l’Enigma I, contro l’entrata in servizio nel 1930 delle lezioni. Già in `stato.md` | Allineare |

## 3. Testi delle lezioni contro le norme

### Pattern ricorrenti su tutto il corpus

| Pattern | Occorrenze | Norma |
|---|---|---|
| Rimandi a «la sezione sulla crittoanalisi», che non esiste ancora | 5 (lezioni 6, 7, 8; storia 2, 3) | didattica §2 (la promessa senza dimostrazione), umana §7 |
| «dettaglio» come formula a effetto: «C’è però un dettaglio», «Sembra un dettaglio, ma…», «che sembra un dettaglio», «grazie a un dettaglio», «su questo dettaglio» | 6 | umana §11 (formula che ritorna), §2 |
| «proprio» ed «esattamente» come intensificatori | 6 + 3 | umana §4 |
| Matematica in Unicode nella prosa invece che con `<Formula>`: `ρ⁻ᵏ σ ρᵏ`, `U = U⁻¹`, `R⁻¹ U R`, `N(n) = 26! / ((26 − 2n)! · n! · 2ⁿ)`, `26 × 26 × 26 = 17 576`, `5 × 4 × 3 = 60` | lezioni 4, 5, 6, 7; storia 2 | `scrittura-italiana.md`, «Espressioni matematiche». La lezione 8 usa già `<Formula>`: il sito è incoerente |
| Separatore delle migliaia con spazio normale: «17 576» va a capo in mezzo al numero (verificato nel browser) | tutte le cifre a gruppi | tipografia |
| Le lezioni 3–7 hanno la stessa forma: apertura, sezione, componente interattivo, «Prova a…/Premi…», `Nota`, `Approfondimento` | 5 lezioni di fila | didattica §7 («due lezioni di fila non devono avere la stessa forma») |
| I componenti interattivi illustrano invece di provare: la prosa dà subito il risultato. Esempio: `05…:37` «Premi il tasto tre volte. Da ADU si passa ad ADV; poi…» rivela l’esito prima che lo studente lo preveda | quasi tutti | didattica §6 (prevedere ed essere smentiti) |
| Manca lo scheletro minimo: niente citazione d’apertura, prerequisiti, obiettivi, riepilogo | tutte le 12 lezioni | didattica §7 (da decidere se vale per Enigma) |
| Termini usati senza definizione: «principio di Kerckhoffs» (`08…:83`), «coniugio» compare nell’approfondimento della lezione 4 prima della definizione della lezione 8; «nottolino» (lezione 5) e «leva» (glossario) per lo stesso pezzo | 3 | didattica §8 |
| Virgolette “ ” per le citazioni dove le norme vogliono « » | ovunque | vedi §1.2 |

### Lezione per lezione

**Come funziona 1 — Che cos’è Enigma**
- `:16` «Nelle prossime tappe smonteremo la macchina pezzo per pezzo…» è telecronaca della
  struttura (umana §7), e «Alla fine sarà chiaro perché Enigma sembrava inviolabile — e quali
  scelte di progetto la resero invece vulnerabile» è una chiusa da trailer (umana §8).
- `:14` «Il segreto sta in ciò che accade…»: schiarimento di gola (umana §2).
- Tre paragrafi, nessun componente: è un’introduzione, non una lezione con una tesi (didattica §1).

**2 — Dalla sostituzione al rotore**
- `:17` «conviene partire da molto più lontano»: schiarimento di gola.
- `:33` «una contromossa geniale»: aggettivo di importanza non sostanziato (umana §3).
- `:45` «È esattamente ciò che fa un rotore»: zavorra.
- `:47` ripete quasi parola per parola `storia/01…:20` (Hebern, Damm, Koch, Scherbius, van Hengel
  e Spengler): ridondanza fra pagine (didattica §4). Va in una sola delle due.
- `:36` la `Nota` chiude con «Il principio, però, è lo stesso»: chiusa che non aggiunge nulla.

**3 — Tastiera, lampade e circuito**
- `:27` «Da questo semplice schema discendono due proprietà fondamentali»: «fondamentali» non
  sostanziato (umana §3).
- Buona la struttura del deviatore: è l’unico punto in cui un modello ridotto prova qualcosa.

**4 — I rotori**
- `:17` «Il rotore è il cuore di Enigma»: frase fatta.
- `:29` catena di «si» impersonali («Si numerano… si sposta… si segue… si toglie»): parlata §1.
- `:39` titolo della `Nota` in forma di domanda al lettore («A che cosa serve, allora, l’anello?»):
  parlata §4.
- `:44` matematica in Unicode e «coniugio» introdotto prima della lezione 8.

**5 — Il passo e il doppio passo**
- `:33` «C’è però un dettaglio.»: schiarimento di gola.
- `:37` il componente non chiede la previsione: la prosa la dà (didattica §6).
- `:45` matematica in Unicode; la tabella `:25` è **rotta in pagina** (vedi §5).
- `:50` vedi gli errori di fatto (16 926, funzione `step`).

**6 — Il riflettore**
- `:22` «Ne segue una comodità enorme»; `:32` «Sembra un dettaglio, ma fu…»: contrasto con rampa
  (umana §1) e formula ricorrente.
- `:22` «Non serve una procedura separata, né una seconda macchina»: elenco di negazioni.
- `:39` matematica in Unicode.

**7 — Il pannello a spine e l’Uhr**
- `:39` l’errore di grandezza (150 milioni di miliardi).
- `:17` «Ed è proprio il pannello…»; `:39` «curiosamente»: zavorra.
- `:27` «Il conteggio in basso dice…»: un dato che «dice» (didattica §8, verbi letterali).
- `:29` «Ecco la stessa macchina…»: schiarimento di gola.
- `:44–48` formula e calcoli in Unicode.
- `:70` «Si legge a volte che l’Uhr rendesse Enigma non reciproca. Non è così»: contrasto ammesso
  solo se si sa chi lo scrive (tecnica §2). Serve la fonte della misconcezione, o va tolto il
  «si legge».
- La lezione tiene insieme due argomenti, il pannello e l’Uhr: due tesi, quindi due lezioni
  (didattica §1).

**8 — La matematica di Enigma**
- `:55` «Questa proprietà, che sembra un dettaglio, ebbe un ruolo centrale»: formula ricorrente e
  rimando alla sezione che manca.
- `:83` «principio di Kerckhoffs» senza definizione.
- `:105` «La storia della crittoanalisi di Enigma è, in gran parte, la storia di queste
  scorciatoie»: chiusa da articolo divulgativo (didattica §10).
- `:37`, `:51` `<Formula>` su numeri puri («10, 4, 4, 3, 2, 2»): la norma esclude i numeri senza
  operatori.
- Il piano prometteva di spiegare perché le fonti danno cifre diverse per lo spazio delle chiavi
  (Singh contro gli specialisti): la lezione non lo fa.

**Storia 1 — Scherbius e le macchine commerciali**
- `:16` «Enigma non nacque come arma.»: apertura con negazione-vetrina (umana §1).
- `:34` «Per chi la usava era una grande comodità; per chi l’attaccava… fu un regalo»: antitesi a
  effetto in coda (parlata §5).
- `:20` duplicato della lezione 2.

**Storia 2 — L’adozione militare**
- `:22` «una novità che ne cambiava la sicurezza»: vago, il fatto arriva solo dopo.
- `:44` titolo-slogan «Più rotori, più chiavi».
- `:50` rimando alla sezione che manca.

**Storia 3 — Fogli chiave e procedure**
- `:19` «Una macchina cifrante è sicura solo quanto le regole con cui la si usa»: massima d’apertura
  (umana, passata finale n. 10).
- `:47` «la stessa identica sequenza»: ridondanza.
- `:58` «costruirono su questo dettaglio» e rimando alla sezione che manca.
- È la lezione costruita meglio: il foglio 619 e la citazione in tedesco sono fonti primarie usate
  bene.

**Storia 4 — Enigma e l’Italia**
- `:30` «grazie a un dettaglio»; `:32` «era esattamente ciò che serviva»: formula e zavorra.
- `:22` «un punto debole evidente: niente pannello a spine»: frammento nominale (parlata §7).
- `:34` didascalia (vedi errori di fatto).
- La `Nota` «Una storia raccontata da una parte sola» è un buon esempio di onestà sulle fonti.

### Glossario, didascalie, fonti
- Glossario: oltre agli errori di §2, le definizioni sono frammenti nominali («Corona con le
  lettere…»). In un glossario la forma è accettabile; va solo decisa e tenuta uguale. Mancano voci
  per termini usati nelle lezioni: nottolino, deviatore, coniugio, Kerckhoffs, Kenngruppenbuch.
- La pagina mostra «DE —» per le voci senza termine tedesco: meglio omettere il campo.
- Didascalie di `immagini.yaml`: corrette e descrittive; nessun rilievo.

## 4. Interfaccia (`src/i18n/it.json` e pagine)

| Dove | Problema | Norma |
|---|---|---|
| `it.json:55` | «richiede esattamente 10 cavi», «multiple di 4» | numeri in lettere; «esattamente» zavorra |
| `it.json:82`, `:232` | «1 lettera», «1 cavo» | numeri in lettere |
| `it.json:377` | «Vuoi lavorare su carta? Prepara…» | domanda retorica (didattica §10) |
| `it.json:250` | «Corretto!» | entusiasmo (umana §8); basta «Corretto.» |
| `it.json`, `ex.intro` e `sheet.intro` | «nasce da un numero» in due testi vicini | formula ripetuta |
| `pages/index.astro` | Home da modello: occhiello in maiuscoletto monospaziato, titolo-slogan «La macchina Enigma, dentro e fuori», tre schede con verbi da pulsante («Prova la macchina», «Scopri come funziona», «Mettiti alla prova»), «un simulatore fedele» senza dire fedele a che cosa. La Storia, unica sezione di contenuto oltre a Come funziona, non compare | umana §3, §5; parlata §4 |
| `pages/index.astro`, `come-funziona/index.astro`, `crittoanalisi`, `docenti`, `fonti` | Testi scritti nel codice invece che in `it.json`, mentre le altre pagine usano `t()` | i18n predisposta per l’inglese: così non lo è |
| Menu principale | Due voci su sei (Crittoanalisi, Docenti) portano a pagine «in preparazione»; Glossario e Schede stanno solo nel piè di pagina | navigazione |

## 5. Design (verificato nel browser, desktop e 375 px, chiaro e scuro)

| Problema | Dove | Gravità |
|---|---|---|
| Le tabelle Markdown non hanno stile: la tabella delle tacche si legge «Rotore I IIIIIIVV / Lettera della taccaQEV J Z» | `come-funziona/il-passo-e-il-doppio-passo/`; `.prose-it` non ha regole per `table` | alta, si vede |
| I blocchi di codice usano il tema scuro di Shiki su una pagina chiara, senza margini né padding: incollati ai paragrafi | `come-funziona/la-matematica-di-enigma/` | media |
| Numeri a gruppi spezzati a fine riga («26 × 26 × 26 / = 17 576») | lezione 5 e altre | media |
| Su 375 px l’intestazione va a capo male: logo a sinistra, menu compresso a destra, pulsante del tema su una riga da solo | tutte le pagine | media |
| Home da modello generico (occhiello, titolo grande, tre schede uguali) | `/` | media; è il primo schermo che si vede |
| Nessun font proprio: pile di sistema per sans, serif e mono. Coerente con il «tema neutro» del piano, ma l’identità resta da fare | `tokens.css` | da decidere |

Funzionano bene: i token di colore con tema chiaro e scuro e la variante LIM, il contrasto, il
simulatore su mobile (macchina prima della configurazione), la galleria, il glossario con
l’indice delle iniziali.

## 6. Codice

Il codice non mostra i difetti tipici del codice generato: commenti in italiano, brevi e che
spiegano il perché; motore puro e ben testato (proprietà, differenziale, messaggi storici); nessun
`any`, nessun `@ts-ignore`, nessuna astrazione inutile. Rilievi minori:

- Otto `eslint-disable`, cinque per `jsx-a11y`: contenitori `div` che catturano la tastiera
  (`MiniSimulatore.tsx:35`, `ExerciseSimulator.tsx:26`) ed elementi non interattivi con
  `tabIndex`. Da rivedere uno per uno invece di silenziare la regola.
- `AnimazionePasso.tsx:36` e `:58` silenziano `react-hooks/exhaustive-deps`.
- `come-funziona/index.astro` e `storia/index.astro` duplicano lo stesso markup dell’elenco delle
  lezioni.
- Nessun controllo automatico che la matematica in prosa passi da `<Formula>`.

## 7. Che cosa resta del piano originale

| Voce del piano | Stato |
|---|---|
| Fasi 0–3 | fatte e unite in `main` |
| Lezione «Modelli a confronto» (tabella + linea del tempo), prevista in «Come funziona» | **mai fatta** |
| `<Citazione fonte pagina>` per le citazioni brevi di Singh | **mai fatto** (nessuna citazione di Singh nei testi) |
| Spiegazione delle cifre diverse per lo spazio delle chiavi (Singh e specialisti) | **mai fatta** |
| Rinviati dalla 1b: cavi trascinabili sul pannello, schema in verticale su mobile, notazione tedesca dell’UKW-D | da fare |
| Fase 4: crittoanalisi (racconto: Rejewski, ciclometro, fogli di Zygalski, bomba, Pyry, Bletchley, Bombe, diagonal board, crib e menu, M4 e Shark, Ultra come dibattito) con animazioni (strutture dei cicli, loop di un menu) | da fare |
| Fase 4: vista «Macchina» 2.5D in SVG parametrico | da fare |
| Fase 4: missioni storiche precaricate (Barbarossa, U-264, Scharnhorst) | da fare; i vettori esistono già nei test del motore |
| Fase 4: guida per i docenti | da fare |
| Fase 4: revisione completa di accessibilità e prestazioni (budget Lighthouse ≥ 90 / 100) | da fare; il budget Lighthouse non è nei test |
| Fase 5: vista 3D (React Three Fiber) | da fare |
| Traduzione inglese | solo predisposta |
| Revisione dell’autore: tutte le 12 lezioni sono `stato: bozza` | da fare (Marco) |
| Verifiche esterne aperte in `stato.md` (date, Singh, Batey, Rejewski, Kozaczuk, UKW-D, K italiana) | da fare; quelle sui libri richiedono le copie di Marco |
