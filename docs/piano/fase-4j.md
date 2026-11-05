# Fase 4j — Modello 3D: geometria completa e ancore

**Modello: Sonnet · Effort: high · Durata: 3 h · Dipende da: 4i; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** L’abbozzo della 4i diventa la macchina: la geometria esterna e interna con il
dettaglio delle foto, i pezzi marcati «4j» nella convenzione, le ancore e l’atlante dei glifi. La
convenzione non cambia, quindi la pagina della 5a, se esiste già, carica il modello nuovo senza
modifiche.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui docs/piano/fase-4j.md. Leggi prima l’indice docs/piano.md e
docs/piano/convenzione-3d.md, poi l’«Esito» in fondo a docs/piano/fase-4i.md. Controlla che gli strumenti dell’MCP di Blender siano disponibili in
questa sessione; se non lo sono, fermati e dimmi che cosa manca.
```

**Passi**

1. **Riferimenti.** Le foto della galleria (`enigma-i-milano`, `rotori-e-perno`,
   `rotori-con-anelli`) e la fonte `crypto-museum-enigma-i`. Se le foto non bastano a decidere un
   dettaglio, per esempio su quale lato del rotore stanno i puntali o il cricchetto, scegli, scrivi
   la scelta nell’«Esito» e aggiungi la domanda in «Da verificare» di `docs/stato.md`.
2. **Prima il file, poi l’esecuzione**, come nella 4i: ogni pezzo nuovo è uno script in
   `scripts/blender/`, chiamato da `costruisci.py`.
3. **Pezzi e ancore.** Costruisci i nodi marcati «4j» e le ancore della convenzione; aggiungili a
   `NODI_ATTESI`. Pezzi uguali (puntali, contatti, tasti, lampade) sono copie collegate della stessa
   mesh.
4. **Atlante dei glifi.** Una sola immagine di 512 × 512 pixel al massimo con le 26 lettere e i
   numeri da 01 a 26, generata da uno script in `scripts/blender/`. Il carattere ha licenza OFL (vanno
   bene quelli del sito); annotalo nell’«Esito».
5. **Materiali.** Piani: vernice nera raggrinzita, metallo, bachelite, vetro delle lampade; al
   massimo una normal map piccola. Il colore della lampada accesa non sta nel `.glb`: lo mette la
   pagina dal token `--signal-forward`.
6. **Peso.** Il tetto è 1 MB. Se lo superi, riduci prima le texture e poi i poligoni dei pezzi
   piccoli.
7. **Verifica.** Estendi `scripts/verifica-modello.ts`: tutti i nodi e le ancore della
   convenzione, l’atlante presente e non più grande di 512 × 512, il peso sotto 1 MB.

**Criteri di accettazione**

```bash
pnpm modello && pnpm verifica:modello
```
exit 0, con il peso sotto 1 MB e tutti i nodi e le ancore della convenzione.

```bash
pnpm verify
```

Se la 5a è già fatta, anche `pnpm build && pnpm test:e2e`, senza toccare il codice della pagina.

**Esito.** Da compilare: elenco dei pezzi, peso, numero di poligoni, carattere dell’atlante,
dettagli scelti senza una foto che li confermi.

**Esito (2026-11-05)**

- **Pezzi.** 168 nodi: tutti quelli della convenzione marcati «4j» e le 79 ancore. Per ogni
  rotore, `_nucleo` (tubo con il foro per l'asse), `_contatti_piani` e `_contatti_molla` (26
  cilindretti d'ottone ciascuno), `_cricchetto` (26 denti a sega), `_rotella` (26 denti, alluminio)
  e `_tacca` (vuoto sul fondo della tasca nell'anello). L'anello ha ora 26 facce numerate con le UV
  sull'atlante e la tacca scavata nel bordo di destra, sotto il numero 01. Nuovi anche `leva_tasti`
  (asse, lastra sotto i gambi, bracci e tiranti fino al perno dei nottolini) e `batteria`.
  Ritoccati, senza cambiare nodi: cassa con cornici d'ottone attorno alle lampade, guide, bordo,
  cerniere e fermi; coperchio con bordo ripiegato e targhetta; pannello con le 26 prese; sportello con
  il fermo; riflettore e ruota d'ingresso con i loro contatti; nottolini con la leva puntata sul
  cricchetto (il sinistro e il centrale hanno anche il dito che poggia sull'anello vicino).
- **Numeri.** `pnpm verifica:modello`: 537 KB (il tetto è 1 MB), 168 nodi, 10 636 triangoli nelle
  mesh, 19 440 disegnati (tasti, lampade, anelli, rotelle e contatti sono copie collegate).
  L'atlante pesa circa 37 KB dentro il `.glb`. `pnpm modello` impiega meno di un minuto.
- **Atlante.** `scripts/blender/atlante.py`: 512 × 512 pixel, 8 × 8 celle, A–Z poi 01–26,
  lettere nere su una tessera crema; Blender lo rende con Workbench in `pnpm modello`, senza
  dipendenze nuove. Carattere: Archivo (SIL OFL 1.1, `src/assets/fonts/archivo/`, lo stesso del
  sito). La disposizione delle celle e come la pagina sposta la texture sono nella convenzione.
- **Modifiche alla convenzione** (stesso commit di `NODI_ATTESI` e della verifica):
  - `tastiera` non è più un vuoto ma la piastra dei tasti, con i tasti per figli: così la fase 4
    scopre davvero la meccanica. Il piano delle lampade resta fisso nella cassa.
  - Sezione «Angoli»: contatto *i* e faccia *k* dell'anello da +Z verso +Y; a riposo il 01 guarda in
    alto; la rotazione positiva su X è il passo del rotore.
  - Sezione dell'atlante, dei materiali e delle misure della 4j. Riflettore e ruota d'ingresso
    spostati (−60 e +55 mm) e abbassati (raggio 40 mm), i nottolini spostati in x per stare sotto il
    cricchetto: nessuna fase già fatta dipendeva da queste posizioni.
- **Verifica.** `scripts/verifica-modello.ts` ora porta `FASE_MODELLO = '4j'` e controlla anche i
  padri dei nodi (pezzi del rotore, tacca, tasti), che ci sia una sola immagine, un PNG non
  più grande di 512 × 512, e che `tessera`, `cima_tasto` e `vetro` la usino come colore base.
- **Dettagli scelti senza una foto che li confermi** (anche in «Da verificare» di `docs/stato.md`):
  il lato dei rotori dove stanno cricchetto e puntali (a destra); la posizione della rotella rispetto
  al cricchetto; il dito del nottolino; la batteria (forma e posto).
- **Cose da decidere per le fasi dopo.**
  - **Tacca.** Gli anelli hanno la stessa mesh, quindi la tacca sta sotto il 01 per tutti. Nella
    macchina vera cambia con il tipo di rotore (Q, E, V, J, Z). La 5b deve decidere: far ruotare
    l'anello di quanto serve (ma sposterebbe anche i numeri) o accettare che la tacca visibile non
    corrisponda. Il nodo `_tacca` resta fermo sul fondo della tasca.
  - **Lettere dei tasti e delle lampade.** La mesh è condivisa, quindi la lettera viene dalla
    texture clonata e spostata (convenzione, «Lettere e numeri»): la 5a o la 5b lo scrivono nel
    codice. Nell'anteprima statica sono tutte A, perché l'anteprima è resa da Blender.
- **Per PQuest.**
  - Per guardare i numeri di una texture non serve il viewport: una resa Workbench con
    `shading.color_type = 'TEXTURE'` e una camera vicina mostra le UV com'è, e il viewport in
    `rendered` senza luci esplode in bianco.
  - Il rumore di *dithering* della resa (`render.dither_intensity`) rende un PNG con testo nero su
    fondo piatto sei volte più pesante: va messo a 0.
  - La normale di un'estrusione si risolve con `recalc_face_normals` sui soli poligoni appena
    creati, purché il solido sia chiuso; se il bordo di una faccia ha un vertice in più dell'altra
    (T-junction) la mesh non è chiusa e le normali sbagliano senza dirlo.
  - Per leggere un font .woff2 basta `bpy.data.fonts.load(percorso)`: Blender 5 lo apre senza
    conversione.
