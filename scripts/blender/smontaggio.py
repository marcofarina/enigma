"""La clip `smontaggio`: quattro secondi, un secondo per ciascuna fase (convenzione, «Le fasi dello
smontaggio»).

A 24 fotogrammi al secondo il fotogramma 0 è la macchina chiusa e i fotogrammi 24, 48, 72 e 96 sono la
fine delle fasi 1, 2, 3 e 4. Ogni pezzo si muove solo durante la sua fase e resta fermo prima e dopo.

Le tracce sono solo `location` (in glTF `translation`): sui nodi che il codice della pagina ruota
(rotori, anelli) la clip non può avere altro, e i nodi che il codice trasla non ne hanno (convenzione,
«Chi muove che cosa»). Le posizioni dei figli sono quelle locali, relative al padre.

Il disegno dello smontaggio, in metri e con gli assi di Blender (Z in alto, −Y verso chi scrive):

    fase 1  il coperchio sale di 190 mm, più in alto dei rotori che usciranno; lo sportello sale di
            100 mm e viene in avanti di 30; il coperchio di legno, aperto dietro la macchina, si
            allontana di 150 mm all'indietro (D22; la 4n rivede tutto lo smontaggio sull'esterno di
            ASHISH)
    fase 2  prima i rotori, l'asse e il riflettore salgono di 135 mm, fuori dalla cassa (primo mezzo
            secondo); poi si allargano lungo X, sempre sul loro asse, per fare posto alla fase 3: il
            riflettore di 62 mm a sinistra, il rotore sinistro di 40 a sinistra e il destro di 40 a destra
    fase 3  ogni rotore si apre lungo X attorno al nucleo, che resta fermo: a sinistra i contatti piani e
            l'anello, a destra la rotella, il cricchetto e i puntali
    fase 4  la tastiera sale di 100 mm e scopre la leva; la batteria esce, in alto e verso destra

Il nucleo porta `fase` 3 (è un nodo della fase) ma non ha tracce: è il pezzo attorno a cui gli altri si
aprono.
"""

import bpy
from mathutils import Vector

FPS = 24
FOTOGRAMMI_FASE = 24
FINE = 4 * FOTOGRAMMI_FASE
ROTORI = ("rotore_sinistro", "rotore_centrale", "rotore_destro")

