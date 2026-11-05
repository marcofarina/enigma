"""Misure, materiali e mattoni geometrici comuni ai pezzi del modello dell'Enigma I.

Unità: un metro. Assi di Blender: X verso destra, Y verso il retro, Z in alto; il fronte della
macchina, il lato della tastiera, guarda verso -Y. L'origine sta al centro del fondo della cassa
(vedi docs/piano/convenzione-3d.md).

Tutti gli oggetti hanno rotazione e scala nulle: la geometria si scrive già orientata nella mesh,
così l'asse X di un rotore resta l'asse X del suo nodo anche dopo l'esportazione.
"""

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

# --- Misure -------------------------------------------------------------------------------------
# Dalla 4l la cassa e il resto dell'esterno vengono dal modello di ASHISH (esterno.py), che li
# porta a 340 mm di profondità e 281,7 di larghezza (fonte «technikmuseum-enigma»: 340 × 280 mm).
# Le misure che restano qui sono quelle dell'interno della 4j, prima dello spostamento
# esterno.OFFSET_INTERNO che lo mette sotto le finestrelle di ASHISH.
SPESSORE = 0.010  # il fondo della cassa della 4j: la batteria ci appoggia sopra

Y_ASSE = 0.075  # asse dei rotori
Z_ASSE = 0.070
RAGGIO_ROTORE = 0.050
RAGGIO_CONTATTI = 0.035  # cerchio dei 26 contatti sulle facce di rotori, ruota d'ingresso e riflettore
PASSO_ANGOLO = 2 * math.pi / 26  # un contatto, una faccia dell'anello

# Il perno su cui girano i tre nottolini: lo regge la cassa, i nottolini ci stanno sopra.
Y_PERNO = 0.012
Z_PERNO = 0.030

# Le tre file della tastiera, delle lampade e del pannello a spine dell'Enigma I, dalla più lontana
# alla più vicina a chi scrive (sul pannello, dall'alto in basso).
FILE_QWERTZ = ("QWERTZUIO", "ASDFGHJK", "PYXCVBNML")

# --- Atlante dei glifi --------------------------------------------------------------------------
# Un'immagine di ATLANTE_LATO pixel con ATLANTE_COLONNE colonne di celle quadrate. Le celle da 0 a
# 25 hanno le lettere da A a Z, quelle da 26 a 51 i numeri da 01 a 26 degli anelli. Si conta per
# righe, dall'alto a sinistra. Dalla 4l lo usano solo gli anelli dei rotori: tasti e lampade hanno
# le lettere di ASHISH.
ATLANTE_LATO = 512
ATLANTE_COLONNE = 8
CELLA_NUMERO = 26


def centro_cella(indice):
    """Il centro della cella indice nelle coordinate UV di Blender (v dal basso) e il suo lato."""
    lato = 1.0 / ATLANTE_COLONNE
    colonna, riga = indice % ATLANTE_COLONNE, indice // ATLANTE_COLONNE
    return ((colonna + 0.5) * lato, 1.0 - (riga + 0.5) * lato, lato)


# --- Scena --------------------------------------------------------------------------------------
def svuota():
    """Toglie dalla scena e dal file tutto ciò che una ricostruzione precedente può aver lasciato."""
    for raccolta in (
        bpy.data.objects,
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.actions,
        bpy.data.collections,
        bpy.data.curves,
        bpy.data.fonts,
    ):
        for blocco in list(raccolta):
            raccolta.remove(blocco)
    for immagine in list(bpy.data.images):  # l'atlante e le texture di ASHISH
        bpy.data.images.remove(immagine)


def materiale(nome, colore, metallico=0.0, ruvidita=0.5):
    """Un materiale piano: solo colore base, metallicità e ruvidità del Principled BSDF."""
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*colore, 1.0)
    bsdf.inputs["Metallic"].default_value = metallico
    bsdf.inputs["Roughness"].default_value = ruvidita
    mat.diffuse_color = (*colore, 1.0)
    return mat


