# Fase 4l — Modello ibrido: esterno di terzi, scomposizione e catena di esportazione

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: D20–D23; non si fa nel cloud, Marco deve avere Blender aperto sul Mac e lo zip del modello di ASHISH scaricato**

**Obiettivo.** Il `.glb` diventa ibrido. L’esterno viene dal modello «Enigma Machine» di ASHISH
(Sketchfab, CC BY 4.0): cassa, coperchio di legno, piastra, coperchio interno, tastiera, pannello
a spine. L’interno resta quello delle fasi 4i–4k, per ora così com’è. La fase decide come i pezzi
di ASHISH diventano i nodi della convenzione e riscrive `convenzione-3d.md` di conseguenza. Alla
fine la pagina `/macchina/` carica il modello nuovo e gli e2e passano.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-4l.md. Leggi prima l’indice docs/piano.md (decisioni D14, D15, D20–D23)
e docs/piano/convenzione-3d.md. Controlla che gli strumenti dell’MCP di Blender siano disponibili
in questa sessione; se non lo sono, fermati e dimmi che cosa manca.
```

**Fatti verificati il 2026-11-05** (sul modello aperto in Blender, scena `riferimento_ashish`)

- Lo zip `enigma_machine.zip` pesa 176 MB, sha256
  `5e06a4715f644e43c9bc2e47294424001f52f83b5a611944734de169991b9978`. Contiene `scene.gltf`,
  `scene.bin`, `license.txt` (CC-BY-4.0, con il testo dell’attribuzione da copiare) e nove texture
  PNG 4096 × 4096 in `textures/`.
- 148 000 facce, 79 mesh con nomi generici (`part.012_low_low_mec.002_0`), cinque materiali: due
  atlanti con colore, metallicità/ruvidità e normal map (`low_mec.002` per la meccanica,
  `low_box.001` per la cassa), due varianti (`w1_low_box`, `w2_low_mec`) e `glass`. Nessuna
  texture di occlusione.
- Sotto la piastra superiore la cassa è vuota: niente rotori, lampade, riflettore, ruota
  d’ingresso, nottolini. Le lettere delle lampade sono dipinte sulla piastra.
- Le tre file di tasti sono tre mesh (`part.012`, `part.013`, `part.014`) con 63, 63 e 56 pezzi
  staccati, cioè 7 per tasto. Il pannello a spine (`part.054`, 36 864 facce) ha 270 pezzi staccati,
  cavi compresi.
- Dopo l’importazione in Blender il fondo (`part.085`) misura 350 × 290 mm, con il lato lungo su X
  e il pannello a spine verso −X: va ruotato di 90° attorno a Z per avere il fronte verso −Y come
  vuole la convenzione. La convenzione dà 340 × 280 mm (fonte `technikmuseum-enigma`).

**Passi**

1. **Sorgente.** Estrai lo zip in `scripts/blender/sorgenti/ashish/` e aggiungi
   `scripts/blender/sorgenti/` a `.gitignore` (D21). Scrivi `scripts/blender/sorgenti.md`: URL del
   modello, autore, licenza, sha256 dello zip e il comando per estrarlo. `pnpm modello` senza la
   cartella si ferma con un messaggio che rimanda a quel file.
2. **Prima il file, poi l’esecuzione**, come dalla 4i: uno script nuovo, `scripts/blender/esterno.py`,
   chiamato da `costruisci.py`, importa `scene.gltf`, lo ruota, lo scala alla cassa della
   convenzione (scala uniforme; scrivi il fattore nell’«Esito») e lo scompone. L’MCP serve a
   guardare il risultato, non a modificarlo a mano.
3. **Corrispondenza dei pezzi.** Decidi quale `part.*` diventa quale nodo e scrivilo come tabella in
   `esterno.py` (nomi di ASHISH → nodi della convenzione), con questi vincoli:
   - i 26 tasti si separano per vicinanza dei pezzi staccati e prendono i nomi `tasto_a` … `tasto_z`
     dalla lettera dipinta (ordine QWERTZ della convenzione), con l’origine alla base;
   - dal pannello a spine si tolgono i cavi e le spine inserite: li disegna il codice (D15);
   - il coperchio di legno diventa `coperchio_legno` (D22), con l’origine sulla cerniera;
   - i pezzi interni delle fasi 4i–4k restano gli unici rotori, riflettore, ruota d’ingresso,
     nottolini, leva e batteria; se un pezzo di ASHISH occupa il loro posto (per esempio le punte
     delle rotelle sotto le finestrelle), lo togli tu.
4. **Lampade.** Le lettere dipinte non si accendono. Decidi come fare le 26 `lampada_<l>`: la strada
   più corta è un disco di vetro sopra ogni lettera dipinta, con l’emissivo messo dalla pagina.
   Scrivi la scelta in `convenzione-3d.md`.
5. **Ancore.** Rimetti `ancora_tasto_<l>`, `ancora_presa_<l>`, `ancora_lampada_<l>` e
   `ancora_batteria` sulla geometria nuova: i cavi della 5b le usano.
6. **Peso.** Texture ridotte a 2048 px ed esportate in WebP; geometria compressa con meshopt.
   L’esportatore di Blender non scrive meshopt: aggiungi alla catena di `pnpm modello` un passo con
   `@gltf-transform/cli` (dipendenza di sviluppo). Nella pagina, `useGLTF(modello3d.file, false, true)`
   attiva il decoder meshopt, che sta nel bundle: nessuna richiesta esce dal sito. Il tetto è 6 MB
   (D23).
7. **Convenzione e verifica.** Riscrivi in `convenzione-3d.md` le sezioni che cambiano (misure,
   nodi, materiali, lettere, peso) e aggiorna `scripts/verifica-modello.ts` nello stesso commit:
   `FASE_MODELLO = '4l'`, `TETTO['4l']` di 6 MB, `coperchio_legno` in `NODI_ATTESI`.
8. **Pagina.** Se `Scena.tsx` cerca un materiale che non esiste più (oggi `cima_tasto` per le
   lettere dei tasti, `vetro` per le lampade), correggila nel minimo indispensabile e scrivi che
   cosa hai cambiato nell’«Esito». La resa (luce, tone mapping) è della 5f: non toccarla.
9. **Attribuzione.** Il credito di `license.txt` va nella pagina `/macchina/` e in
   `src/pages/fonti/index.astro`, accanto alle licenze del sito; la geometria derivata resta
   CC BY-NC-SA 4.0 (D20).
10. **Anteprime.** Rigenera le anteprime delle fasi (`scripts/blender/anteprime/`) e guardale con
    l’MCP. Lo smontaggio può ancora avere pezzi che si compenetrano: lo sistema la 4n.

**Criteri di accettazione**

```bash
git check-ignore scripts/blender/sorgenti/ashish/scene.gltf
```
exit 0.

```bash
pnpm modello && pnpm verifica:modello
```
exit 0, con `FASE_MODELLO` uguale a `'4l'` e il peso sotto 6 MB.

```bash
grep -c 'ASHISH' src/pages/fonti/index.astro src/pages/macchina/index.astro
```
almeno `1` per file.

```bash
pnpm verify && pnpm build && pnpm test:e2e
```
verdi; il test «nessuna richiesta esce dal sito» resta com’è.

**Esito.** Da compilare: tabella della corrispondenza dei pezzi, fattore di scala, peso
(texture e geometria separati), numero di facce, scelta per le lampade, modifiche a `Scena.tsx`.
