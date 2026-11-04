# Design di Enigma

Esito della fase G0 di `docs/piano-aggiornamento.md`. È il riferimento per G1–G4: chi le esegue
costruisce da qui, senza riaprire il canvas.

- Canvas di Claude Design: <https://claude.ai/artifact/LiZP195w7VcEG1EASAT6n5> (privato,
  dell’account di Marco). L’artboard di riferimento è «Bachelite con il foglio a 1280×720»
  (`A3-desktop.dc.html`); per il telefono vale «Bachelite a 375 px» (`A-mobile.dc.html`), con il
  foglio al posto del nastro (vedi «Versione ridotta»).
- Direzione scelta da Marco il 2026-11-04: la Bachelite (A) per i materiali, lo schema a tutta
  altezza di «Il circuito» (B) per la didattica, il foglio della «Tavola delle chiavi» (C) per la
  configurazione e il messaggio.
- Fatto verificato il 2026-11-04: il motore dei prototipi decifra il messaggio dell’operazione
  Barbarossa (II IV V, anelli 02 21 12, spine AV BS CG DL FU HZ IN KM OW RX, inizio BLA) nel testo
  in chiaro atteso, «AUFKLXABTEILUNGXVONXKURTINOWA…».

## Principi

1. **La macchina è un oggetto, il sito è carta.** Il simulatore ha i materiali della macchina vera:
   vernice nera raggrinzita, alluminio, finestrelle chiare, lampade che si scaldano. Tutto ciò che
   l’operatore scrive o legge è un foglio: la chiave del giorno, il messaggio, le pagine di lezione.
   Due materiali, nessun terzo.
2. **Ogni controllo sta sul pezzo che regola.** Le rotelle dei rotori sono in testa alle loro
   colonne nello schema; il riflettore sopra la sua; le spine si aprono dall’intestazione e si
   vedono nella colonna delle spine. Non esiste un pannello di configurazione separato.
3. **Il circuito è il protagonista didattico.** Tutti i fili sono sempre disegnati, tenui; il
   segnale li ripercorre in arancio (andata) e in azzurro (ritorno). Quando un rotore scatta, i
   suoi fili e le lettere del suo anello salgono di una riga: la rotazione si vede.
4. **Un solo schermo, nessuna attesa.** Da 1280×720 in su tutto sta nella finestra senza
   scorrere. Ogni animazione risponde a un tasto, dura meno di mezzo secondo e si interrompe al
   tasto successivo: non si accoda mai.
5. **Il colore porta informazione.** Ambra è solo luce (lampade accese, fuoco); arancio e azzurro
   sono solo segnale; il rosso è solo inchiostro di stampa del foglio. Nessun colore decorativo,
   nessun gradiente di riempimento, nessun bordo colorato a sinistra.

## Inventario: dove va ogni pezzo del simulatore

Ogni pezzo dell’attuale `src/components/simulator/Simulator.tsx` resta raggiungibile. Le righe
segnate «decisione» cambiano il comportamento di oggi.

