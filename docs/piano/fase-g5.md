# Fase G5 — Pagina 3D: riprogettazione su Claude Design

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: — (si può fare subito, in parallelo con le fasi del modello); Marco deve essere presente per scegliere la direzione**

**Obiettivo.** La pagina `/macchina/` ha un progetto approvato da Marco, scelto fra tre direzioni su
un canvas di Claude Design come nella G0 (D6), dentro il design system di `docs/design.md`. Il
progetto risolve i difetti che Marco ha trovato il 2026-11-05 provando la pagina (D24).

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-g5.md. Leggi prima l’indice docs/piano.md (decisione D24) e
docs/design.md. Il procedimento è quello della fase G0 in docs/piano-aggiornamento.md.
```

**I difetti da risolvere** (Marco, 2026-11-05)

1. Il design della pagina non funziona: la scena non è la protagonista.
2. In vista esplosa i pannelli sopra e a lato della scena coprono i pezzi.
3. Col trackpad la navigazione non è ovvia e non c’è il pan; servono anche controlli con pulsanti.

Il flicker del selettore e lo spessore dei fili sono già corretti (commit `4600d19`, 2026-11-05).

**Passi**

1. **Prima.** Salva in `docs/screenshot/macchina-prima/` la pagina a 1280 × 720 e a 375 px, nelle fasi
   0 e 4 dello smontaggio, in tema chiaro e scuro.
2. **Inventario.** Ogni pezzo di `src/components/macchina/Macchina.tsx` e di
   `src/pages/macchina/index.astro` (testo d’apertura, anteprima, pulsante, scena, selettore dello
   smontaggio, nastro dei tasti e delle lampade, finestrelle, avvisi) con la sua funzione. Aggiungi
   i pezzi che arrivano dopo: la pulsantiera di navigazione (5g), la scheda di un pezzo (5c), il
   lettore della lezione animata (5d). Nessun pezzo sparisce senza una decisione di Marco scritta in
   `docs/design.md`.
3. **Canvas.** Crea un canvas di Claude Design (Artifact di tipo «Design») con tre direzioni della
   pagina a 1280 × 720, ognuna con la sua artboard a 375 px e con la fase 4 dello smontaggio. Per la
   scena usa gli screenshot del passo 1. Vincoli comuni alle tre direzioni:
   - la scena occupa la parte più grande della finestra, e a macchina smontata nessun pannello copre
     l’area in cui la camera inquadra i pezzi;
   - la pulsantiera: zoom avanti e indietro, ripristino, viste predefinite («Fronte», «Dall’alto»,
     «Rotori», «Pannello a spine»), e un aiuto che dice i gesti (trascinare ruota, Shift o tasto
     destro sposta, rotella o pizzico avvicina);
   - il selettore dello smontaggio ha il testo della fase a larghezza fissa;
   - i token di `src/styles/tokens.css`, i font di `docs/design.md`, i principi «La macchina è un
     oggetto, il sito è carta».
4. **Scelta.** Fai scegliere Marco (una direzione, o una combinazione dichiarata) e itera sul canvas
   finché non approva.
5. **Scrittura.** Aggiungi a `docs/design.md` la sezione `## Pagina 3D`: link al canvas, artboard di
   riferimento, griglia a 1280 × 720 e a 375 px con la posizione di ogni pezzo dell’inventario, dove
   finisce l’area libera della camera (in percentuale della scena), comportamento della pulsantiera
   da tastiera e con `prefers-reduced-motion`.

**Criteri di accettazione**

```bash
ls docs/screenshot/macchina-prima/*.png | wc -l
```
almeno `8`.

```bash
grep -c '^## Pagina 3D' docs/design.md && sed -n '/^## Pagina 3D/,/^## /p' docs/design.md | grep -c 'claude.ai/'
```
`1` e almeno `1`.

L’«Esito» dice quale direzione ha scelto Marco e in che data.

**Esito.** Da compilare.