# Per ogni nodo mosso dalla clip: la fase e la tappa finale (spostamento rispetto a riposo). Chi ha una
# tappa intermedia la mette in INTERMEDIE: (fotogramma, spostamento).
FASI = {
    "coperchio_interno": 1,
    "sportello_spine": 1,
    "coperchio_legno": 1,
    "asse_rotori": 2,
    "riflettore": 2,
    **{rotore: 2 for rotore in ROTORI},
    "tastiera": 4,
    "batteria": 4,
}
SPOSTAMENTI = {
    "coperchio_interno": (0.0, 0.0, 0.190),
    "sportello_spine": (0.0, -0.030, 0.100),
    "coperchio_legno": (0.0, 0.150, 0.0),
    "asse_rotori": (0.0, 0.0, 0.135),
    "riflettore": (-0.062, 0.0, 0.135),
    "rotore_sinistro": (-0.040, 0.0, 0.135),
    "rotore_centrale": (0.0, 0.0, 0.135),
    "rotore_destro": (0.040, 0.0, 0.135),
    "tastiera": (0.0, 0.0, 0.100),
    "batteria": (0.050, 0.0, 0.140),
}
SALITA_ROTORI = (0.0, 0.0, 0.135)  # a metà della fase 2: solo la salita, senza l'allargamento
INTERMEDIE = {nome: [(FOTOGRAMMI_FASE + FOTOGRAMMI_FASE // 2, (0.0, 0.0, SPOSTAMENTI[nome][2]))] for nome in SPOSTAMENTI if FASI[nome] == 2}

# La fase 3: lo spostamento lungo X di ogni pezzo del rotore rispetto al rotore (posizione locale). Il
# nucleo resta dov'è.
APERTURA = {
    "contatti_piani": -0.0180,
    "anello": -0.0170,
    "rotella": 0.0150,
    "cricchetto": 0.0135,
    "contatti_molla": 0.0165,
}
FERMI_DI_FASE = tuple(f"{rotore}_nucleo" for rotore in ROTORI)
for rotore in ROTORI:
    for pezzo, dx in APERTURA.items():
        FASI[f"{rotore}_{pezzo}"] = 3
        SPOSTAMENTI[f"{rotore}_{pezzo}"] = (dx, 0.0, 0.0)
for nome in FERMI_DI_FASE:
    FASI[nome] = 3

# Dopo lo smontaggio i pezzi mossi non devono sovrapporsi fra loro né ai pezzi che restano.
FISSI = ("ruota_ingresso", "pannello_spine", "leva_tasti", "nottolino_destro", "nottolino_centrale", "nottolino_sinistro")
MARGINE = 0.0005


def _tappe(nome):
    """I fotogrammi chiave di un nodo e la tappa di ciascuno, come spostamento rispetto a riposo."""
    inizio = (FASI[nome] - 1) * FOTOGRAMMI_FASE
    fine = FASI[nome] * FOTOGRAMMI_FASE
    zero = (0.0, 0.0, 0.0)
    tappe = [(0, zero), (inizio, zero), *INTERMEDIE.get(nome, []), (fine, SPOSTAMENTI[nome]), (FINE, SPOSTAMENTI[nome])]
    visti = {}
    for fotogramma, spostamento in tappe:  # in testa e in coda i fotogrammi possono coincidere
        visti[fotogramma] = spostamento
    return sorted(visti.items())


def costruisci():
    """Mette le tracce sulla scena e la lascia sul fotogramma 0, con la macchina chiusa."""
    scena = bpy.context.scene
    scena.render.fps, scena.render.fps_base = FPS, 1.0
    scena.frame_start, scena.frame_end = 0, FINE
    scena.name = "smontaggio"  # l'esportatore dà questo nome all'animazione unica
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"

    con_fase = {o.name for o in bpy.data.objects if "fase" in o}
    assegnati = set(FASI)
    if con_fase != assegnati:
        raise RuntimeError(
            f"i nodi con `fase` e quelli della clip non coincidono: solo nella scena {sorted(con_fase - assegnati)}, "
            f"solo nella clip {sorted(assegnati - con_fase)}"
        )
    for nome, fase in FASI.items():
        if bpy.data.objects[nome]["fase"] != fase:
            raise RuntimeError(f"{nome}: `fase` è {bpy.data.objects[nome]['fase']}, la clip dice {fase}")

    for nome in FASI:
        if nome in FERMI_DI_FASE:
            continue
        ogg = bpy.data.objects[nome]
        riposo = ogg.location.copy()
        for fotogramma, spostamento in _tappe(nome):
            ogg.location = riposo + Vector(spostamento)
            ogg.keyframe_insert("location", frame=fotogramma)
        ogg.location = riposo
    scena.frame_set(0)


def _scatola(ogg):
    punti = [ogg.matrix_world @ Vector(angolo) for angolo in ogg.bound_box]
    return [min(p[i] for p in punti) for i in range(3)], [max(p[i] for p in punti) for i in range(3)]


def sovrapposizioni():
    """I pezzi che alla fine dello smontaggio si sovrappongono, come coppie di nomi.

    Il confronto è fra le scatole che racchiudono i pezzi, con un margine: a macchina smontata ogni
    pezzo ha il suo posto e le scatole non si toccano (l'asse dei rotori è escluso: attraversa i pezzi
    infilati su di lui). Tasti e lampade non contano (i tasti seguono la
    tastiera), e la cassa è confrontata solo per l'altezza: i pezzi che escono devono stare sopra il suo
    bordo (tranne la tastiera, che sta sul piano, lo sportello, che sta fuori davanti, e il coperchio di
    legno, che sta fuori dietro).
    """
    scena = bpy.context.scene
    scena.frame_set(FINE)
    try:
        mossi = [bpy.data.objects[n] for n in FASI if bpy.data.objects[n].type == "MESH"]
        fissi = [bpy.data.objects[n] for n in FISSI]
        fissi += [o for o in bpy.data.objects if o.name.startswith("lampada_")]
        problemi = []
        scatole = {o.name: _scatola(o) for o in mossi + fissi}

        def si_toccano(a, b):
            (amin, amax), (bmin, bmax) = scatole[a.name], scatole[b.name]
            return all(amin[i] < bmax[i] - MARGINE and bmin[i] < amax[i] - MARGINE for i in range(3))

        for i, a in enumerate(mossi):
            for b in mossi[i + 1 :] + fissi:
                if "asse_rotori" in (a.name, b.name):
                    continue  # l'asse attraversa i pezzi dei rotori: è fatto apposta
                if si_toccano(a, b):
                    problemi.append((a.name, b.name))
        bordo = _scatola(bpy.data.objects["cassa"])[1][2]
        for ogg in mossi:
            if ogg.name not in ("tastiera", "sportello_spine", "coperchio_legno") and scatole[ogg.name][0][2] < bordo - MARGINE:
                problemi.append((ogg.name, "cassa"))
        return problemi
    finally:
        scena.frame_set(0)