| Pezzo di oggi | Funzione | Dove va |
| --- | --- | --- |
| Modello (`ConfigPanel`, con i gruppi «Modelli militari principali» e «Altri modelli») | scegliere la macchina | menu nell’intestazione, a sinistra, con gli stessi `optgroup` |
| Riflettore (UKW), anche sottile per l’M4 | scegliere il riflettore | menu nell’intestazione, accanto al modello; il nome si ripete sulla colonna del riflettore |
| Rotori (Walzenlage), scambio se già montato | scegliere i rotori | menu in testa alla colonna di ogni rotore; lo scambio resta |
| Anelli (Ringstellung) | regolare gli anelli | sotto ogni finestrella, «‹ anello 02 (B) ›» |
| Finestrelle (Grundstellung), frecce, rotella del mouse, lettera digitata | posizione dei rotori | in testa alla colonna di ogni rotore, con la rotella zigrinata; restano rotella del mouse e lettera digitata |
| Finestrella del riflettore (modelli G) | posizione del riflettore | in testa alla colonna del riflettore, solo per quei modelli |
| Pannello a spine (Steckerbrett), `PairEditor` | collegare i cavi | pannello ancorato «Spine: N cavi» dall’intestazione: prese cliccabili e campo delle coppie |
| Uhr | sostituire i cavi | nello stesso pannello delle spine |
| Cablaggio dell’UKW-D | ricablare il riflettore | pannello ancorato aperto da un pulsante «Cablaggio» sulla colonna del riflettore, solo per i modelli con UKW-D |
| Avvisi (`Issues`), tastiera bloccata | configurazione incompleta | nel vano dello schema, al posto del percorso, con il pulsante che apre il pannello da correggere |
| Lampade, tastiera | cifrare | colonna sinistra, in alto, lampade sopra i tasti |
| Nastro (`Tape`): tasti premuti, lampade accese, Copia, Annulla, Ripeti, Ricomincia | il testo | foglio, sezione «Messaggio»: gruppi di cinque, tasti in piccolo sopra e lampade in grassetto sotto; i pulsanti nella riga del titolo |
| Nota sull’annullare («sulla macchina reale non si poteva») | storia | decisione: esce dal simulatore e va nella lezione 1; sul pulsante Annulla resta come `title` |
| Traccia passo-passo (`TracePanel`) | seguire il segnale | piede dello schema: «Normale», «Al rallentatore» (1,4 s per tratto), «Passo passo» (con ◀ ▶) |
| Schema del circuito, «Mostra tutti i collegamenti» | il circuito | decisione: i fili sono sempre tutti visibili, l’opzione sparisce |
| Digita un testo (`TextInput`), «X al posto del punto», «Cifre scritte in lettere», conteggio | battere un testo | campo «Digita» in fondo al foglio; le due opzioni in un pannello ancorato «Opzioni» accanto al pulsante |
| Link condivisibile, codice QR, «Includi le lettere digitate» | condividere | pannello ancorato «Condividi» dall’intestazione |
| Modalità LIM | lavagna | pulsante nell’intestazione: schermo intero, contrasto LIM, stessa griglia scalata alla lavagna |
| Avviso di link non valido | errore | riga di stato in cima al foglio |
| — (nuovo) | procedura dell’operatore | riga «Chiave del giorno» nel foglio: mostra la configurazione attuale e carica chiavi pronte (decisione: ogni chiave storica richiede la sua voce in `src/content/fonti.yaml`) |

**M4 e modelli a quattro rotori.** Lo schema aggiunge la colonna del rotore sottile; le colonne
dei rotori passano da 180 a 135 px (a 1280×720) e la rotella resta in testa a ognuna.

## Griglia

Il progetto è disegnato a 1280×720 con `font-size` radice di 16 px; tutte le misure del codice si
scrivono in `rem` (qui in px a 1280×720, dividere per 16).

```text
 0   ┌──────────────────────────────────────────────────────────────────────────────┐
     │ Enigma  [Modello][UKW][Spine: 10 cavi]     Come funziona … Glossario  [Condividi][LIM][◐] │ 52
52   ├────────────── 430 ──────────────┬─16─┬───────────────── 794 ───────────────────┤
     │  lampade  9 × 34, passo 43      │    │ rotelle in testa alle colonne      112  │
     │  tasti    9 × 40, passo 46      │    │                                         │
     │                                  │    │ schema: 26 righe × 18 px          470  │
     │ ┌ foglio ──────────────────────┐ │    │ riflettore | sx | centro | dx | spine | tasti │
     │ │ Chiave del giorno            │ │    │                                         │
     │ │ Messaggio: 4 × 6 gruppi      │ │    │                                         │
     │ │ [Digita…            ][Digita]│ │    │ piede: tasto → lampada, Normale/Rallent. │
     │ └──────────────────────────────┘ │    │                                         │
706  └──────────────────────────────────┴────┴─────────────────────────────────────────┘
```

| Zona | Posizione a 1280×720 (x, y, larghezza × altezza) |
| --- | --- |
| Intestazione | 0, 0, 1280 × 52; padding orizzontale 20 |
| Colonna sinistra | 20, 64, 430 × 642 |
| Lampade | in alto, centrate; 3 righe, cerchi da 34, distanza 9 orizzontale e 8 verticale |
| Tasti | 16 sotto le lampade; tasti da 40, distanza 6 orizzontale e 7 verticale |
| Foglio | 16 sotto i tasti, fino al fondo (circa 430 × 350) |
| Vano dello schema | 466, 64, 794 × 642; raggio 10; padding 10 × 14 |
| Testate delle colonne | 112 di altezza: menu del rotore, finestrella 44 × 50 con frecce e rotella, anello |
| Colonne dei contatti (x nel vano) | riflettore 18–100, rotore sinistro 100–280, centrale 280–460, destro 460–640, spine 640–730, lettere dei tasti 740 |
| Righe dei contatti | 26 righe da 18, la prima centrata a 9 |
| Lettere dell’anello | una colonna larga 14 sull’ingresso di ogni rotore |

