# Fase 5d — Lezione animata: copione, lettore e scena

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 4n, 5f, 5g, D16–D19**

Dal 2026-11-05 le parti esterne vengono dal modello di ASHISH, con texture (D20): le parti «fantasma»
vanno provate su quei materiali, e il lettore va nel posto che gli dà la sezione «Pagina 3D» di
`docs/design.md` (G5).

**Obiettivo.** In `/macchina/` un pulsante «Guarda come funziona» avvia una lezione di uno o due
minuti: si preme un tasto, i rotori avanzano, la corrente va dal tasto al pannello a spine, alla
ruota d’ingresso, ai tre rotori, al riflettore e indietro fino alla lampada. Le parti esterne
diventano fantasma, il meccanismo va al rallentatore e una voce racconta. In questa fase il testo è
provvisorio e la voce è il segnaposto di macOS; testo e voce definitivi li fa la 5e.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5d.md. Leggi prima l’indice docs/piano.md (le decisioni D16–D19) e
docs/piano/convenzione-3d.md. Avvia il sito con il server «astro-dev» e verifica nel browser.
```

**Passi**

1. **Il copione è un dato.** `src/content/lezione-3d/it.yaml`, controllato da `pnpm lint:content`
   come le altre YAML di `src/content/`. In testa la configurazione (nel formato della query) e la
   lettera, fisse (D19). Poi l’elenco dei passi; ogni passo ha `id`, `testo` (una o due frasi) e che
   cosa fa la scena: `camera` (un’inquadratura con nome, definita nel codice), `fantasma` (nodi
   che diventano trasparenti), `evidenzia`, `azione` (`premi`, `passo`, `segnale` fino a uno stadio
   della traccia, `lampada`) e `rallenta`. L’ultimo passo, «ora prova tu», riporta la scena allo
   stato normale e restituisce la tastiera.
2. **Un audio per passo.** `public/lezione-3d/it/<id>.m4a`, più `durate.json` con la durata di
   ciascuno e l’hash del suo testo. Con un file per frase non servono i tempi delle parole da un
   servizio, una correzione rifà un solo file e Marco può registrarsi frase per frase. Audio e durate
   li genera `scripts/voce.ts`, che in questa fase usa il segnaposto: `say -v Alice -o <id>.aiff "<testo>"`,
   poi `afconvert -f m4af -d aac <id>.aiff <id>.m4a`, con la durata letta da `afinfo` (verificato il
   2026-11-05: i tre comandi ci sono su questo Mac, e `Alice` è una voce `it_IT`). Lo script rifà
   solo i passi il cui testo è cambiato.
3. **Lettore.** Il passo corrente suona il suo audio, e la sua animazione dura quanto l’audio;
   finito l’audio, si passa al successivo. Comandi: avvia e pausa, passo precedente, passo
   successivo, e una modalità a passi senza voce, che avanza a mano (serve alla LIM). Il testo del
   passo corrente sta sotto la scena come sottotitolo; la trascrizione completa in un `<details>`.
4. **Percorso della corrente.** Dagli stadi della traccia del motore (`traceOf` in
   `src/components/simulator/trace.ts`) alle ancore e ai contatti calcolati: una linea che si
   accende tratto per tratto. È giusta per costruzione, perché viene dal motore. I tratti fra le
   ancore sono semplificati e non seguono i fili veri; il copione lo dice.
5. **Fantasma.** Materiale semitrasparente con `depthWrite: false` più gli spigoli principali
   (`EdgesGeometry` con una soglia sull’angolo), non il wireframe dei triangoli. Fissa l’ordine di
   disegno per evitare gli errori di ordinamento delle trasparenze.
6. **Componente.** `<LezioneAnimata>` in `src/components/lesson/`, caricato solo al clic come la
   vista 3D (D18). In questa fase sta solo in `/macchina/`; nella lezione 3 lo mette la 5e.
7. **Preferenze.** Con `prefers-reduced-motion` stacchi di camera al posto dei movimenti; il
   rallentatore resta, perché è il contenuto. L’audio parte solo dopo il clic.
8. **Prestazioni.** Misura i fotogrammi al secondo durante la lezione a 375 px con la CPU
   rallentata quattro volte (`Emulation.setCPUThrottlingRate` via CDP in Playwright) e scrivili
   nell’«Esito». Sotto 30, riduci trasparenze e spigoli.

**Criteri di accettazione**

```bash
node scripts/voce.ts
```
exit 0, con un file audio e una voce di `durate.json` per ogni passo del copione.

```bash
pnpm verify && pnpm test:e2e
```
con un test che porta la lezione, in modalità a passi, fino alla lampada e legge l’annuncio
«Lampada X» uguale all’uscita del motore per la lettera e la configurazione del copione; uno che
dopo «ora prova tu» batte una lettera e la cifra; uno che controlla che nessun audio si scarichi
prima del clic.

```bash
pnpm build && pnpm test:lighthouse
```
exit 0.

**Esito** (2026-11-06, branch `fase/5d`).

- **Copione.** `src/content/lezione-3d/it.yaml`: in testa `configurazione` (formato della query) e
  `lettera`; poi i passi con `id`, `testo`, `camera`, `fantasma`, `evidenzia`, `azione`, `fino` (solo
  con `segnale`) e `rallenta`. La scelta: Enigma I, rotori I II III in AAA, anelli 01, cavi AT e OK,
  lettera A; la corrente fa A → T → J → B → K → N → K → D → O → K e si accende la lampada K. Undici
  passi, 81 s di audio. Lo legge e lo controlla `src/lib/copione-3d.ts` (schema zod: inquadrature,
  azioni nell’ordine premi, passo, segnale, lampada, prova, stadi di `fino` che vanno avanti, ultimo
  segnale fino a `spine-ritorno`, configurazione che sia un’Enigma I); la pagina lo legge alla build e
  lo passa all’isola. `lint:content` controlla il campo `testo` (aggiunto ai campi di prosa delle YAML
  in `scripts/content-rules.ts`). Fuori dalla lettera della fase: `fantasma` ed `evidenzia` accettano
  il gruppo `lampade` (`GRUPPI_NODI` in `src/lib/lezione-3d.ts`), perché le lampade non hanno un nodo
  comune e nei passi dentro la macchina coprivano i rotori. Ogni passo lascia la scena come l’ha
  portata la sua azione; camera, fantasma ed evidenzia valgono solo nel passo dove stanno.
- **Audio.** `node scripts/voce.ts` fa `public/lezione-3d/it/<id>.m4a` e `durate.json` (durata e
  impronta sha256 del testo) con `say -v Alice`, `afconvert` e `afinfo`; rifà solo i passi con il
  testo cambiato e toglie i file dei passi spariti. Se un audio non corrisponde al testo la build si
  ferma (`lezioneDellaPagina`). 408 KB in tutto.
- **Lettore.** `src/components/lesson/LezioneAnimata.tsx`, import pigro al clic su «Guarda come
  funziona», nel foglio al posto di «Smontaggio» e «Messaggio» (docs/design.md, «Come l’ha
  realizzata la 5d»). Il tempo viene dall’audio quando suona, altrimenti da un orologio con le durate
  di `durate.json`: il Chromium di Playwright non riproduce l’AAC e la lezione va avanti lo stesso.
  Il lettore scrive passo e tempo in uno store (`src/components/macchina/lezione.ts`) che la scena
  legge fuori da React; i conti del quadro di un passo sono puri, in `src/lib/lezione-3d.ts`.
- **Scena.** In `Scena.tsx`: `collegaAllaLezione` al posto di `collegaAlloStore` finché la lezione è
  in scena (tasto giù, rotori e nottolini al rallentatore, lampada); `Fantasmi` (materiale piatto con
  `depthWrite: false` e spigoli da `EdgesGeometry` a 35°, `renderOrder` fisso 10, 11, 12);
  `PercorsoCorrente` (cilindri da 1,2 mm che si allungano tratto per tratto in proporzione alla
  lunghezza, arancio all’andata e azzurro dal riflettore, disegnati due volte: pieni e tenui
  attraverso i pezzi, più una testa che avanza); le inquadrature con nome (`INQUADRATURE_LEZIONE` in
  `geometria.ts`). Il percorso viene da `segmentiDelPercorso`, che legge gli stadi del motore: i
  contatti dei rotori sono quelli fissi, sulle facce del nucleo come il cablaggio della 5b. Durante la
  lezione i cavi del pannello sono quelli del copione e si vedono anche a macchina chiusa. Lo
  `ShaderMaterial` dei contorni e le mesh aggiunte dalla pagina non diventano fantasma: solo le mesh
  del `.glb` (`userData.delModello`).
- **«Ora prova tu».** Lo store della pagina prende la configurazione del copione con la lettera già
  battuta; la scena torna allo store e la prossima lettera si cifra da AAB. Durante la lezione la
  tastiera e i clic sul modello non fanno niente, «Pezzi» è spento e la macchina si rimonta.
- **Fotogrammi al secondo** (`node scripts/fps-lezione.ts`, sulla build: 375 × 812, densità 2, CPU
  rallentata quattro volte con CDP, tre secondi per passo a animazione in corso). Con la GPU
  (`--gpu`, ANGLE su Metal, Apple M2 Pro): **minimo 58,4, media 60,0** in tutti gli undici passi:
  niente da ridurre. Con SwiftShader, il rendering sulla CPU dei test: minimo 3,4, media 10,8, ma la
  scena senza fantasmi del primo passo fa già 4,8: è il costo del modello, non delle trasparenze. Per
  i test la scena si ridisegna solo quando il quadro cambia; i due test e2e che attraversano la lezione
  durano comunque circa un minuto (tetto alzato a 150 s).
- **Provvisorio per la 5e.** Il testo dei passi (bozza mia, senza la passata delle norme di
  scrittura, che va fatta sul testo definitivo); la voce (D17); i crediti della voce. La lezione 3 non
  ha ancora il componente: `<LezioneAnimata>` è il solo lettore, e nella lezione gli serve un
  contenitore con la sua scena (lo stesso `Scena.tsx`, con `lezione` e lo store del simulatore), da
  fare nella 5e. Da guardare con Marco: le inquadrature (sono tarate a occhio a 1280 × 720 e a 375 px;
  «rotori» è stretta), e se nel passo del riflettore il percorso debba girare dentro il riflettore
  invece di tagliarlo con una corda.

Comandi eseguiti:

```bash
node scripts/voce.ts
pnpm verify && pnpm test:e2e
pnpm build && pnpm test:lighthouse
node scripts/fps-lezione.ts && node scripts/fps-lezione.ts --gpu
```

Esiti: `voce.ts` exit 0, undici audio e undici voci in `durate.json` (al secondo giro «0 audio
rifatti»); `verify` verde (278 unit test, 20 nuovi in `src/lib/lezione-3d.test.ts`); e2e 221 passati e
25 saltati, con i quattro nuovi di «lezione animata» su entrambi i progetti (a passi fino a «Lampada
K», uguale al motore; dopo «ora prova tu» la B si cifra da lì; nessun audio prima del clic, e il primo
audio dopo; con `prefers-reduced-motion` parte a passi e senza audio); Lighthouse rispettato su tutte
le pagine, `/macchina/` 100 a desktop e 95 a 375 px, accessibilità 100.
