# Fase 4n — Modello ibrido: smontaggio, anteprima e chiusura

**Modello: Sonnet · Effort: high · Durata: 2 h · Dipende da: 4m; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** La clip `smontaggio` funziona sul modello ibrido: il coperchio di legno si allontana
nella fase 1 (D22), i rotori escono dal coperchio interno di ASHISH senza attraversarlo, nessun pezzo
ne compenetra un altro in nessuna fase. L’anteprima della pagina mostra il modello nuovo.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui docs/piano/fase-4n.md. Leggi prima l’indice docs/piano.md e
docs/piano/convenzione-3d.md, poi l’«Esito» in fondo a docs/piano/fase-4l.md e
docs/piano/fase-4m.md. Controlla che gli strumenti dell’MCP di Blender siano disponibili in
questa sessione; se non lo sono, fermati e dimmi che cosa manca.
```

**Passi**

1. **Clip.** Aggiorna `scripts/blender/smontaggio.py`: `coperchio_legno` si sposta all’indietro e in
   basso nella fase 1, fuori dall’inquadratura dei rotori; gli altri spostamenti si adattano alle
   misure nuove. Le regole della convenzione restano: solo tracce `translation`, un secondo per
   fase, nessuna traccia sui nodi che il codice trasla.
2. **Compenetrazioni.** Guarda con l’MCP ogni fase (0, 1, 2, 3, 4) da tre lati; se due pezzi si
   attraversano, correggi gli spostamenti. Rigenera `scripts/blender/anteprime/`.
3. **Anteprima della pagina.** Rigenera `public/modelli/enigma-i-anteprima.webp`, l’immagine che la
   pagina mostra prima di «Avvia la vista 3D», con la stessa inquadratura della camera iniziale e un peso dello stesso ordine di quella di oggi (26 KB): la misura Lighthouse (`scripts/pagine.ts` include `macchina/`).
4. **Verifica.** `FASE_MODELLO = '4n'`; la verifica controlla anche le tracce di `coperchio_legno`.
5. **Rischi chiusi.** Togli da «Prerequisiti e rischi» di `docs/piano.md` la frase sulla qualità
   visiva legata a un modello costruito da un LLM, se l’«Esito» della 4m riporta il sì di Marco.

**Criteri di accettazione**

```bash
pnpm modello && pnpm verifica:modello
```
exit 0, con `FASE_MODELLO` uguale a `'4n'`.

```bash
find scripts/blender/anteprime -name 'fase-*.png' -newer scripts/blender/smontaggio.py | wc -l
```
`5`: una anteprima per fase, rigenerata dopo l’ultima modifica della clip.

```bash
pnpm verify && pnpm build && pnpm test:e2e
```
verdi, compresi i test dello smontaggio di `tests/e2e/macchina.spec.ts`.

**Esito** (2026-11-05, Sonnet): fatta. Le fasi, viste da tre lati nel Blender aperto e nelle anteprime,
non mostrano pezzi che si attraversano. Non ho chiesto a Marco un giudizio sulle immagini: va dato.

Spostamenti cambiati in `scripts/blender/smontaggio.py` (assi di Blender, in millimetri):

| Pezzo | Prima (4l) | Ora (4n) | Perché |
| --- | --- | --- | --- |
| `coperchio_legno` | 0, +150, 0 | 0, +170, −40 | D22: indietro e in basso, fuori dai rotori; il fondo resta a z = 2 mm, sopra il piano |
| `sportello_spine` | 0, −30, +100 | 0, −70, 0 | in ASHISH pende già aperto sotto il pannello: salendo lo copriva |
| gli altri | — | invariati | le misure della 4l bastano |

Compenetrazioni: la verifica automatica, dopo ogni costruzione, confrontava solo la fine dell'ultima
fase; ora `sovrapposizioni()` confronta le scatole dei pezzi alla fine di ciascuna delle quattro fasi e
dà terne (fase, pezzo, pezzo). Con i valori nuovi non trova niente. Il vecchio sportello alzato non lo
trovava lo stesso: copriva il pannello solo alla vista, senza che le scatole si toccassero. Il
margine più stretto sono i 59 mm fra il coperchio di legno (y ≥ 221 mm) e il coperchio interno sollevato
(y ≤ 162 mm), che però salgono in momenti diversi dai rotori.

Guardato: le fasi 0–4 in anteprime di Blender dal fronte, da destra, da dietro e dall'alto
(`scripts/blender/anteprime/fase-0.png` … `fase-4.png` sono le cinque rigenerate dopo l'ultima
modifica della clip); le fasi 1, 3 e 4 del `.glb` grezzo, importato in una scena provvisoria del
Blender aperto (poi tolta, con i suoi dati) e viste con l'MCP da fronte, destra, dietro e tre quarti.

Anteprima della pagina: rigenerata da `pnpm modello`, stessa camera di prima e di `Scena.tsx`
(`0.52, −0.80, 0.60`, 50 mm); pesa 57 KB, non i 26 KB del testo della fase, che era vecchio: già la 4l
e la 4m la portavano a 57 KB e l'ordine è lo stesso. Il peso del `.glb` non cambia, 6085 KB, perché è
cambiata solo la clip.

`FASE_MODELLO = '4n'`; `verifica-modello.ts` controlla che `coperchio_legno` sia mosso solo nella
fase 1, di almeno 100 mm all'indietro e in basso. `docs/piano/convenzione-3d.md` (fase 1, nota finale)
e `docs/piano.md` (stato, rischi) sono aggiornati: del rischio sulla qualità visiva resta solo la stima
di 4j e 4k, perché la 4m riporta il sì di Marco.

Ancora aperto, non toccato: la striscia rossa sotto il coperchio di legno, visibile a macchina smontata,
è una cinghia di ASHISH (`coperchio_legno`) e resta; le tre differenze di geometria fra interno ed
esterno (passo dei rotori 30 mm contro 28,1, rotelle a destra dell'anello, leva più avanti dei tasti);
`Scena.tsx` taglia ancora la cima del coperchio di legno, che a 435 mm di altezza esce dall'inquadratura:
è compito della 5f.

Comandi eseguiti:

```bash
pnpm modello && pnpm verifica:modello
find scripts/blender/anteprime -name 'fase-*.png' -newer scripts/blender/smontaggio.py | wc -l
pnpm verify && pnpm build && pnpm test:e2e
```

Esiti: `verifica:modello` dà `fase 4n: 6085 KB … 0 errori.`; `find` dà 5; `verify` verde, build
verde, e2e 198 passati e 24 saltati (il server di sviluppo non era acceso).
