# Fase 4m — Modello ibrido: l’interno allo stesso livello dell’esterno

**Modello: Sonnet · Effort: high · Durata: 3,5 h · Dipende da: 4l; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** I pezzi interni costruiti nelle fasi 4i–4k (rotori con anelli, cricchetti, rotelle e
contatti, riflettore, ruota d’ingresso, nottolini, leva, batteria, lampade della 4l) hanno la stessa
qualità dell’esterno di ASHISH: spigoli smussati, materiali con texture, ombre di contatto cotte.
Nella vista esplosa stanno accanto all’esterno e non devono sembrare di un altro gioco.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui docs/piano/fase-4m.md. Leggi prima l’indice docs/piano.md e
docs/piano/convenzione-3d.md, poi l’«Esito» in fondo a docs/piano/fase-4l.md. Controlla che gli
strumenti dell’MCP di Blender siano disponibili in questa sessione; se non lo sono, fermati e
dimmi che cosa manca.
```

**Perché il modello di oggi sembra di plastica** (diagnosi del 2026-11-05)

- Nessuno smusso: negli script di `scripts/blender/` non c’è un modificatore Bevel, e gli spigoli
  vivi non prendono luce.
- Materiali piani: solo colore, metallicità e ruvidità uniformi (`materiale()` in `comune.py`),
  per la D14 ora superata dalla D20.
- Nessuna occlusione: i pezzi non si fanno ombra a vicenda.

Il modello di J_ su Sketchfab (10 437 facce, quanto il nostro) dimostra che la differenza la fanno
texture e normal map, non i poligoni.

**Passi**

1. **Riferimenti.** Le texture di ASHISH (`scripts/blender/sorgenti/ashish/textures/`) per i colori
   della vernice, del metallo e dell’ottone; le foto della galleria (`rotori-e-perno`,
   `rotori-con-anelli`, `enigma-i-milano`) per i pezzi interni.
2. **Smussi.** Modificatore Bevel con normali pesate su ogni pezzo interno, applicato prima
   dell’esportazione. Le rotelle dei rotori hanno la zigrinatura, i contatti piani e i puntali
   l’ottone.
3. **Materiali.** Materiali procedurali in Blender (alluminio dell’anello, bachelite del nucleo,
   ottone dei contatti, vernice raggrinzita del riflettore e della ruota d’ingresso, cartone e
   metallo della batteria), cotti con Cycles in un atlante 2048 × 2048: colore, ORM
   (occlusione, ruvidità, metallicità) e normal map. L’occlusione cotta dà le ombre fra i pezzi.
   Le lettere e i numeri restano nell’atlante dei glifi della convenzione.
4. **Prima il file, poi l’esecuzione.** Smussi, materiali e cottura sono script in
   `scripts/blender/`, chiamati da `costruisci.py`; `pnpm modello` li esegue in background.
5. **Confronto.** Con l’MCP guarda ogni pezzo interno accanto alla piastra di ASHISH, con la stessa
   luce, e salva le immagini in `docs/screenshot/modello/` (almeno: rotore aperto, riflettore,
   nottolini, batteria). Mostrale a Marco prima di chiudere.
6. **Peso.** Il tetto resta 6 MB. Se lo superi, riduci prima l’atlante dell’interno a 1024 px.

**Criteri di accettazione**

```bash
pnpm modello && pnpm verifica:modello
```
exit 0, con `FASE_MODELLO` uguale a `'4m'` e il peso sotto 6 MB.

```bash
grep -l "BEVEL" scripts/blender/*.py | wc -l
```
almeno `1`.

```bash
ls docs/screenshot/modello/*.png | wc -l
```
almeno `4`.

```bash
pnpm verify && pnpm build && pnpm test:e2e
```
verdi. L’«Esito» riporta il giudizio di Marco sulle immagini del passo 5.

**Esito.** Da compilare: materiali e risoluzione dell’atlante, peso prima e dopo, facce aggiunte
dagli smussi, giudizio di Marco.
