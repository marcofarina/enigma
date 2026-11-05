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

**Esito.** Da compilare: spostamenti cambiati, compenetrazioni trovate e corrette, peso finale.