def materiale_con_atlante(nome, immagine, ruvidita=0.35):
    """Un materiale il cui colore base è l'atlante dei glifi: tessera crema con il numero in nero."""
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = immagine
    mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = ruvidita
    mat.diffuse_color = (0.9, 0.86, 0.72, 1.0)
    return mat


def materiali(atlante):
    """I materiali del modello, per nome. atlante è l'immagine dei glifi."""
    return {
        "vernice": materiale("vernice", (0.02, 0.02, 0.02), ruvidita=0.8),
        "metallo": materiale("metallo", (0.62, 0.62, 0.64), metallico=1.0, ruvidita=0.35),
        "metallo_scuro": materiale("metallo_scuro", (0.10, 0.10, 0.11), metallico=0.7, ruvidita=0.5),
        "ottone": materiale("ottone", (0.71, 0.55, 0.22), metallico=1.0, ruvidita=0.3),
        "bachelite": materiale("bachelite", (0.03, 0.03, 0.03), ruvidita=0.4),
        "batteria": materiale("batteria", (0.55, 0.50, 0.38), ruvidita=0.7),
        # La tessera con i numeri degli anelli. Tasti e lampade hanno i materiali di ASHISH.
        "tessera": materiale_con_atlante("tessera", atlante),
    }


# --- Geometria ----------------------------------------------------------------------------------
def _facce(verts):
    return {f for v in verts for f in v.link_faces}


def cuboide(bm, minimo, massimo, indice_materiale=0):
    """Aggiunge a bm il parallelepipedo con gli spigoli opposti in minimo e massimo."""
    lo, hi = Vector(minimo), Vector(massimo)
    centro, lati = (lo + hi) / 2, hi - lo
    verts = bmesh.ops.create_cube(bm, size=1.0)["verts"]
    for v in verts:
        v.co = centro + Vector((v.co.x * lati.x, v.co.y * lati.y, v.co.z * lati.z))
    for f in _facce(verts):
        f.material_index = indice_materiale
    return verts


def cilindro(bm, centro, raggio, lunghezza, asse="Z", lati=26, indice_materiale=0):
    """Aggiunge a bm un cilindro a lati piani, con l'asse lungo X o Z e il centro in centro."""
    rotazione = Matrix.Rotation(math.pi / 2, 4, "Y") if asse == "X" else Matrix.Identity(4)
    matrice = Matrix.Translation(Vector(centro)) @ rotazione
    verts = bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=lati,
        radius1=raggio,
        radius2=raggio,
        depth=lunghezza,
        matrix=matrice,
    )["verts"]
    for f in _facce(verts):
        f.material_index = indice_materiale
    return verts


def tubo(bm, centro, r_interno, r_esterno, lunghezza, asse="X", lati=26, indice_materiale=0):
    """Aggiunge a bm un cilindro cavo con l'asse lungo X, Y o Z e il centro in centro."""
    rotazione = {
        "X": Matrix.Rotation(math.pi / 2, 4, "Y"),
        "Y": Matrix.Rotation(-math.pi / 2, 4, "X"),
        "Z": Matrix.Identity(4),
    }[asse]
    matrice = Matrix.Translation(Vector(centro)) @ rotazione
    mezzo = lunghezza / 2
    anelli = []
    for z in (-mezzo, mezzo):
        for raggio in (r_interno, r_esterno):
            anelli.append(
                [
                    bm.verts.new(
                        matrice @ Vector((raggio * math.cos(a), raggio * math.sin(a), z))
                    )
                    for a in (2 * math.pi * i / lati for i in range(lati))
                ]
            )
    (int0, est0, int1, est1) = anelli
    facce = []
    for i in range(lati):
        j = (i + 1) % lati
        facce += [
            bm.faces.new((est0[i], est0[j], est1[j], est1[i])),  # fuori
            bm.faces.new((int0[i], int1[i], int1[j], int0[j])),  # dentro
            bm.faces.new((int0[i], int0[j], est0[j], est0[i])),  # bocca in -Z
            bm.faces.new((int1[i], est1[i], est1[j], int1[j])),  # bocca in +Z
        ]
    bmesh.ops.recalc_face_normals(bm, faces=facce)
    for f in facce:
        f.material_index = indice_materiale
    return [v for anello in anelli for v in anello]