**Altre risoluzioni.** La griglia si scala intera: `font-size` radice uguale a
`min(100vw / 80, 100vh / 45)`, fra 12,8 e 24 px. A 1920×1080 tutto è 1,5 volte più grande; a
1440×900 la scala la decide la larghezza (1,125) e l’altezza in più va al foglio, che mostra più
righe del messaggio. Sotto 1024×576 (scala 0,8) vale la versione ridotta.

## Versione ridotta (sotto 1024×576)

Riferimento: «Bachelite a 375 px». Dall’alto: intestazione da 52 (marchio e menu da 44 px), tre
finestrelle con frecce da 44 px, lampade da 31, tasti da 34 × 46, foglio del messaggio a quattro
gruppi per riga (come in «Tavola delle chiavi a 375 px», con lo stile del foglio al posto del
nastro), avviso finale: «Qui hai la macchina pronta a cifrare. Rotori, pannello a spine e percorso
del segnale si configurano su un computer.» con il link alle lezioni. Nessuno schema, nessun
pannello di configurazione. Il testo dell’avviso va in `src/i18n/it.json`.

## Colori

La macchina ha gli stessi colori in entrambi i temi: è un oggetto. Il tema cambia il foglio e le
pagine. Contrasti calcolati il 2026-11-04 con la formula WCAG 2.

### Macchina (tutti i temi)

| Token | Valore | Uso | Contrasto |
| --- | --- | --- | --- |
| `--machine-paint` | `#23241f` | fondo, con la grana raggrinzita (due `radial-gradient` di 3 e 5 px) | — |
| `--machine-well` | `#191a16` | vano dello schema, pannelli | — |
| `--machine-line` | `#34352f` | filetto sotto l’intestazione | — |
| `--machine-control` | `#1a1b17` | fondo di menu e pulsanti | — |
| `--machine-control-border` | `#4a4a42` | bordo di menu e pulsanti; `#8f8b80` al passaggio | — |
| `--alu` | `#cfcbc0` | testo | 9,6:1 su `paint` |
| `--alu-bright` | `#f2efe6` | testo forte, marchio | 13,6:1 |
| `--alu-muted` | `#9c998e` | testo secondario | 5,5:1 su `paint`, 6,1:1 su `well` |
| `--ring-letter` | `#9a978c` | lettere dell’anello, lettere delle lampade spente | 6,0:1 su `well` |
| `--window` / `--window-ink` | `#ece8dc` / `#15150f` | finestrelle dei rotori | — |
| `--lamp-off` | `#45443c` → `#2a2a25` | vetro della lampada spenta (gradiente radiale) | — |
| `--lamp-on` | `#fff6cf` → `#ffc845` → `#e58c00` | lampada accesa | — |
| `--lamp-on-ink` | `#3a2400` | lettera della lampada accesa | 9,5:1 su `#ffc845` |
| `--lamp-glow` | `rgba(255, 185, 56, .5)` | alone della lampada accesa | — |
| `--key-cap` / `--key-rim` | `#121210` → `#2e2e29` / `#bdb9ae` | tasti | — |
| `--signal-forward` | `#ffa53d` | segnale all’andata | 8,9:1 su `well` |
| `--signal-return` | `#7cc0ff` | segnale al ritorno | 9,0:1 su `well` |
| `--wire` | `#cfcbc0` al 17 % | fili a riposo | — |
| `--focus-machine` | `#ffb938` | anello del fuoco sulla macchina | 9,1:1 su `paint` |

Correzione rispetto al prototipo: le lettere delle lampade spente passano da `#6f6c61` (2,7:1) a
`--ring-letter`.

### Foglio e pagine, tema chiaro

| Token | Valore | Uso | Contrasto su `paper` |
| --- | --- | --- | --- |
| `--paper` | `#fbfbf8` | foglio, fondo delle pagine | — |
| `--paper-deep` | `#f1f0ea` | blocchi di codice, campi | — |
| `--ink` | `#2a2a2a` | testo | 13,9:1 |
| `--ink-muted` | `#5f5f59` | testo secondario | 6,2:1 |
| `--ink-faint` | `#6b6b66` | tasti premuti nel messaggio | 5,2:1 |
| `--print-red` | `#b3261e` | intestazioni del foglio, filetti strutturali | 6,3:1 |
| `--print-red-soft` | `#e2b9b5` | righe secondarie (solo linee, mai testo) | — |
| `--field-border` | `#c9c6bd` | bordo dei campi | — |
| `--signal-forward-paper` | `#a34a00` | segnale all’andata nelle figure delle lezioni | 5,7:1 |
| `--signal-return-paper` | `#1f6fb2` | segnale al ritorno nelle figure delle lezioni | 5,1:1 |
| `--focus-paper` | `#1f6fb2` | anello del fuoco sul foglio | 5,1:1 |

