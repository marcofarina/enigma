# Fase 5a — Pagina 3D: architettura, caricamento e digitazione

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 4h, 4i (basta il modello abbozzato)**

**Obiettivo.** La pagina `/macchina/` con la macchina in 3D (React Three Fiber e drei), caricata
solo su richiesta. Si ruota la camera, si digita dalla tastiera fisica o dai tasti del modello, e
lampade e rotori rispondono al motore. Senza WebGL resta un avviso con il rimando al simulatore.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5a.md. Leggi prima l’indice docs/piano.md (le decisioni D14 e D15) e
docs/piano/convenzione-3d.md, poi l’«Esito» in fondo a docs/piano/fase-4i.md: dicono dove sta il modello, come si chiamano i suoi nodi e
con quale licenza. Se la 4i non è fatta, fermati e dimmelo.
```

**Passi**

1. **Pagina e menu.** `/macchina/` con `url()` e una voce di menu come le altre sezioni. La home
   cambia solo per un link «Vista 3D» nell’intestazione del banco, che porta la configurazione
   corrente; se il link non entra nel layout di `docs/design.md` a 1280 × 720, lascialo fuori e
   scrivilo nell’«Esito». La pagina si apre con l’anteprima della 4i e il pulsante «Avvia la vista
   3D».
2. **Caricamento pigro.** three.js, React Three Fiber, drei e il `.glb` si scaricano dopo il
   pulsante. Nessuna richiesta a host esterni, nemmeno dopo: niente `preset` di `<Environment>`
   (drei li scarica da un CDN), luce con i Lightformer di drei o con luci semplici; niente Draco,
   il cui decoder drei lo scarica da gstatic (controlla entrambe le cose nella versione installata).
   Se serve comprimere, meshopt, che ha il decoder dentro three.js.
3. **Configurazione.** La pagina legge la query come la home (`Simulator.tsx`) e crea il suo store
   con `createSimulatorStore`; i link condivisibili funzionano allo stesso modo. Con un modello
   diverso dall’Enigma I nella query, mostra un avviso, la configurazione predefinita dell’Enigma I
   e il link al simulatore con la configurazione ricevuta.
4. **Digitazione.** Il contenitore della scena usa `useKeyCapture` di `store.ts`, con `tabindex` e
   un’etichetta; il clic su un tasto del modello chiama `press` dello store. Il motore resta uno.
5. **Segnale.** Lampada accesa con il colore di `--signal-forward`, tasto abbassato, rotori e anelli
   ruotati secondo posizione e Ringstellung. Un’area `aria-live` fuori schermo annuncia «Lampada E»
   a ogni tasto, e serve anche ai test.
6. **Rendering.** `frameloop="demand"`, così la scena si ridisegna solo quando cambia qualcosa, e
   densità di pixel al massimo 2.
7. **Accessibilità e preferenze.** Senza WebGL un avviso e il rimando al simulatore; con
   `prefers-reduced-motion` niente rotazioni automatiche e transizioni di camera senza animazione.
8. **WebGL nei test.** Prima di scrivere i test controlla se il Chromium headless di Playwright ha
   WebGL (`page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))`). Se non ce
   l’ha, aggiungi in `playwright.config.ts` i flag di SwiftShader (con le versioni recenti di
   Chromium serve `--enable-unsafe-swiftshader`: verificalo) e scrivi nell’«Esito» quali.
9. **Licenza del modello.** Una voce nei crediti, come le immagini, dalla licenza registrata nella
   riga D14 dell’indice (docs/piano.md).
10. **Prestazioni.** `/macchina/` entra in `scripts/pagine.ts`, quindi nel budget di Lighthouse
    (prestazioni ≥ 90, accessibilità 100) e nei test di axe, misurati sullo stato iniziale.

**Criteri di accettazione**

```bash
pnpm build && ls dist/_astro | grep -ci three
```
almeno `1`; né la home né `/macchina/` prima del clic scaricano three.js o il `.glb`, e dopo il clic
nessuna richiesta va a un host diverso dal sito (test e2e sulle richieste di rete).

```bash
pnpm build && pnpm test:lighthouse
```
exit 0, con `/macchina/` nel budget.

```bash
pnpm verify && pnpm test:e2e
```
con un test che avvia la vista, batte una lettera e legge l’annuncio della lampada, e uno che apre
`/macchina/` con un’Enigma M4 nella query e trova l’avviso.

**Esito (2026-11-05)**

- **Pagina.** `/macchina/` (`src/pages/macchina/index.astro`) con `BaseLayout`, titolo, istruzioni,
  l’anteprima della 4i e il pulsante «Avvia la vista 3D» in una targhetta al centro del palco. Il
  palco ha i colori della macchina in entrambi i temi, 16:9 e al massimo tre quarti della finestra.
  Sotto: finestrelle, ultimi sei gruppi di tasti e di lampade, «Ricomincia» e «Apri questa
  configurazione nel simulatore» (configurazione di partenza più i tasti battuti). In fondo la riga
  dei crediti, con il link alla voce «Modello 3D» di «Fonti e crediti».
- **Menu.** «Macchina 3D» è la seconda voce di `SiteHeader.astro`, dopo «Simulatore». Con otto voci la
  barra non stava più a 768 px (71 px di troppo, e il test della 4g lo vietava): ora le voci stanno
  nella barra da 1024 px in su, sotto c’è il menu a foglio. Aggiornati `docs/design.md` («Pagine del
  sito») e il test in `smoke.spec.ts` (otto voci su una riga a 1024 px, menu a foglio a 768 px).
- **Link «Vista 3D» nella home: lasciato fuori.** Nell’intestazione del banco, a 1280 × 720, restano
  liberi circa 26 px: non entra né come pulsante né come voce di testo, e con il link «Spine» e
  «Modalità LIM» andavano a capo. Dalla home la pagina 3D si raggiunge quindi solo dal menu delle
  altre pagine. Se Marco lo vuole, va tolto o accorciato qualcos’altro nella barra.
- **Architettura.** `src/components/macchina/`: `Macchina.tsx` (isola `client:only`, legge la query
  con `sessioneDallaQuery`, crea lo store con `createSimulatorStore`, usa `useKeyCapture` sul palco
  con `role="application"`, `tabindex` ed etichetta); `Scena.tsx` (importata con `lazy`, porta three.js,
  React Three Fiber 9.8 e drei 10.7); `geometria.ts` e `configurazione.ts` (conti senza three.js, con
  test in `macchina.test.ts`). Lo store resta l’unica fonte: la scena si abbona e muove rotori,
  anelli, lampade e tasti da lì; il clic su un tasto del modello chiama `press`.
- **Angoli.** Rotore: (posizione − anello) passi su X; anello, figlio del rotore: anello passi. Un test
  confronta il risultato con i contatti `coreInput`/`input` che il motore dà a ogni tasto (rotori
  II IV V, anelli BUL), e uno che in alto c’è il numero della finestrella. Visto anche nella scena: con
  `p=ABZ` le finestrelle mostrano 01, 02, 26.
- **Lettere.** Tasti e lampade ricevono un materiale clonato con la texture spostata sulla loro cella
  (convenzione, «Lettere e numeri»). La lampada accesa prende `--signal-forward` sia come tinta sia
  come emissivo: con il solo emissivo, sulla tessera crema, l’arancio diventava bianco.
- **Rete.** `useGLTF(file, false, false)`: niente Draco (il decoder di drei 10.7.9 sta su
  `www.gstatic.com`) né meshopt. Niente `preset` di `<Environment>` (i file stanno su
  `raw.githack.com`): i riflessi dei metalli vengono da tre `Lightformer`. Le stringhe con quegli
  indirizzi restano nel chunk, ma non vengono usate; il test di rete lo conferma. L’unica richiesta
  non `http` è un `blob:` del sito, la texture estratta dal `.glb`.
- **Chunk.** `astro.config.mjs` mette il solo pacchetto `three` nel gruppo `three` di
  `codeSplitting` (rolldown): un gruppo trascina le dipendenze dei suoi moduli, e con React Three
  Fiber ci finiva React, che allora caricavano tutte le pagine. `includeDependenciesRecursively:
  false` non si può usare, perché Astro tiene `preserveEntrySignatures: 'exports-only'`. Pesi: `three`
  743 KB (185 KB compresso), `Scena` 322 KB (101 KB), il `.glb` 582 KB (126 KB se servito compresso).
  La nota sotto il pulsante dice «circa 900 KB», il caso peggiore.
- **Rendering.** `frameloop="demand"`, `dpr={[1, 2]}`, `flat` (niente tone mapping, i materiali sono
  piani), camera dell’anteprima convertita in glTF (22,9° verticali), così anteprima e prima
  immagine coincidono. Niente rotazione automatica; con `prefers-reduced-motion` la camera non ha
  inerzia.
- **WebGL nei test.** Il Chromium headless di Playwright 1.63 (Chromium 153) ha già WebGL 2 su macOS,
  con SwiftShader, anche senza flag. Ho aggiunto comunque `--enable-unsafe-swiftshader` in
  `playwright.config.ts`, per la CI su Linux senza GPU: non l’ho potuto provare lì.
- **Test.** `tests/e2e/macchina.spec.ts`: nessuna richiesta di `three` o del `.glb` prima del
  pulsante, né dalla home né da `/macchina/`; avvio, «a», «Shift+B», Backspace, annuncio «Lampada …»
  e nastro confrontati con `encipherWith`, nessuna richiesta fuori dal sito, axe a scena avviata;
  link dell’Enigma I con il messaggio; M4 nella query con l’avviso; senza WebGL l’avviso e nessun
  download. Il clic su un tasto del modello l’ho provato a mano (tasto L, lampada P, come il motore).
- **Crediti.** Voce «Modello 3D» in «Fonti e crediti» (`id="modello-3d"`): geometria di Marco Farina,
  CC BY-NC-SA 4.0, misure dal Deutsches Technikmuseum, lettere in Archivo (SIL OFL 1.1).
  `licenseLabel` ora riconosce anche le licenze NC. Marco controlla la formula dell’attribuzione.
- **Per la 5b.** Nottolini e `leva_tasti` non si muovono ancora; rotori e anelli scattano senza
  animazione. La clip `smontaggio` non è caricata in un `AnimationMixer`. Il tasto resta giù 140 ms.
- **Comandi eseguiti.** `pnpm verify` (227 unit test), `pnpm test:e2e` (186 passati, 24 saltati come
  prima), `pnpm test:lighthouse`: `/macchina/` 100/100 a desktop e 97/100 a 375 px;
  `ls dist/_astro | grep -ci three` dà 1.
