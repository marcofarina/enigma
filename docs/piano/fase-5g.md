# Fase 5g — Pagina 3D: nuovo layout e navigazione

**Modello: Sonnet · Effort: high · Durata: 3 h · Dipende da: G5; non in parallelo con la 5f, che tocca lo stesso `Scena.tsx`**

**Obiettivo.** La pagina `/macchina/` segue la sezione «Pagina 3D» di `docs/design.md`. La camera si
guida col trackpad, col mouse, col tocco e con i pulsanti, e a macchina smontata inquadra i pezzi
nell’area che i pannelli lasciano libera.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui docs/piano/fase-5g.md. Leggi prima l’indice docs/piano.md, la sezione «Pagina 3D» di
docs/design.md e l’«Esito» di docs/piano/fase-g5.md.
```

**Fatti verificati il 2026-11-05**

- `OrbitControls` in `Scena.tsx` ha `enablePan={false}`; la rotella e il trackpad fanno solo lo zoom.
- L’inquadratura dello smontaggio (`inquadratura()` in `geometria.ts`) cambia solo altezza e
  distanza, con valori scritti a mano per fase, e non sa dove stanno i pannelli.

**Decisioni della fase** (prese nel piano il 2026-11-05)

- `OrbitControls` lascia il posto a `CameraControls` di drei (libreria `camera-controls`, già
  dipendenza di drei): ha le transizioni fra viste (`setLookAt` con `enableTransition`) e
  l’inquadratura di un ingombro con margini (`fitToBox` con `paddingLeft`… `paddingBottom`), che
  servono alle viste predefinite e all’esploso.
- Gesti: trascinare ruota; Shift + trascinare o il tasto destro spostano (pan); rotella e pizzico
  sul trackpad avvicinano; due dita sul touch spostano e pizzicano. Il pan è limitato all’ingombro
  della macchina esplosa, così la macchina non esce dallo schermo.
- La tastiera della pagina batte le lettere: nessun tasto lettera muove la camera. I pulsanti sono
  raggiungibili con Tab.

**Passi**

1. **Layout.** Riscrivi `Macchina.tsx`, `macchina.css` e `src/pages/macchina/index.astro` secondo la
   griglia di `docs/design.md`, con i token di `tokens.css`.
2. **Camera.** Sostituisci `OrbitControls` con `CameraControls` e mappa i gesti delle decisioni.
   Con `prefers-reduced-motion` le transizioni sono istantanee.
3. **Pulsantiera.** Zoom avanti e indietro, ripristino, viste predefinite; ogni vista è un punto di
   vista e un bersaglio scritti in `geometria.ts`, con un test unitario. Lo stato corrente sta in un
   attributo `data-vista` della scena, per i test.
4. **Esploso.** Al posto delle inquadrature scritte a mano, la camera fa `fitToBox` sull’ingombro dei
   pezzi alla fase corrente, con i margini che lasciano libera l’area dei pannelli (in percentuale,
   da `docs/design.md`).
5. **Doppio clic.** Un doppio clic su un pezzo centra la camera su quel pezzo.
6. **Test.** In `tests/e2e/macchina.spec.ts`: un test preme «Dall’alto» e controlla `data-vista`; un
   test raggiunge la pulsantiera con Tab; un test controlla che premere una lettera con il focus
   sulla scena accenda la lampada e non muova la camera. Salva in `docs/screenshot/3d/layout/` la
   pagina a 1280 × 720 e a 375 px nelle fasi 0 e 4, e mostrale a Marco.

**Criteri di accettazione**

```bash
grep -c 'OrbitControls' src/components/macchina/Scena.tsx
```
`0`.

```bash
pnpm verify && pnpm build && pnpm test:e2e && pnpm test:lighthouse
```
verdi, con i test nuovi del passo 6. L’«Esito» riporta il giudizio di Marco sulle immagini.

**Esito** (2026-11-05)

- Layout «Banco e foglio» di `docs/design.md`: il vano della scena a sinistra con la pulsantiera nel
  piede, il foglio a destra (titolo, riga della configurazione, elenco delle cinque fasi, messaggio),
  «Come si usa» e crediti sotto la piega. Scala a 1280 × 720 come la home; sotto 1024 × 576 la
  colonna a 375 px, con le viste in un menu. Riscritti `Macchina.tsx`, `macchina.css`,
  `src/pages/macchina/index.astro`; `BaseLayout.astro` ha due proprietà nuove (`htmlClass`, `largo`).
- Camera: `OrbitControls` sostituito da `CameraControls` di drei (`grep -c OrbitControls` → `0`).
  Trascinare ruota, Shift o tasto destro spostano, rotella e pizzico avvicinano, sul tocco un dito
  ruota e due spostano e pizzicano; lo spostamento è limitato all’ingombro della macchina in tutte
  le fasi. Con `prefers-reduced-motion` ogni passaggio è istantaneo.
- Scarti dal piano, in `docs/design.md`, «Come l’ha realizzata la 5g»: niente `fitToBox`, che
  arrotonda la direzione all’asse più vicino; `inquadra()` in `geometria.ts` fa lo stesso conto
  senza toccare la direzione. Le viste sono una direzione più i nodi inquadrati alla fase corrente,
  non coordinate fisse: i pezzi si spostano con lo smontaggio.
- Lo smontaggio è un elenco di cinque opzioni: la clip ci arriva a un secondo per fase (al più 2,5 s),
  con il tempo vero e non per fotogramma. Spariscono `machine3d.phaseBetween`, `machine3d.reassemble`
  e `testoSelettore`. Il doppio clic su un pezzo (non sui tasti) centra la camera.
- Test: unitari nuovi in `src/components/macchina/macchina.test.ts` (inquadratura con proiezione degli
  spigoli, viste, zoom, pezzi); e2e in `tests/e2e/macchina.spec.ts`: «Dall’alto» e `data-vista`,
  pulsantiera con Tab, lettere che accendono la lampada senza muovere la camera, zoom. I test dello
  smontaggio scelgono l’opzione invece di fare `fill` sul cursore.
- Schermate in `docs/screenshot/3d/layout/`: 1280 × 720 e 375 px (pagina intera), fasi 0 e 4, tema
  chiaro e scuro (8 file), prese come in G5 con Playwright su `astro preview`. A fase 4 la macchina
  esplosa sta tutta nella scena, coperchio e pannello frontale compresi.
- **Giudizio di Marco sulle immagini (2026-11-05): approvate, nessuna correzione.**
- Da sapere: la prima inquadratura a fase 0 è più stretta dell’anteprima statica (margine del 6 %
  invece dell’inquadratura di Blender), quindi quando la scena parte la macchina si ingrandisce un
  po’. La 5f
  tocca ancora `Scena.tsx`: dopo questa fase va fatta partendo da `main`.
- Comandi eseguiti: `grep -c 'OrbitControls' src/components/macchina/Scena.tsx` → `0`;
  `pnpm verify` verde; `pnpm build && pnpm test:e2e` → 206 passati, 24 saltati (test di
  altri file che girano solo su desktop o solo su un progetto); `pnpm test:lighthouse` → budget rispettato su tutte le pagine, `/macchina/`
  prestazioni 100 a desktop e 91 a 375 px, accessibilità 100.