def prisma_x(bm, punti, x0, x1, indice_materiale=0):
    """Aggiunge a bm il prisma con l'asse su X, da x0 a x1, sul poligono dei punti (y, z).

    Il poligono deve essere a stella rispetto all'origine del piano (y, z): le basi sono a ventaglio.
    """
    anello0 = [bm.verts.new((x0, y, z)) for y, z in punti]
    anello1 = [bm.verts.new((x1, y, z)) for y, z in punti]
    centro0, centro1 = bm.verts.new((x0, 0.0, 0.0)), bm.verts.new((x1, 0.0, 0.0))
    facce = []
    for i in range(len(punti)):
        j = (i + 1) % len(punti)
        facce += [
            bm.faces.new((anello0[i], anello0[j], anello1[j], anello1[i])),
            bm.faces.new((centro0, anello0[j], anello0[i])),
            bm.faces.new((centro1, anello1[i], anello1[j])),
        ]
    bmesh.ops.recalc_face_normals(bm, faces=facce)
    for f in facce:
        f.material_index = indice_materiale
    return anello0 + anello1


def contatti_sul_cerchio(bm, x, raggio_cerchio, sporgenza, raggio, verso=1, lati=6, indice_materiale=0):
    """I 26 contatti di una faccia: cilindretti sul cerchio, dal piano x fino a x + verso * sporgenza.

    Il contatto i sta all'angolo i * PASSO_ANGOLO, misurato da +Z verso +Y: il contatto 0, la A, è in
    cima. Lo stesso angolo vale per le facce dell'anello (convenzione, «Angoli»).
    """
    for i in range(26):
        angolo = i * PASSO_ANGOLO
        centro = (
            x + verso * sporgenza / 2,
            raggio_cerchio * math.sin(angolo),
            raggio_cerchio * math.cos(angolo),
        )
        cilindro(bm, centro, raggio, sporgenza, "X", lati, indice_materiale)


def mesh(nome, costruisci, mats):
    """Crea una mesh: costruisci(bm) aggiunge la geometria, mats è l'elenco dei materiali."""
    bm = bmesh.new()
    costruisci(bm)
    dati = bpy.data.meshes.new(nome)
    bm.to_mesh(dati)
    bm.free()
    for mat in mats:
        dati.materials.append(mat)
    return dati


def oggetto(nome, dati, posizione=(0.0, 0.0, 0.0), genitore=None, **proprieta):
    """Crea l'oggetto nome (una mesh, o un vuoto se dati è None) nella posizione del mondo indicata.

    Le proprietà in più (fase, raggio_contatti) diventano proprietà personalizzate, che
    l'esportatore scrive negli extras del nodo glTF.
    """
    ogg = bpy.data.objects.new(nome, dati)
    if dati is None:
        ogg.empty_display_type = "PLAIN_AXES"
        ogg.empty_display_size = 0.02
    bpy.context.scene.collection.objects.link(ogg)
    mondo = Vector(posizione)
    if genitore is not None:
        ogg.parent = genitore
        mondo -= posizione_mondo(genitore)
    ogg.location = mondo
    for chiave, valore in proprieta.items():
        ogg[chiave] = valore
    return ogg


def posizione_mondo(ogg):
    """La posizione nel mondo, sommando quelle dei genitori (nessuno ruota né scala)."""
    somma = Vector((0.0, 0.0, 0.0))
    while ogg is not None:
        somma += ogg.location
        ogg = ogg.parent
    return somma
