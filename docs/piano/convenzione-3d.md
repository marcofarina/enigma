# Convenzione del modello 3D

Dal 2026-11-05 il modello è ibrido (D20): l’esterno viene dal modello «Enigma Machine» di ASHISH
(CC BY 4.0), l’interno è nostro. La 4l ha riscritto le sezioni su misure, nodi, ancore, lettere,
materiali e peso; `scripts/blender/esterno.py` è la fonte della scomposizione, con la tabella
`CORRISPONDENZA` dai pezzi di ASHISH ai nodi.

Convenzione fissata il 2026-11-05 nella revisione delle fasi 3D; valgono D14 e D15. La 4i la mette alla prova
e la può correggere; dopo la 4i cambia solo con una modifica di questa sezione e di `NODI_ATTESI`
in `scripts/verifica-modello.ts`, nello stesso commit. `FASE_MODELLO`, nello stesso file, dice fin
dove è arrivato il modello: `pnpm verifica:modello` cerca solo i nodi delle fasi fino a quella. La
4j l’ha portata a `'4j'` (il tetto del peso è passato da 300 KB a 1 MB), la 4k a `'4k'` (la verifica
controlla anche la clip `smontaggio`) e la 4l a `'4l'` (tetto di 6 MB, `coperchio_legno`, texture
WebP).

**Unità e assi.** Un’unità è un metro, con le dimensioni reali della macchina. L’origine sta al
centro del fondo della cassa. glTF ha Y in alto: l’esportatore converte le trasformazioni da
(X, Y, Z) di Blender a (X, Z, −Y) di glTF, ma non tocca i valori di `extras`, quindi in `extras`
vanno solo numeri senza direzione. Il fronte della macchina, il lato della tastiera, guarda verso
+Z in glTF, cioè −Y in Blender. L’asse dei rotori è X, che l’esportatore lascia com’è: girare un
rotore in three.js è una sola proprietà.

**Misure dell’interno.** I pezzi dei rotori stanno impilati lungo X in un passo di 30 mm: vedi
l’intestazione di `scripts/blender/rotori.py`. Le misure di `rotori.py`, `meccanica.py` e `comune.py`
sono quelle della 4j; la 4l sposta poi tutto l’interno di `OFFSET_INTERNO` = (−18,3; +8; −4) mm
(`esterno.py`), perché la fascia numerata del rotore centrale stia sotto la finestrella di mezzo di
ASHISH. Dopo lo spostamento: il rotore centrale in x = −18,3 mm, i rotori sull’asse y = 83 mm,
z = 66 mm; il riflettore in x = −78,3 mm, la ruota d’ingresso in +36,7 mm; i nottolini in x = −36,3,
−6,3 e +23,7 mm, con il perno in comune a y = 20 mm, z = 26 mm; la leva (`leva_tasti`) ha l’origine in
(−18,3; −22; 81) mm e la batteria in (89,7; 83; 6) mm. Il riflettore e la ruota d’ingresso sono alti
meno dei rotori (raggio 40 mm contro 50) per non toccare il coperchio.

Il passo fra le finestrelle di ASHISH è 28,1 mm, quello fra i nostri rotori 30: gli anelli di destra
e di sinistra stanno 2 mm fuori dal centro della loro finestrella. Le rotelle zigrinate stanno a
destra dell’anello, mentre ASHISH ha le coperture delle rotelle a sinistra delle finestrelle. La
leva sta più avanti dei tasti di ASHISH. Sono tutte cose della 4m.

**Misure.** La cassa è larga 280 mm e profonda 340, dalla scheda del Deutsches Technikmuseum
(fonte `technikmuseum-enigma`; la pagina `crypto-museum-enigma-i` non dà misure); a coperchio
chiuso è alta 160 mm. Il modello di ASHISH, importato in Blender, ha il fondo di 350 × 290 mm: la
4l lo scala in modo uniforme di 340 / 350 = 0,9714, quindi la profondità è quella della fonte e la
larghezza diventa 281,7 mm. Prima della scala lo ruota di 90° attorno a Z (in ASHISH il pannello a
spine guarda verso −X) e dopo alza il fondo a z = 0. La cassa senza coperchio di legno, con la
piastra e i fermi, è alta 132 mm. Verificato il 2026-11-05 con `pnpm verifica:modello`.

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
rotori; i nottolini sul perno; tasti e lampade alla base, cioè al centro della loro pianta e alla
quota più bassa della loro geometria; `coperchio_interno` sullo spigolo posteriore, in alto;
`coperchio_legno` sull’asse delle cerniere fra la cassa e il coperchio; `sportello_spine` sul suo
spigolo superiore, perché nel modello di ASHISH lo sportello è aperto e pende davanti alla cassa;
`pannello_spine` al centro della sua scatola; `tastiera` al centro delle file, in cima alla piastra.

