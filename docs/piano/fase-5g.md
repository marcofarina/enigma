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

**Esito.** Da compilare.
