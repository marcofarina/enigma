"""Smussi dei pezzi interni (fase 4m).

Gli spigoli vivi non prendono luce e fanno sembrare di plastica un pezzo di metallo: ogni mesh
interna riceve un Bevel che taglia gli spigoli più netti di ANGOLO, e un Weighted Normal che tiene
piane le facce larghe e morbidi gli smussi. Il risultato si applica alla mesh, prima della cottura
delle texture e dell'esportazione.

Una mesh può avere più utenti (i tre rotori condividono anello, nucleo e contatti): si smussa una
volta sola, sui dati, e si sostituisce a tutti.
"""

import math

import bpy

ANGOLO = math.radians(30)  # sotto questo angolo fra le facce lo spigolo resta com'è (i lati dei cilindri)

# Larghezza dello smusso (metri) e segmenti per mesh. Le mesh che non ci sono (i contatti, grandi
# 1–2 mm, e l'asse, un cilindro a 12 lati) restano senza smusso ma con le normali morbide. I pezzi a
# denti (cricchetto, rotella) e quelli piccoli hanno un segmento solo: due raddoppiano le facce per
# niente, e il .glb ha un tetto di peso.
SMUSSI = {
    "anello": (0.00040, 2),
    "nucleo": (0.00050, 2),
    "cricchetto": (0.00030, 1),
    "rotella": (0.00030, 1),
    "riflettore": (0.00060, 2),
    "ruota_ingresso": (0.00060, 2),
    "nottolino": (0.00030, 1),
    "nottolino_con_dito": (0.00030, 1),
    "leva_tasti": (0.00030, 1),
    "batteria": (0.00100, 2),  # gli spigoli di un mantello di carta piegato sono morbidi
}


def _triangoli(dati):
    dati.calc_loop_triangles()
    return len(dati.loop_triangles)


def smussa(dati, larghezza, segmenti=2):
    """Sostituisce la mesh `dati` con la sua versione smussata, per tutti gli utenti. Ne dà il nome."""
    prova = bpy.data.objects.new(f"smusso_{dati.name}", dati)
    bpy.context.scene.collection.objects.link(prova)
    for poligono in dati.polygons:
        poligono.use_smooth = True
    if larghezza:
        smusso = prova.modifiers.new("smusso", "BEVEL")
        smusso.width = larghezza
        smusso.segments = segmenti
        smusso.limit_method = "ANGLE"
        smusso.angle_limit = ANGOLO
        smusso.profile = 0.5
        smusso.use_clamp_overlap = True
    normali = prova.modifiers.new("normali", "WEIGHTED_NORMAL")
    normali.mode = "FACE_AREA"
    normali.weight = 50
    normali.keep_sharp = False
    bpy.context.view_layer.update()
    valutato = prova.evaluated_get(bpy.context.evaluated_depsgraph_get())
    nuovo = bpy.data.meshes.new_from_object(valutato)
    for poligono in nuovo.polygons:
        poligono.use_smooth = True
    nome = dati.name
    dati.user_remap(nuovo)
    bpy.data.objects.remove(prova)
    bpy.data.meshes.remove(dati)
    nuovo.name = nome
    return nuovo


def smussa_interno(oggetti):
    """Smussa le mesh degli oggetti dati (una volta per mesh). Ne dà il numero di triangoli prima e dopo."""
    prima = dopo = 0
    fatte = {}
    for ogg in oggetti:
        dati = ogg.data
        if dati.name in fatte:
            continue
        prima += _triangoli(dati)
        larghezza, segmenti = SMUSSI.get(dati.name, (0.0, 1))
        nuovo = smussa(dati, larghezza, segmenti)
        fatte[nuovo.name] = nuovo
        dopo += _triangoli(nuovo)
    return prima, dopo