**Nodi.** Nomi in minuscolo, con `_`. La colonna «Chi lo muove» dice chi può muovere il nodo e in
quale proprietà; la colonna «Da» dice la fase che lo crea.

| Nodo | Che cos’è | Chi lo muove | Da |
|---|---|---|---|
| `cassa` | la cassa di legno, la piastra delle lampade (la parte davanti al taglio), i fermi, le cerniere del coperchio di legno e il perno dei nottolini | — | 4i |
| `coperchio_legno` | il coperchio di legno, aperto dietro la macchina, con quello che porta dentro e i due bracci che lo reggono | clip, fase 1 | 4l |
| `coperchio_interno` | la parte della piastra dietro le lampade (dal taglio a y = 41,3 mm), con le tre finestrelle, il quadrante e i quattro morsetti | clip, fase 1 | 4i |
| `sportello_spine` | lo sportello davanti al pannello a spine, aperto verso il basso | clip, fase 1 | 4i |
| `pannello_spine` | il pannello a spine con le 26 prese, senza spine né cavi | — | 4i |
| `tastiera` | la piastra a gradini dei tasti, con i 26 tasti per figli | clip, fase 4 | 4i |
| `tasto_a` … `tasto_z` | i 26 tasti, figli di `tastiera`, nell’ordine QWERTZ dell’Enigma I; ognuno ha la sua mesh, con la lettera nella texture | codice, traslazione | 4i |
| `lampada_a` … `lampada_z` | le 26 lampade: il disco con la lettera sotto il foro della piastra; ognuna ha la sua mesh | codice, materiale | 4i |
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
`ancora_presa_<l>`, `ancora_lampada_<l>` e `ancora_batteria`, dove `<l>` va da `a` a `z`. Dalla 4l
le ancore di tasti, prese e lampade le mette `esterno.py` sulla geometria di ASHISH: quella di un
tasto alla sua base, quella di una lampada 2 mm sotto il disco, quella di una presa al centro fra i
due fori, sulla faccia verso chi scrive. `ancora_batteria` resta di `meccanica.py`. I contatti
sulle facce dei rotori, della ruota d’ingresso e del riflettore non hanno ancore: li calcola il
codice su un cerchio, dalla posizione del nodo e da `raggio_contatti`.

**Il pannello a spine.** ASHISH ha 18 spine inserite (nove cavi) e disegna la presa solo dove non
c’è una spina, cioè in 9 posti su 26. La 4l toglie spine e cavi (li disegna la pagina, D15) e copia
una presa di ASHISH negli altri 17 posti. Le file sono 9, 8 e 9, nell’ordine di `FILE_QWERTZ`, a
26,2 mm di passo; la fila di sopra e quella di sotto sono spostate di mezzo passo rispetto a quella di
mezzo.

**`extras`.** Solo due proprietà: `fase`, un intero da 1 a 4 su ogni nodo che la clip muove, e
`raggio_contatti`, in metri, sui tre rotori, sulla ruota d’ingresso e sul riflettore; gli altri
nodi non le hanno (l’abbozzo usa 0,035 m). Le proprietà
personalizzate di Blender finiscono in `extras` solo con l’opzione `export_extras=True`
dell’esportatore.

**Lettere e numeri.** Dalla 4l tasti e lampade hanno le lettere di ASHISH, già dipinte nelle sue
texture: la pagina non deve spostare niente. L’atlante dei glifi della 4j resta per i soli numeri
degli anelli; niente testo convertito in mesh.

**Lampade.** Le lettere delle lampade di ASHISH non stanno sulla piastra: ogni lampada è un disco con
la lettera, sotto il suo foro della piastra (`part.010`, 26 dischi e 26 lettere). La 4l fa di
ogni disco con la sua lettera un nodo `lampada_<l>`, con il materiale `vetro`, copia di quello
della meccanica di ASHISH (stesse texture). La pagina clona `vetro` per ogni lampada e, quando la
accende, usa la texture anche come mappa emissiva: si accende la lettera bianca, il disco scuro
resta scuro. Scelta della 4l, al posto del disco di vetro sopra la lettera: non aggiunge geometria e
la lettera è già dove deve stare.

