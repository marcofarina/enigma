# Fase 5f — Pagina 3D: resa

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: 4l (il modello con le texture); non in parallelo con la 5g, che tocca lo stesso `Scena.tsx`**

**Obiettivo.** Il browser mostra il modello come lo mostra Sketchfab: colori con tone mapping,
metalli che riflettono una luce credibile, la macchina appoggiata su un’ombra, le lampade che si
accendono davvero. Il pulsante «Avvia la vista 3D» dice quanto pesa il download.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5f.md. Leggi prima l’indice docs/piano.md, docs/piano/convenzione-3d.md e
gli «Esito» delle fasi 4l–4n già fatte.
```

**Fatti verificati il 2026-11-05**

- Il `<Canvas>` di `src/components/macchina/Scena.tsx` ha la prop `flat`, cioè `NoToneMapping`:
  è la causa principale dei colori piatti.
- La luce è una `ambientLight`, una `directionalLight` e tre `Lightformer` dentro `<Environment>`;
  nessuna ombra. Niente `preset` di `<Environment>` perché lo scaricherebbe da un CDN.

**Passi**

1. **Prima.** Salva in `docs/screenshot/3d/prima/` la pagina a 1280 × 720 nelle fasi 0, 2 e 4 dello
   smontaggio, in tema chiaro e scuro.
2. **Tone mapping.** Togli `flat` e scegli fra `AgXToneMapping` e `ACESFilmicToneMapping` guardando
   le texture di ASHISH. Controlla che l’arancio del segnale e il colore delle lampade accese, presi
   dai token, restino riconoscibili.
3. **Luce d’ambiente.** Prova i `Lightformer` ritoccati e una HDRI da studio di Poly Haven (CC0) a
   1K, servita da `public/` e caricata con `<Environment files>`. La HDRI entra solo se il confronto
   delle immagini la giustifica e pesa meno di 1,5 MB; la voce va in `src/content/immagini.yaml`.
4. **Ombre.** `ContactShadows` di drei sotto la cassa, calcolata una volta sola (`frames={1}`): la
   scena gira in `frameloop="demand"`. Niente ombre in tempo reale delle luci.
5. **Lampade.** Emissivo dal token `--signal-forward` sul vetro della lampada accesa (la forma la
   decide la 4l). Il bloom entra solo se a 375 px la pagina resta fluida su un telefono di fascia
   media emulato (Chrome, CPU 4× più lenta): scrivi la misura nell’«Esito».
6. **Peso sul pulsante.** Il pulsante dice il peso, per esempio «Avvia la vista 3D (5,2 MB)», letto
   a build time dalla dimensione di `public/modelli/enigma-i.glb`, non scritto a mano.
7. **Dopo.** Salva le stesse immagini del passo 1 in `docs/screenshot/3d/dopo/` e mostrale a Marco.

**Criteri di accettazione**

```bash
grep -c '\bflat\b' src/components/macchina/Scena.tsx
```
`0`.

```bash
ls docs/screenshot/3d/prima/*.png docs/screenshot/3d/dopo/*.png | wc -l
```
almeno `12`.

```bash
pnpm verify && pnpm build && pnpm test:e2e && pnpm test:lighthouse
```
verdi; il test «nessuna richiesta esce dal sito» resta com’è e copre anche la HDRI.

**Esito** (2026-11-05, Opus)

Valori in `RESA` e `OMBRA` in testa a `src/components/macchina/Scena.tsx`.

- **Tone mapping: ACES** (`ACESFilmicToneMapping`), esposizione 1,1. Confrontati sulle stesse
  inquadrature `flat`, ACES, AgX e Neutral: AgX sbiadisce il legno e grigia la vernice nera, Neutral
  satura il legno verso l’arancio, ACES tiene il legno caldo e il nero della piastra.
- **HDRI: sì.** È la `studio.exr` che Blender distribuisce in `datafiles/studiolights/world/`
  (1024 × 512, CC0, di Greg Zaal per Poly Haven, dal `license.txt` della stessa cartella), copiata in
  `public/ambienti/studio.exr`: 96 KB, sotto il tetto di 1,5 MB, niente da scaricare da Poly Haven.
  Con i soli `Lightformer` (anche senza `ambientLight`) la vernice raggrinzita e le cornici nichelate
  dei tasti restavano opache; con la HDRI girata di 1,6 rad la finestra di luce batte di lato sulla
  piastra e non la sbianca. Intensità 0,8, più una `directionalLight` da 0,8 per il verso delle
  ombre; tolta l’`ambientLight`, che appiattiva l’occlusione delle texture. Scarti dal piano: la
  voce non sta in `src/content/immagini.yaml`, che vuole un file in `src/assets/immagini/` e i campi
  della galleria (`alt`, `didascalia`, `categoria`); il credito sta in `modello3d.ambiente` e in un
  paragrafo della sezione «Modello 3D» di «Fonti e crediti».
- **Ombra:** `ContactShadows` sotto la cassa (lato 1,1 m, altezza 0,4 m, sfumatura 5, opacità 0,9),
  una resa per fase (`frames={1}`, `key` sulla fase a cui i pezzi sono arrivati): durante lo
  smontaggio resta l’ombra della fase di prima. Sta 0,5 mm sotto il fondo: `ContactShadows` sfuma
  disegnando un piano nell’origine con la propria camera, e con l’ombra sopra l’origine la sfumatura
  la cancellava (trovato leggendo il render target dal browser). Lo sportello di ASHISH pende 94 mm
  sotto il fondo della cassa, quindi attraversa il piano dell’ombra; sullo sfondo scuro non si nota.
- **Lampade:** la lettera accesa ha emissivo `--signal-forward` a intensità 2,5 (era 0,8) e sopra la
  lampada si accende una `PointLight` dello stesso colore (intensità 0,02, portata 5 cm), posata
  sull’`ancora_lampada_<l>`: colora il bordo del foro. La luce resta nella scena anche spenta, perché
  aggiungerla e toglierla farebbe ricompilare i materiali a ogni tasto.
- **Bloom: no.** Provato con `UnrealBloomPass` di three (soglia 1 e 0,9): fa brillare il riflesso
  della barra nichelata davanti al pannello più della lampada. Misura a 375 px (812 di altezza,
  densità 2, CPU 4× più lenta con `Emulation.setCPUThrottlingRate`, Chromium headless sulla GPU
  del Mac con `--use-angle=metal`), durante un trascinamento che fa girare la camera (azimut da
  0,58 a 3,48 rad): 60 fotogrammi al secondo, mediana e 95° percentile a 17 ms, con e senza bloom.
  La CPU non è il limite; la GPU di un telefono non è misurabile così, e il bloom non entra per il
  difetto visivo, non per le prestazioni.
- **Peso sul pulsante:** «Avvia la vista 3D (6,0 MB)». `pesoVista()` in `src/lib/peso-vista.ts`
  somma alla build il `.glb` e la HDRI (`statSync` su `public/`) e `megabytes()` in
  `src/lib/format.ts` lo scrive (1024 × 1024 byte, un decimale, virgola); la pagina lo passa
  all’isola. Tolti `PESO_VISTA` e la nota «La vista scarica circa 6 MB».
- **Fuori dai passi, per il criterio Lighthouse:** `/macchina/` a 375 px dava 88 di prestazioni
  anche su `main` (spostamento del layout 0,116): il foglio statico, prima che React parta, ha solo
  il titolo, e quando arriva quello montato `.macchina-sotto` scende di 206 px. Ora il segnaposto
  (`.macchina-foglio-segnaposto`) ha l’altezza del foglio montato senza messaggio, 266 px, solo nella
  colonna stretta: spostamento 0,004, prestazioni 91.
- **Il coperchio di legno** (rimasto dalla 4n): già nell’inquadratura dalla 5g, si vede intero nelle
  sei schermate «dopo».
- **Schermate:** `docs/screenshot/3d/prima/` e `docs/screenshot/3d/dopo/`, `fase<n>-<tema>.png` per le
  fasi 0, 2 e 4 in tema chiaro e scuro, con la lampada B accesa (si batte A). Le prende
  `node scripts/schermate-3d.ts <cartella>` sulla build, con Playwright: le stesse inquadrature per la
  5d, se servono.
- **Giudizio di Marco sulle immagini:** in attesa.

Comandi eseguiti:

```bash
grep -c '\bflat\b' src/components/macchina/Scena.tsx
ls docs/screenshot/3d/prima/*.png docs/screenshot/3d/dopo/*.png | wc -l
pnpm verify && pnpm build && pnpm test:e2e && pnpm test:lighthouse
```

Esiti: `grep` dà `0`; `ls` dà `12`; `verify` verde; e2e 206 passati e 24 saltati, compreso «nessuna
richiesta esce dal sito», che copre anche la HDRI; Lighthouse rispettato su tutte le pagine,
`/macchina/` 100 a desktop e 91 a 375 px, accessibilità 100.
