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

**Esito (2026-11-05)**

- **Clip.** Un’animazione sola, `smontaggio`, di 4 s a 24 fotogrammi al secondo, con tracce
  `translation` e basta. Sta in `scripts/blender/smontaggio.py`, che `costruisci.py` chiama subito
  dopo i pezzi; la tabella degli spostamenti è in testa al file.
- **Nodi per fase.** Fase 1: `coperchio_interno` (+150 mm in Z) e `sportello_spine` (+100 mm in Z,
  30 mm in avanti). Fase 2: `asse_rotori`, `riflettore` e i tre rotori salgono di 110 mm nella
  prima metà del secondo, poi si allargano lungo X (riflettore −62 mm, rotore sinistro −40, destro
  +40, centrale fermo). Fase 3: per ogni rotore anello (−17 mm), contatti piani (−18), rotella
  (+15), cricchetto (+13,5) e puntali (+16,5), in x relativa al rotore. Fase 4: `tastiera` (+100 mm
  in Z) e `batteria` (+140 in Z, +50 in X). Tracce in tutto: 2 + 5 + 15 + 2 nodi
  (`pnpm verifica:modello`).
- **Il nucleo non si muove.** I tre `<rotore>_nucleo` portano `fase` 3 ma non hanno tracce: gli altri
  pezzi si aprono attorno a lui. La convenzione ora lo dice.
- **Perché i rotori si allargano nella fase 2.** Con il passo di 30 mm i pezzi di un rotore aperto
  finirebbero dentro il vicino. Il passo diventa di 70 mm; per questo l'asse è passato da 110 a
  210 mm (`rotori.py`), così i rotori restano infilati. Montato, l'asse sta dentro il vano.
- **Esportazione.** `export_animation_mode="SCENE"` con `export_anim_scene_split_object=False`:
  tutti gli oggetti in un'unica animazione, che prende il nome della scena (`smontaggio.py` la
  rinomina). Non ho provato `ACTIVE_ACTIONS` né `ACTIONS`. La scena sta sul fotogramma 0 al momento
  dell’esportazione, quindi i nodi escono con la macchina chiusa. Interpolazione lineare, impostata
  nelle preferenze prima di inserire i fotogrammi chiave.
- **Controlli.** `smontaggio.sovrapposizioni()` confronta le scatole dei pezzi a fotogramma 96 e
  ferma `pnpm modello` se due si toccano o se un pezzo che esce resta sotto il bordo della cassa;
  l’asse è escluso perché attraversa i rotori. `verifica-modello.ts` (ora `FASE_MODELLO = '4k'`)
  controlla: una sola animazione di nome `smontaggio`, durata 4 s, `extras.fase` intero da 1 a 4 su
  ogni nodo con tracce, nessun movimento fuori dal secondo della propria fase (letto dai valori
  nel `.glb`), almeno un nodo per fase.
- **Numeri.** 568 KB (il tetto è 1 MB), 168 nodi, 10 636 triangoli nelle mesh. `pnpm modello`
  impiega circa 12 secondi.
- **Anteprime.** `scripts/blender/anteprime/fase-0.png … fase-4.png` (960 × 540, ignorata da git).
  Ho guardato i fotogrammi 0, 24, 36, 48, 72 e 96 nella vista di Blender e `fase-4.png`; la clip
  non è stata provata in three.js con `AnimationMixer`: è compito della 5b.
- **Per la 5b.**
  - Gli spostamenti viaggiano già convertiti dall’esportatore (Z in alto di Blender diventa Y in
    alto; Y di Blender diventa −Z).
  - Le ancore non seguono lo smontaggio: restano dove sono a macchina chiusa. A macchina smontata
    la pagina non deve agganciarci niente.
  - Nella fase 2 la salita finisce a 1,5 s e l’allargamento a 2 s; il selettore a metà fase mostra
    quindi rotori alzati e ancora vicini.
  - Lo sportello, spostato in avanti, copre la tastiera vista da davanti e in basso: la 5b sceglie
    un’inquadratura più alta.
- **Cose da decidere.** Nessuna nuova. Resta aperta la questione delle tacche (esito della 4j).