Correzione rispetto al prototipo: i tasti premuti nel messaggio passano da `#8a8a84` (3,4:1) a
`--ink-faint`.

### Tema scuro

Le pagine prendono il fondo della macchina; il foglio del simulatore si attenua.

| Token | Valore | Contrasto |
| --- | --- | --- |
| `--paper` (pagine) | `#23241f` | — |
| `--paper` (foglio del simulatore) | `#e4e1d7`, con gli inchiostri del tema chiaro tranne `--ink-faint` | `--ink` 11,0:1, `--ink-muted` 4,9:1, `--print-red` 5,0:1 |
| `--ink-faint` (foglio del simulatore) | `#5f5f59` (con `#6b6b66` sarebbe 4,1:1) | 4,9:1 |
| `--ink` (pagine) | `#e9e5d9` | 12,4:1 |
| `--ink-muted` (pagine) | `#9c998e` | 5,5:1 |
| `--print-red` (pagine) | `#ff8a7e` | 6,8:1 |
| `--signal-forward-paper` / `--signal-return-paper` (pagine) | `#ffa53d` / `#7cc0ff` | 8,9:1 / 9,0:1 |

### LIM

Sopra il tema attivo: `--alu-muted` e `--ring-letter` diventano `#cfcbc0`, `--wire` sale al
28 %, `--ink-faint` diventa `#4a4a46`, i bordi dei controlli `#8f8b80`.

## Caratteri

Tre famiglie, tutte con licenza SIL Open Font License, servite in locale da `public/fonts/`
(`woff2`, con il file della licenza accanto). Nessuna richiesta a Google Fonts nel sito.

| Famiglia | Pesi e assi | Uso |
| --- | --- | --- |
| Archivo | variabile, `wght` 400–800, `wdth` 62–125 | interfaccia, titoli, testo delle lezioni; marchio a `wght` 800 e `wdth` 125 |
| Saira Stencil One | 400 | solo le lettere delle lampade |
| Courier Prime | 400 e 700 | tutto ciò che è battuto a macchina: chiave, messaggio, campi, gruppi di lettere, blocchi di codice |

Scala (px a 1280×720; rapporto circa 1,2):

| Ruolo | Dimensione / interlinea | Peso |
| --- | --- | --- |
| Micro (lettere dell’anello, mai testo corrente) | 10–11 / 18 | 400, 800 se accesa |
| Didascalia, etichette del foglio | 12 / 1,4 | 400 |
| Interfaccia | 13–14 / 1,4 | 400–600 |
| Testo delle lezioni | 17 / 1,6, colonna di 68 caratteri al massimo | 400 |
| Titolo di sezione | 20 / 1,3 | 700 |
| Titolo di pagina | 36 / 1,15, `wdth` 112 | 800 |
| Lettera della finestrella | 29 / 1, `wdth` 90 | 800 |

Niente maiuscolo spaziato per le etichette. Il maiuscolo resta solo dove è dato: lettere di
Enigma, gruppi del messaggio, nomi dei rotori.

## Animazioni

Ogni animazione risponde a un’azione. Solo `transform`, `opacity`, `filter` e
`stroke-dashoffset`. Una nuova pressione **interrompe** quella in corso e riparte (nel codice: Web
Animations API con `animation.cancel()`, o classi alternate come nel prototipo): niente code,
niente timer che si accumulano. Con `prefers-reduced-motion: reduce` gli stati cambiano subito,
senza movimento, e «Al rallentatore» lascia il posto a «Passo passo».

