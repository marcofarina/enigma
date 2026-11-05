# Convenzione del modello 3D

Dal 2026-11-05 il modello è ibrido (D20): la 4l riscrive le sezioni su misure, nodi, materiali,
lettere e peso per l’esterno di ASHISH. Finché la 4l non è chiusa, vale il testo qui sotto.

Convenzione fissata il 2026-11-05 nella revisione delle fasi 3D; valgono D14 e D15. La 4i la mette alla prova
e la può correggere; dopo la 4i cambia solo con una modifica di questa sezione e di `NODI_ATTESI`
in `scripts/verifica-modello.ts`, nello stesso commit. `FASE_MODELLO`, nello stesso file, dice fin
dove è arrivato il modello: `pnpm verifica:modello` cerca solo i nodi delle fasi fino a quella. La
4j l’ha portata a `'4j'` (il tetto del peso è passato da 300 KB a 1 MB) e la 4k a `'4k'` (la verifica
controlla anche la clip `smontaggio`).

**Unità e assi.** Un’unità è un metro, con le dimensioni reali della macchina. L’origine sta al
centro del fondo della cassa. glTF ha Y in alto: l’esportatore converte le trasformazioni da
(X, Y, Z) di Blender a (X, Z, −Y) di glTF, ma non tocca i valori di `extras`, quindi in `extras`
vanno solo numeri senza direzione. Il fronte della macchina, il lato della tastiera, guarda verso
+Z in glTF, cioè −Y in Blender. L’asse dei rotori è X, che l’esportatore lascia com’è: girare un
rotore in three.js è una sola proprietà.

**Misure della 4j.** I pezzi dei rotori stanno impilati lungo X in un passo di 30 mm: vedi l’intestazione
di `scripts/blender/rotori.py`. Il riflettore sta in x = −60 mm, la ruota d’ingresso in +55 mm, i nottolini
in x = −18, +12 e +42 mm (a destra del rotore che spingono, sotto il cricchetto), con il perno in comune a
y = 12 mm, z = 30 mm; la leva (`leva_tasti`) ha l’origine in (0, −30, 85) mm e la batteria in
(108, 75, 10) mm. Il vano dei rotori ha il riflettore e la ruota d’ingresso alti meno dei rotori
(raggio 40 mm contro 50) per non toccare il coperchio.

**Misure.** La cassa è larga 280 mm e profonda 340, dalla scheda del Deutsches Technikmuseum
(fonte `technikmuseum-enigma`; la pagina `crypto-museum-enigma-i` non dà misure). La scheda dà
160 mm di altezza a coperchio chiuso; il coperchio di legno non è un nodo, e l’altezza della cassa
senza coperchio, 115 mm, è una stima della 4i. Le altre misure dell’abbozzo stanno in
`scripts/blender/comune.py` e la 4j le può cambiare.

**Angoli.** Il contatto *i* di un rotore, della ruota d’ingresso o del riflettore (la lettera *i*,
con A = 0) sta all’angolo *i* · 360° / 26 attorno all’asse X, misurato da +Z verso +Y, cioè verso
il retro, sul cerchio di raggio `raggio_contatti`. La faccia *k* dell’anello, il numero *k*, sta
all’angolo (*k* − 1) · 360° / 26, dalla stessa origine: a riposo il numero 01 guarda in alto e
l’anello è alla posizione A. La rotazione su X in verso positivo porta in alto il numero
successivo, ed è il passo del rotore; a +360° / 26 in finestra c’è il 02. Il codice trova così
posizione e anello con la sola rotazione dei nodi. Fissata nella 4j sulle foto della galleria.

**Gerarchia e origini.** I nodi sono figli della radice della scena, tranne i tasti, figli di
`tastiera`, e i pezzi di un rotore (`<rotore>_anello`, `_nucleo`, `_contatti_molla`,
`_contatti_piani`, `_cricchetto`, `_rotella`), figli del rotore; `<rotore>_tacca` è figlio
dell’anello, perché gira con lui. Un nodo che il codice muove ha, a riposo, rotazione e scala
nulle. Le origini: i rotori, gli anelli, la ruota d’ingresso, il riflettore e l’asse sull’asse dei
rotori; i nottolini sul perno; tasti e lampade alla base, sul piano; `coperchio_interno` e
`sportello_spine` sulla cerniera (lo spigolo posteriore del coperchio, quello inferiore dello
sportello).