L’atlante è un PNG di 512 × 512 pixel incorporato nel `.glb`, nero su una tessera crema, in Archivo
(SIL OFL 1.1). Ha 8 colonne di celle da 64 pixel, numerate per righe dall’alto a sinistra: le celle
da 0 a 25 portano le lettere da A a Z, quelle da 26 a 51 i numeri da 01 a 26. In coordinate glTF
(origine in alto a sinistra) la cella (colonna, riga) comincia in (colonna / 8, riga / 8).

- **Anelli.** Il numero *k* è già sulla faccia *k* dell’anello (cella 25 + *k*): nessun lavoro per la
  pagina. La tessera è il materiale `tessera`.
- **Tasti e lampade.** Fino alla 4k erano copie collegate di una sola mesh, con la lettera presa
  dall’atlante spostando `offset`; dalla 4l hanno le lettere di ASHISH (vedi sopra).

**Materiali.** L’esterno ha i materiali di ASHISH, con colore, metallicità e ruvidità, normal map e
occlusione (il canale rosso della texture di metallicità e ruvidità): `low_box.001` per il legno e
la ferramenta della cassa e del coperchio, `low_mec.002` per piastra, tastiera, pannello e
coperchio interno, `glass` per i vetri delle finestrelle, `vetro` per le lampade. `w1_low_box`
diventa `low_box.001` e `glass` perde la sua texture: pochi pezzi, 600 KB di texture ciascuno.
L’interno ha i materiali piani della 4j: `vernice`, `metallo`, `metallo_scuro`, `ottone`,
`bachelite`, `batteria` e `tessera`, con l’atlante. Il perno dei nottolini, nella cassa, è
`ottone`.

**Peso** (D23). Le texture di ASHISH (4096 px) si riducono a 2048 px in Blender e si esportano in
WebP, qualità 85, con l’estensione `EXT_texture_webp`; l’atlante dei numeri resta di 512 px, anche
lui in WebP. `pnpm modello` esporta da Blender un `.glb` grezzo in `scripts/blender/sorgenti/` e
`scripts/comprimi-modello.ts` lo comprime con meshopt (`EXT_meshopt_compression`, metodo FILTER) in
`public/modelli/enigma-i.glb`. Il metodo QUANTIZE di gltf-transform non va bene: compensa la scala
delle posizioni cambiando traslazione e scala dei nodi, e allora gli anelli non girerebbero più
attorno alla loro origine. Il filtro di meshopt arrotonda le traslazioni della clip fino a 0,05 mm:
la verifica le confronta con una tolleranza di 0,1 mm. Il tetto è 6 MB; il 2026-11-05 il file pesa
5479 KB, di cui circa 3,9 MB di texture, con 113 723 triangoli.

**Chi muove che cosa.** Il codice della pagina muove solo i nodi della tabella marcati «codice», e
solo nella proprietà indicata. La clip `smontaggio` (4k) muove solo i nodi marcati «clip»: su un nodo
che il codice ruota può avere solo tracce `translation`, e sui nodi che il codice trasla non ha
tracce. Così `AnimationMixer` e il codice non si sovrascrivono a vicenda. La regola la controlla
`scripts/verifica-modello.ts`.

**Le fasi dello smontaggio.**

| Fase | Che cosa succede | Testo del selettore (`aria-valuetext`) |
|---|---|---|
| 1 | si alzano `coperchio_interno` e `sportello_spine`, e `coperchio_legno` si allontana all’indietro | «macchina aperta» |
| 2 | escono i rotori con `asse_rotori`, e il `riflettore` | «rotori estratti» |
| 3 | ogni rotore si apre lungo X: anello, cricchetto, rotella e contatti si staccano dal nucleo | «rotori aperti» |
| 4 | si alza la `tastiera` ed esce la `batteria` | «meccanica sotto i tasti» |

Al valore 0 il selettore dice «macchina chiusa».

**La clip `smontaggio`** (4k). Un’animazione sola di 4 s, un secondo per fase, con tracce
`translation` e basta; la macchina chiusa è al secondo 0. Ogni nodo si muove solo nel secondo della
sua fase e resta fermo prima e dopo. Nella fase 2 i rotori salgono fino a 1,5 s e si allargano lungo X
fino a 2 s: il passo fra i rotori diventa di 70 mm (e l’asse è lungo 210 mm, per tenerli infilati). Gli
spostamenti sono in `scripts/blender/smontaggio.py`. Le ancore non seguono lo smontaggio. La 4l ha
alzato la salita dei rotori a 135 mm e quella del coperchio interno a 190 mm, perché la cassa di
ASHISH è più alta, e allontana il coperchio di legno di 150 mm all’indietro; il resto dello
smontaggio sull’esterno nuovo lo rivede la 4n.
