# Convenzione del modello 3D

Convenzione fissata il 2026-11-05 nella revisione delle fasi 3D; valgono D14 e D15. La 4i la mette alla prova
e la può correggere; dopo la 4i cambia solo con una modifica di questa sezione e di `NODI_ATTESI`
in `scripts/verifica-modello.ts`, nello stesso commit.

**Unità e assi.** Un’unità è un metro, con le dimensioni reali della macchina. L’origine sta al
centro del fondo della cassa. glTF ha Y in alto: l’esportatore converte le trasformazioni da
(X, Y, Z) di Blender a (X, Z, −Y) di glTF, ma non tocca i valori di `extras`, quindi in `extras`
vanno solo numeri senza direzione. Il fronte della macchina, il lato della tastiera, guarda verso
+Z in glTF, cioè −Y in Blender. L’asse dei rotori è X, che l’esportatore lascia com’è: girare un
rotore in three.js è una sola proprietà.

**Nodi.** Nomi in minuscolo, con `_`. La colonna «Chi lo muove» dice chi può muovere il nodo e in
quale proprietà; la colonna «Da» dice la fase che lo crea.

| Nodo | Che cos’è | Chi lo muove | Da |
|---|---|---|---|
| `cassa` | la cassa con il vano dei rotori | — | 4i |
| `coperchio_interno` | il coperchio metallico con le tre finestrelle | clip, fase 1 | 4i |
| `sportello_spine` | lo sportello davanti al pannello a spine | clip, fase 1 | 4i |
| `pannello_spine` | il pannello a spine | — | 4i |
| `tastiera` | il gruppo dei tasti | clip, fase 4 | 4i |
| `tasto_a` … `tasto_z` | i 26 tasti, figli di `tastiera`, nell’ordine QWERTZ dell’Enigma I | codice, traslazione | 4i |
| `lampada_a` … `lampada_z` | le 26 lampade con il vetro e la lettera | codice, materiale | 4i |
| `ruota_ingresso` | la ruota d’ingresso, a destra dei rotori | — | 4i |
| `riflettore` | il riflettore, a sinistra dei rotori | clip, fase 2 | 4i |
| `asse_rotori` | l’asse su cui stanno i rotori | clip, fase 2 | 4i |
| `rotore_destro`, `rotore_centrale`, `rotore_sinistro` | i rotori, gruppi con l’origine sull’asse | codice, rotazione su X (posizione); clip, traslazione, fase 2 | 4i |
| `<rotore>_anello` | l’anello con i numeri da 01 a 26 e la tacca | codice, rotazione su X (Ringstellung); clip, traslazione, fase 3 | 4i |
| `<rotore>_nucleo` | il corpo del rotore; il cablaggio interno non si modella | clip, fase 3 | 4j |
| `<rotore>_contatti_molla`, `<rotore>_contatti_piani` | i 26 puntali a molla di un lato e i 26 contatti piani dell’altro | clip, fase 3 | 4j |
| `<rotore>_cricchetto` | la ruota a 26 denti su cui spinge il nottolino | clip, fase 3 | 4j |
| `<rotore>_rotella` | la rotella zigrinata con cui si gira il rotore a mano | clip, fase 3 | 4j |
| `<rotore>_tacca` | nodo vuoto sulla tacca dell’anello, per evidenziarla; non si stacca, perché la tacca è un intaglio dell’anello | — | 4j |
| `nottolino_destro`, `nottolino_centrale`, `nottolino_sinistro` | i tre nottolini, chiamati con il rotore che spingono, con l’origine sul perno | codice, rotazione | 4i |
| `leva_tasti` | la barra comune sotto i tasti che muove i nottolini | codice, rotazione | 4j |
| `batteria` | la batteria da 4,5 volt, nel vano accanto ai rotori (lezione 3) | clip, fase 4 | 4j |

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
`raggio_contatti`, in metri, sui tre rotori, sulla ruota d’ingresso e sul riflettore. Le proprietà
personalizzate di Blender finiscono in `extras` solo con l’opzione `export_extras=True`
dell’esportatore.

**Lettere e numeri.** Un solo atlante di glifi per le lettere dei tasti e delle lampade e per i
numeri degli anelli, creato nella 4j; niente testo convertito in mesh.

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
