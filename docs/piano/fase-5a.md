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