**Nodi.** Nomi in minuscolo, con `_`. La colonna «Chi lo muove» dice chi può muovere il nodo e in
quale proprietà; la colonna «Da» dice la fase che lo crea.

| Nodo | Che cos’è | Chi lo muove | Da |
|---|---|---|---|
| `cassa` | la cassa con il vano dei rotori | — | 4i |
| `coperchio_interno` | il coperchio metallico con le tre finestrelle | clip, fase 1 | 4i |
| `sportello_spine` | lo sportello davanti al pannello a spine | clip, fase 1 | 4i |
| `pannello_spine` | il pannello a spine | — | 4i |
| `tastiera` | la piastra dei tasti, con i 26 tasti per figli (dalla 4j ha una mesh: copre l’apertura sopra la leva) | clip, fase 4 | 4i |
| `tasto_a` … `tasto_z` | i 26 tasti, figli di `tastiera`, nell’ordine QWERTZ dell’Enigma I | codice, traslazione | 4i |
| `lampada_a` … `lampada_z` | le 26 lampade con il vetro e la lettera | codice, materiale | 4i |
| `ruota_ingresso` | la ruota d’ingresso, a destra dei rotori | — | 4i |
| `riflettore` | il riflettore, a sinistra dei rotori | clip, fase 2 | 4i |
| `asse_rotori` | l’asse su cui stanno i rotori | clip, fase 2 | 4i |
| `rotore_destro`, `rotore_centrale`, `rotore_sinistro` | i rotori, gruppi con l’origine sull’asse | codice, rotazione su X (posizione); clip, traslazione, fase 2 | 4i |
| `<rotore>_anello` | l’anello con i numeri da 01 a 26 e la tacca | codice, rotazione su X (Ringstellung); clip, traslazione, fase 3 | 4i |
| `<rotore>_nucleo` | il corpo del rotore; il cablaggio interno non si modella | clip, fase 3: porta `fase` ma resta fermo, gli altri pezzi si aprono attorno a lui | 4j |
| `<rotore>_contatti_molla`, `<rotore>_contatti_piani` | i 26 puntali a molla di un lato e i 26 contatti piani dell’altro | clip, fase 3 | 4j |
| `<rotore>_cricchetto` | la ruota a 26 denti su cui spinge il nottolino | clip, fase 3 | 4j |
| `<rotore>_rotella` | la rotella zigrinata con cui si gira il rotore a mano | clip, fase 3 | 4j |
| `<rotore>_tacca` | nodo vuoto sulla tacca dell’anello, per evidenziarla; non si stacca, perché la tacca è un intaglio dell’anello | — | 4j |
| `nottolino_destro`, `nottolino_centrale`, `nottolino_sinistro` | i tre nottolini, chiamati con il rotore che spingono, con l’origine sul perno | codice, rotazione | 4i |
| `leva_tasti` | la barra comune sotto i tasti che muove i nottolini | codice, rotazione | 4j |
| `batteria` | la batteria da 4,5 volt, nel vano accanto ai rotori (lezione 3) | clip, fase 4 | 4j |

**Tacca.** I tre anelli hanno la stessa mesh, con la tacca nel bordo di destra sotto il numero 01, e
`<rotore>_tacca` sta sul fondo della tasca. Nella macchina vera la tacca cambia posto con il tipo di
rotore (Q, E, V, J, Z): il modello non lo sa. La 5b ha deciso di accettare la discrepanza: la tacca
visibile sta sempre sotto il 01, e se un nottolino è in presa lo dice il motore (`engagedPawls`).

`<rotore>` sta per `rotore_destro`, `rotore_centrale` o `rotore_sinistro`. Il `nottolino_centrale`
appoggia sull’anello del rotore destro; il `nottolino_sinistro` appoggia sull’anello del centrale,
ed è lui a fare il doppio passo: infilato nella tacca, spinge insieme il rotore centrale e quello di
sinistra (lezione 5).

