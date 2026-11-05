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

**Esito** (2026-11-05, Sonnet): **parziale**. Il modello è fatto e verificato; mancano gli e2e (vedi
sotto) e il giudizio di Marco sulle immagini del passo 5.

L’interno ha smussi, un materiale solo cotto in un atlante e occlusione. Sorgenti nuovi in
`scripts/blender/`: `smussi.py` (Bevel + Weighted Normal sulle mesh interne, una volta per mesh),
`cottura.py` (materiali procedurali, UV in un atlante, cottura con Cycles, materiale `interno`) e
`confronto.py` (rende i confronti dal `.glb` grezzo). `costruisci.py` li chiama prima dell’esterno.
`FASE_MODELLO` è `'4m'` e `verifica-modello.ts` controlla il materiale `interno` (le quattro texture,
al più 1024 px, occlusione e ruvidità nella stessa immagine) e l’assenza dei materiali piani.

- **Materiali e atlante:** `interno`, tre immagini WebP di 1024 × 1024 (colore 141 KB, ORM 172 KB,
  normal map 129 KB). Colori e finiture dalle foto della galleria (`rotori-con-anelli`) e dalla texture
  di ASHISH `low_mec.002`: bachelite nera, alluminio satinato con zigrinatura per la rotella, ottone,
  vernice raggrinzita con il ferro agli spigoli, cartone per la batteria. La densità è circa 10 pixel
  per mm. A 2048 px l’atlante pesava 960 KB e il file 6650 KB: oltre il tetto, quindi 1024 (il ripiego
  del passo 6).
- **Occlusione:** cotta un pezzo alla volta, non a pezzi montati come diceva il passo 3: montati, le
  facce che si toccano (rotella sull’anello, cricchetto nel nucleo) uscivano nere, e lo smontaggio le
  scopre. Così le ombre sono quelle dentro il pezzo (fra i denti, nei fori, negli smussi).
  three.js usa la mappa di occlusione solo con la luce d’ambiente: la resa è della 5f.
- **Smussi:** 0,3–0,6 mm sugli spigoli oltre 30°, un segmento sui pezzi a denti e piccoli, due sugli
  altri. Le mesh interne passano da 3844 a 15 660 triangoli (+11 816); le mesh del file da 113 723 a
  125 539, i triangoli disegnati da 118 027 a 133 411. Con due segmenti dappertutto erano 17 996.
- **Peso:** da 5479 KB a 6106 KB (tetto 6144): texture 4449 KB (interno 442, ASHISH 3995, glifi 12),
  geometria, animazione e JSON 1657 KB. Il margine è di 38 KB: chi aggiunge geometria o texture deve
  prima toglierne (per esempio le normal map di ASHISH a qualità 80).
- **Immagini del passo 5** in `docs/screenshot/modello/`: `rotore-aperto`, `rotori-estratti`,
  `riflettore`, `nottolini` e `batteria`, rese dal `.glb` esportato con la luce dell’anteprima. Le ho
  riguardate anche nel Blender aperto, importando il `.glb` in una scena provvisoria poi tolta, con
  l’ombreggiatura dei materiali. L’interno e la piastra di ASHISH stanno bene insieme; il pezzo più
  debole è la batteria, un parallelepipedo di cartone senza dettagli.
- **Giudizio di Marco sulle immagini:** da riportare qui.

Non fatto, perché non è fra i passi della 4m (la 4l li aveva assegnati a questa fase, ma il suo file
non li elenca) e cambia la geometria e le posizioni della convenzione: il passo dei rotori (30 mm
contro i 28,1 delle finestrelle di ASHISH), le rotelle a destra dell’anello mentre ASHISH ha le
coperture a sinistra, la leva più avanti dei tasti. Restano aperti; servono una decisione di Marco e,
se si fanno, una fase di geometria. Il perno dei nottolini nella cassa resta `ottone` piatto, dello
stesso colore di quello cotto.

Comandi eseguiti:

```bash
pnpm modello && pnpm verifica:modello
grep -l "BEVEL" scripts/blender/*.py | wc -l
ls docs/screenshot/modello/*.png | wc -l
pnpm verify
pnpm build && pnpm test:e2e
```

Esiti: `pnpm modello` e `verifica:modello` verdi (`fase 4m: 6106 KB … 0 errori.`, la build in circa
2,5 minuti per la cottura); `grep` dà 1; `ls` dà 5; `pnpm verify` verde. **`pnpm test:e2e` non verde:**
158 passati e 24 saltati, ma i fallimenti sono dovuti a un `pnpm dev` rimasto acceso sulla porta 4321
(avviato alle 11:23 nella cartella del progetto), che Playwright ha riusato al posto della build: i
messaggi di errore citano la barra di sviluppo di Astro (`data-app-id="astro:home"`). Non ho potuto
fermarlo (il permesso è stato negato) e la porta è fissa in `playwright.config.ts`; vanno rifatti
dopo averlo fermato.
