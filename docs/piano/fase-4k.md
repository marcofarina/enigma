# Fase 4k — Modello 3D: animazione dello smontaggio

**Modello: Sonnet · Effort: high · Durata: 2 h · Dipende da: 4j; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** Il `.glb` porta la clip `smontaggio`: quattro secondi, un secondo per ciascuna fase
della tabella «Le fasi dello smontaggio», con `fase` in `extras` su ogni nodo che la clip muove. La
5b la fa scorrere con il selettore.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui docs/piano/fase-4k.md. Leggi prima l’indice docs/piano.md e
docs/piano/convenzione-3d.md, poi l’«Esito» in fondo a docs/piano/fase-4j.md. Controlla che gli strumenti dell’MCP di Blender siano disponibili in
questa sessione; se non lo sono, fermati e dimmi che cosa manca.
```

**Passi**

1. **Keyframe** sulla timeline della scena, a 24 fotogrammi al secondo: il fotogramma 0 è la
   macchina chiusa, i fotogrammi 24, 48, 72 e 96 sono la fine delle fasi 1, 2, 3 e 4. Ogni pezzo si
   muove solo durante la sua fase e resta fermo prima e dopo. Lo script sta in `scripts/blender/`
   e lo chiama `costruisci.py`.
2. **Chi muove che cosa.** Rispetta la regola della convenzione: sui nodi che il codice ruota solo
   tracce `translation`, sui nodi che il codice trasla nessuna traccia.
3. **Spostamenti.** A fine fase i pezzi non si sovrappongono e restano allineati all’asse del loro
   gruppo; i pezzi di un rotore si allontanano lungo X.
4. **Esportazione** di tutto come una sola animazione di nome `smontaggio`, con l’opzione
   `export_animation_mode` dell’esportatore glTF (controlla il valore giusto nella versione
   installata).
5. **Anteprime.** `costruisci.py` renderizza un PNG per fase in `scripts/blender/anteprime/`,
   ignorata da git: guardali prima di esportare.
6. **Verifica.** Estendi `scripts/verifica-modello.ts`: l’animazione `smontaggio` esiste e
   finisce a 4 secondi (massimo degli accessor di input dei sampler); i canali rispettano «Chi
   muove che cosa»; ogni nodo con canali ha `fase` intera da 1 a 4, e ogni fase ha almeno un nodo.

**Criteri di accettazione**

```bash
pnpm modello && pnpm verifica:modello
```
exit 0, con la clip `smontaggio` conforme e il peso sotto 1 MB.

```bash
pnpm verify
```

**Esito.** Da compilare: nodi per fase, peso, valore di `export_animation_mode` usato, difficoltà
incontrate con l’esportazione dell’animazione.