**Ancore.** Nodi vuoti con il prefisso `ancora_`, creati nella 4j, per il percorso della corrente
(5d) e per i cavi del pannello (5b): `ancora_tasto_<l>` (il contatto sotto il tasto),
`ancora_presa_<l>`, `ancora_lampada_<l>` e `ancora_batteria`, dove `<l>` va da `a` a `z`. I contatti
sulle facce dei rotori, della ruota d’ingresso e del riflettore non hanno ancore: li calcola il
codice su un cerchio, dalla posizione del nodo e da `raggio_contatti`.

**`extras`.** Solo due proprietà: `fase`, un intero da 1 a 4 su ogni nodo che la clip muove, e
`raggio_contatti`, in metri, sui tre rotori, sulla ruota d’ingresso e sul riflettore; gli altri
nodi non le hanno (l’abbozzo usa 0,035 m). Le proprietà
personalizzate di Blender finiscono in `extras` solo con l’opzione `export_extras=True`
dell’esportatore.

**Lettere e numeri.** Un solo atlante di glifi per le lettere dei tasti e delle lampade e per i
numeri degli anelli, creato nella 4j; niente testo convertito in mesh.

L’atlante è un PNG di 512 × 512 pixel incorporato nel `.glb`, nero su una tessera crema, in Archivo
(SIL OFL 1.1). Ha 8 colonne di celle da 64 pixel, numerate per righe dall’alto a sinistra: le celle
da 0 a 25 portano le lettere da A a Z, quelle da 26 a 51 i numeri da 01 a 26. In coordinate glTF
(origine in alto a sinistra) la cella (colonna, riga) comincia in (colonna / 8, riga / 8).

- **Anelli.** Il numero *k* è già sulla faccia *k* dell’anello (cella 25 + *k*): nessun lavoro per la
  pagina. La tessera è il materiale `tessera`.
- **Tasti e lampade.** Sono copie collegate di una sola mesh, quindi tutte puntano alla cella 0, la A.
  Per mostrare la lettera giusta la pagina clona il materiale e la sua texture (l’immagine resta
  una) e sposta `offset` di (colonna / 8, riga / 8) della lettera: per il tasto il materiale è
  `cima_tasto` (la mesh `tasto` ha tre materiali: gambo, bordo, cima), per la lampada `vetro`.
  Il colore della lampada accesa lo mette la pagina, come emissivo.

**Materiali.** Piani: `legno`, `vernice`, `metallo`, `metallo_scuro`, `ottone`, `bachelite`,
`batteria`, più i tre con l’atlante (`tessera`, `cima_tasto`, `vetro`). Nessuna normal map.

**Chi muove che cosa.** Il codice della pagina muove solo i nodi della tabella marcati «codice», e
solo nella proprietà indicata. La clip `smontaggio` (4k) muove solo i nodi marcati «clip»: su un nodo
che il codice ruota può avere solo tracce `translation`, e sui nodi che il codice trasla non ha
tracce. Così `AnimationMixer` e il codice non si sovrascrivono a vicenda. La regola la controlla
`scripts/verifica-modello.ts`.

**Le fasi dello smontaggio.**

| Fase | Che cosa succede | Testo del selettore (`aria-valuetext`) |
|---|---|---|
| 1 | si alzano `coperchio_interno` e `sportello_spine` | «macchina aperta» |
| 2 | escono i rotori con `asse_rotori`, e il `riflettore` | «rotori estratti» |
| 3 | ogni rotore si apre lungo X: anello, cricchetto, rotella e contatti si staccano dal nucleo | «rotori aperti» |
| 4 | si alza la `tastiera` ed esce la `batteria` | «meccanica sotto i tasti» |

Al valore 0 il selettore dice «macchina chiusa».

**La clip `smontaggio`** (4k). Un’animazione sola di 4 s, un secondo per fase, con tracce
`translation` e basta; la macchina chiusa è al secondo 0. Ogni nodo si muove solo nel secondo della
sua fase e resta fermo prima e dopo. Nella fase 2 i rotori salgono fino a 1,5 s e si allargano lungo X
fino a 2 s: il passo fra i rotori diventa di 70 mm (e l’asse è lungo 210 mm, per tenerli infilati). Gli
spostamenti sono in `scripts/blender/smontaggio.py`. Le ancore non seguono lo smontaggio.
