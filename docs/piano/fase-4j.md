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