| Animazione | Quando | Durata | Curva | Ritardo |
| --- | --- | --- | --- | --- |
| Scatto della lettera nella finestrella | il rotore avanza | 150 ms | `cubic-bezier(.2, .8, .2, 1)`, da `translateY(60%)` e opacità 0,15 | — |
| Rotazione di fili e lettere dell’anello | il rotore avanza | 190 ms | stessa curva, da una riga più in basso | — |
| Segnale all’andata | tasto premuto | 130 ms (1,4 s al rallentatore) | lineare, `stroke-dashoffset` dalla lunghezza a 0 | — |
| Segnale al ritorno | tasto premuto | 130 ms (1,4 s) | lineare | 130 ms (1,4 s) |
| Lampada che si scalda | tasto premuto | 180 ms | `ease-out`, `filter: brightness(.25)` → nessun filtro | 240 ms (2,8 s) |
| Lettera nuova sul foglio | tasto premuto | 160 ms | `ease-out`, da opacità 0 e 3 px più in alto | — |
| Tasto abbassato | pressione | 60 ms | lineare, 3 px | — |
| Pannello ancorato che si apre | clic sul pulsante | 140 ms | `cubic-bezier(.2, .8, .2, 1)`, da 6 px più in alto e scala 0,98 | — |
| Digita automatico | pulsante «Digita» | 45 ms per lettera | — | qualunque tasto o «Ricomincia» lo ferma |

Dal tasto alla lampada passano 420 ms; chi digita più in fretta vede ripartire tutto dal tasto
nuovo, e il nastro non perde lettere.

## Interazioni

- Tastiera fisica: le lettere premono i tasti, Backspace annulla, Esc chiude il pannello aperto.
- Pannelli ancorati (Spine, Cablaggio, Opzioni, Condividi): non modali, uno alla volta. Si
  chiudono con Esc, con lo stesso pulsante, con la × o con un clic fuori. All’apertura il fuoco
  entra nel pannello, alla chiusura torna al pulsante. Il pannello delle spine si apre sopra la
  colonna sinistra, così lo schema resta scoperto e cambia mentre si collegano i cavi.
- Prese del pannello a spine: clic su due prese libere le collega, clic su una presa collegata
  stacca il cavo, la presa in attesa ha il bordo ambra.
- Ogni cambio di configurazione fa ricominciare il messaggio, come oggi.
- Bersagli di almeno 44 px su mobile; su desktop i controlli secondari possono scendere a 24 px di
  altezza se hanno 44 px di larghezza utile o stanno in un gruppo da 44.

## Pagine del sito

- **Intestazione.** Stessa barra della macchina, vernice e alluminio, in entrambi i temi. Senza i
  controlli della macchina: marchio a sinistra, poi «Simulatore» (la home), «Come funziona»,
  «Storia», «Esercizi», «Glossario», a destra il tema. A 375 px: marchio e pulsante del menu da
  44 px su una riga; il menu si apre come foglio sotto la barra.
- **Fondo e testo.** Le pagine sono foglio: `--paper`, `--ink`, Archivo 17/1,6.
- **Tabelle** (`.prose-it table`). Intestazione in `--print-red`, 13 px, peso 600; filetto sopra
  la tabella e sotto l’intestazione in `--print-red` da 1,5 px; righe separate da
  `--print-red-soft`; numeri in Courier Prime, allineati a destra. Niente righe alternate.
- **Blocchi di codice.** Fondo `--paper-deep` (scuro: `--machine-well`), padding 16 × 20, margine
  24 sopra e sotto, raggio 3. Shiki con due temi legati a `data-theme`: chiaro con `--ink`,
  parole chiave in `--print-red`, stringhe in `--signal-return-paper`; scuro con `--alu`, parole
  chiave in `--signal-forward`, stringhe in `--signal-return`.
- **Numeri.** Gruppi di tre cifre con lo spazio non separabile; `<Formula>` non va a capo
  all’interno.
- **Componenti della lezione.** `Obiettivi` e `Riepilogo` come righe di una tavola (bordo
  `--print-red` da 1,5 px, titolo rosso): si leggono in coppia. `Previsione` come modulo da
  compilare: le risposte sono righe con la casella. `Citazione` in Archivo corsivo 20 px, fonte in
  Courier Prime 13 px. Nessun riquadro colorato e nessun bordo a sinistra.
- **Figure con il segnale.** Gli stessi colori di andata e ritorno della macchina, nella variante
  `-paper` sul foglio.

## Da confermare con Marco

1. Il simulatore resta scuro anche nel tema chiaro; il tema cambia solo il foglio e le pagine.
2. La nota sull’annullare esce dal simulatore e va nella lezione 1.
3. Le chiavi storiche del foglio partono dalla sola Barbarossa, e solo dopo che ha una voce in
   `fonti.yaml` verificata (fase V); fino ad allora il menu ha soltanto chiavi di prova.
