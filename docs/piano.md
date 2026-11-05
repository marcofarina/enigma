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
nell’intervista della fase I (D9–D15), nella revisione delle fasi 3D del 2026-11-05 (D16–D19) e
nella prova della pagina 3D del 2026-11-05 (D20–D24).
Valgono per le fasi qui sotto.

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
| D14 | Da dove viene il modello 3D: fatto in Blender (licenza propria) o un modello CC BY verificato? | — | 4i–4k, 5a | 2026-11-04: strada 2. Si cerca un modello di Enigma con licenza CC0 o CC BY, rotori già separati e meno di circa 50 000 poligoni; se c’è, lo si adatta e lo si registra con l’attribuzione; se no, la geometria la fa Claude con l’MCP di Blender. Metodo: `blender-mcp` (Marco vuole imparare a usarlo per PQuest di Python Doesn’t Byte). 2026-11-05, dopo la revisione di Opus: la ricerca su Sketchfab la fa Marco prima della 4i, in dieci minuti al massimo, perché scaricare richiede il suo account; la sessione non cerca. Niente texture né HDRI di Poly Haven nel `.glb`: il tetto di 1 MB lo consumano le texture, e la luce del mondo di Blender non si esporta in glTF; i materiali sono piani, con al massimo una normal map piccola. Gli script di `scripts/blender/` sono la fonte del modello: prima si scrive il file, poi l’MCP lo esegue. Licenza della geometria: CC BY-NC-SA 4.0, come i contenuti del sito, e nessuna base di terzi (Marco, 2026-11-05, nella 4i) |
| D15 | Come entra il modello 3D nel sito? | — | 4i–4k, 5a–5c | 2026-11-04: pagina a sé, `/macchina/`, con voce di menu; la home resta com’è. Nella pagina si esplora la macchina, si cifra e decifra (stesso store del simulatore), si smonta con un selettore a fasi e si tocca un pezzo per leggerne la spiegazione e andare alla lezione. Le posizioni esplose si decidono in Blender e viaggiano nel `.glb`; il cablaggio dei rotori non si modella, lo disegna il codice dai dati del motore. Tetto del `.glb`: 1 MB, caricato solo dopo il pulsante «Avvia la vista 3D». 2026-11-05, dopo la revisione di Opus: lo smontaggio viaggia come animazione glTF (clip `smontaggio`, un secondo per fase) e non come vettori in `extras`, che l’esportatore non converte da Z in alto a Y in alto; in `extras` restano solo numeri senza direzione. La pagina legge la configurazione dalla query come la home (lo store non persiste fra le pagine) e mostra solo l’Enigma I. A macchina smontata la tastiera non cifra. I cavi del pannello a spine li disegna il codice, come il cablaggio. La 5a si fa sul modello abbozzato della 4i, prima della geometria completa |
| D16 | La lezione animata (si preme un tasto e si segue la corrente fino alla lampada, 1–2 minuti con voce narrante e parti esterne trasparenti) è un video o una scena in tempo reale? | Scena in tempo reale nel browser, guidata da un copione | 5d, 5e | raccomandazione accettata (2026-11-05). Motivo: riusa modello, motore e traccia del simulatore, quindi il percorso è giusto per costruzione; scarica solo l’audio; si corregge cambiando il testo. Le parti esterne diventano «fantasma» (semitrasparenti, con i soli spigoli principali), non il wireframe dei triangoli |
| D17 | Che voce ha la lezione animata? | Si sceglie nella 5e; la 5d lavora con la voce italiana di macOS (`say -v Alice`) come segnaposto | 5d, 5e | raccomandazione accettata (2026-11-05). Le possibilità sono un servizio di sintesi vocale o la voce di Marco, registrata frase per frase |
| D18 | Dove sta la lezione animata? | In `/macchina/` e, come componente MDX, nella lezione 3 «Tastiera, lampade e circuito» | 5d, 5e | raccomandazione accettata (2026-11-05) |
| D19 | La lettera della lezione animata la sceglie lo studente? | No: lettera e configurazione fisse nel copione, perché la voce deve poter dire quale lampada si accende; un passo finale «ora prova tu» passa i comandi allo studente | 5d, 5e | raccomandazione accettata (2026-11-05) |
| D20 | Il modello 3D resta tutto nostro o parte da un modello di terzi? | — | 4l–4n, 5f | 2026-11-05: Marco, dopo aver provato la pagina, sceglie l’ibrido. L’esterno viene dal modello «Enigma Machine» di ASHISH (<https://sketchfab.com/3d-models/enigma-machine-30b85c037a164174a109ad6f002b9c47>, CC BY 4.0, attribuzione nella pagina e in Fonti); l’interno resta nostro e si porta allo stesso livello. Motivo: fuori il modello di ASHISH è molto più vicino all’oggetto vero del nostro, ma dentro è vuoto (verificato in Blender il 2026-11-05). Supera, della D14, «nessuna base di terzi» e i materiali piani. La geometria derivata resta CC BY-NC-SA 4.0, come permette la CC BY |
| D21 | Dove sta la copia di partenza del modello di ASHISH (zip di 176 MB, texture 4K)? | Fuori da git, in `scripts/blender/sorgenti/` ignorata; nel repo URL, licenza e sha256 dello zip | 4l | raccomandazione accettata (2026-11-05) |
| D22 | Che cosa si fa del coperchio di legno, che il modello di ASHISH ha aperto dietro la macchina? | Resta aperto, come nelle foto dei musei, e nella fase 1 dello smontaggio si allontana per non coprire i rotori | 4l, 4n | raccomandazione accettata (2026-11-05) |
| D23 | Che tetto ha il `.glb` ibrido? | 6 MB, con texture 2K in WebP e geometria compressa con meshopt (il decoder è nel bundle di drei, nessun CDN); il pulsante «Avvia la vista 3D» dice il peso | 4l–4n, 5f | raccomandazione accettata (2026-11-05). Supera il tetto di 1 MB della D15 |
| D24 | La pagina 3D si riprogetta? | — | G5, 5g, 5c, 5d | 2026-11-05: Marco. Sì, su Claude Design come nella G0, perché la scena non è protagonista, in vista esplosa i pannelli coprono i pezzi e col trackpad non c’è il pan. Ordine: prima il modello (4l–4n) e la resa (5f); la G5 si fa in parallelo, perché non tocca il modello; la 5c e la 5d vengono dopo la 5g |

## Fasi

Le fasi 0–3 (v0.1–v0.3) sono fatte e unite in `main`; poi è venuta la revisione di
`docs/piano-aggiornamento.md` (fasi A–H). Il lavoro rimasto è diviso qui in fasi eseguibili
ciascuna in una sessione Claude Code separata, aperta in `enigma/` **in locale** (nel cloud le
norme non sono raggiungibili, quindi niente prosa). Ogni fase si esegue leggendo solo questo
indice e il proprio file in `docs/piano/` (tabella in fondo).

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
| 4i | Modello 3D: convenzione, abbozzo e catena di esportazione | Opus | high | 2 h | D14, D15; Marco al Mac con Blender aperto | fatta (2026-11-05) |
| 4j | Modello 3D: geometria completa e ancore | Sonnet | high | 3 h | 4i; Marco al Mac con Blender aperto | fatta (2026-11-05) |
| 4k | Modello 3D: animazione dello smontaggio | Sonnet | high | 2 h | 4j; Marco al Mac con Blender aperto | fatta (2026-11-05) |
| 5a | Pagina 3D: architettura, caricamento e digitazione | Opus | high | 3 h | 4h, 4i | fatta (2026-11-05) |
| 5b | Pagina 3D: vista esplosa, cablaggio e nottolini | Sonnet | high | 3 h | 4k, 5a | fatta (2026-11-05) |
| 4l | Modello ibrido: esterno di terzi, scomposizione e catena di esportazione | Opus | high | 3 h | D20–D23; Marco al Mac con Blender aperto | fatta (2026-11-05) |
| 4m | Modello ibrido: l’interno allo stesso livello dell’esterno | Sonnet | high | 3,5 h | 4l; Marco al Mac con Blender aperto | fatta (2026-11-05), manca il giudizio di Marco sulle immagini |
| 4n | Modello ibrido: smontaggio, anteprima e chiusura | Sonnet | high | 2 h | 4m; Marco al Mac con Blender aperto | da fare |
| G5 | Pagina 3D: riprogettazione su Claude Design | Opus | high | 2 h | —; Marco presente per scegliere | da fare |
| 5f | Pagina 3D: resa | Opus | high | 2,5 h | 4l | da fare |
| 5g | Pagina 3D: nuovo layout e navigazione | Sonnet | high | 3 h | G5 | da fare |
| 5c | Pagina 3D: schede dei pezzi | Opus | high | 2,5 h | 4n, 5g | da fare |
| 5d | Lezione animata: copione, lettore e scena | Opus | high | 3 h | 4n, 5f, 5g, D16–D19 | da fare |
| 5e | Lezione animata: testo, voce e crediti | Opus | high | 2,5 h | 5d; Marco ha scelto la voce (D17) | da fare |

Totale stimato: circa 56 ore di sessione, di cui 37 dalla 4i alla 5e. 4a, 4b e 4g non si toccano
a vicenda e si possono fare in qualunque ordine; 4d e 4e toccano file diversi e sono indipendenti
fra loro. 4f viene dopo la crittoanalisi per decisione di Marco (D12). 4h chiude la v1.0 e va
fatta per ultima, perché misura le pagine nuove.

4i, 4j e 4k non si fanno nel cloud: serve Blender aperto sul Mac di Marco. La 5a parte dopo la 4i,
sul modello abbozzato, così caricamento, Lighthouse e WebGL nei test si provano prima di modellare
il resto; la 4j e la 4k cambiano la geometria ma non la convenzione, quindi la 5a si può fare prima
o dopo di loro. La 5b parte dopo la 4k e la 5a.

Dopo la prova del 2026-11-05 (D20–D24): 4l, 4m e 4n vanno in fila, in locale con Blender. La G5 non
dipende da niente e si può fare subito, in parallelo con il modello; tocca solo `docs/`. La 5f
parte dopo la 4l, perché le servono le texture, e la 5g dopo la G5; la 5f e la 5g toccano lo stesso
`Scena.tsx`, quindi una alla volta. La 5c viene dopo la 4n (nomi dei nodi definitivi) e la 5g
(posto della scheda nel layout); la 5d dopo la 4n, la 5f e la 5g. La 5c e la 5d toccano la stessa
pagina: si fanno una alla volta. La 5c e la 5e scrivono prosa, quindi solo in locale.

### Fuori dalle fasi

Due compiti piccoli rimasti dalla fase V di `docs/piano-aggiornamento.md` (2026-11-04). Non
dipendono da nessuna fase; vanno chiusi prima della 4h.

| Compito | Chi | Fatto quando |
|---|---|---|
| Rileggere storia 4 (`src/content/lezioni/it/storia/04-enigma-e-l-italia.mdx`), riscritta nella fase V sul racconto di Batey: il messaggio senza L non è più legato a Matapan | Marco | la lezione è `stato: rivista` |
| Barra dello smontaggio che si allargava e si stringeva, fili dei rotori con spessore in pixel (difetti 2 e 4 trovati da Marco il 2026-11-05) | sessione Claude (fatto il 2026-11-05, commit `4600d19`: testo della fase a larghezza fissa, fili come tubi da 1 mm) | — |
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
- Chiusura di ogni fase: spunta la riga nella tabella «Stato» di questo indice, aggiungi in
  fondo al file della fase le righe «Esito» (che cosa è cambiato, che cosa resta, comandi
  eseguiti) e fai commit. Niente
  PR: con `pnpm verify && pnpm test:e2e` verdi fondi il branch in `main` in locale; il push su
  `main` pubblica il sito, quindi si fa dopo conferma di Marco.

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
- Fasi 3D (rischi annotati il 2026-11-05, nella revisione di Opus): la qualità visiva dipende da un modello costruito da un LLM con l’MCP di Blender, e le stime di 4j e 4k sono per chi usa l’MCP per la prima volta; le trasparenze della lezione animata pesano sui telefoni (la 5d le misura); le inquadrature della 5d richiedono più giri guardando il risultato, ed è la parte meno prevedibile delle stime.
- Modello ibrido (2026-11-05): la copia di partenza sta fuori da git (D21), quindi se ASHISH
  ritira il modello da Sketchfab resta solo lo zip di Marco. Marco ne tiene una copia nel suo
  backup; lo sha256 è in `docs/piano/fase-4l.md`. La cottura delle texture della 4m è il passo
  meno prevedibile di quelle tre fasi.

## File del piano

Ogni file sta in `docs/piano/`. Una fase si esegue leggendo questo indice e il file della fase;
dalla 4i alla 5g serve anche `convenzione-3d.md`, e per la G5 e la 5g `docs/design.md`.

| File | Contenuto |
|---|---|
| `convenzione-3d.md` | Contratto fra Blender e il sito: unità e assi, nodi (chi li muove e quale fase li crea), ancore, `extras`, fasi dello smontaggio |
| `fase-4i.md` | Modello 3D: convenzione, abbozzo e catena di esportazione |
| `fase-4j.md` | Modello 3D: geometria completa e ancore |
| `fase-4k.md` | Modello 3D: animazione dello smontaggio |
| `fase-5a.md` | Pagina 3D: architettura, caricamento e digitazione |
| `fase-5b.md` | Pagina 3D: vista esplosa, cablaggio e nottolini |
| `fase-4l.md` | Modello ibrido: esterno di terzi, scomposizione e catena di esportazione |
| `fase-4m.md` | Modello ibrido: l’interno allo stesso livello dell’esterno |
| `fase-4n.md` | Modello ibrido: smontaggio, anteprima e chiusura |
| `fase-g5.md` | Pagina 3D: riprogettazione su Claude Design |
| `fase-5f.md` | Pagina 3D: resa |
| `fase-5g.md` | Pagina 3D: nuovo layout e navigazione |
| `fase-5c.md` | Pagina 3D: schede dei pezzi |
| `fase-5d.md` | Lezione animata: copione, lettore e scena |
| `fase-5e.md` | Lezione animata: testo, voce e crediti |
| `archivio.md` | Fasi 4a–4h chiuse con i loro «Esito», analisi della code base originale (bug e inesattezze) e architettura del progetto iniziale |
