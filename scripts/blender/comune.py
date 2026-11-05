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
# La cassa: scheda del Deutsches Technikmuseum, inventario 1/2000/0146 0 (fonte
# «technikmuseum-enigma» in src/content/fonti.yaml): a coperchio chiuso 340 mm di profondità,
# 280 di larghezza, 160 di altezza. Il coperchio di legno non è un nodo della convenzione, quindi
# l'altezza della cassa senza coperchio è una stima.
LARGHEZZA = 0.280
PROFONDITA = 0.340
ALTEZZA_CHIUSA = 0.160
ALTEZZA = 0.115  # stima: la cassa aperta, senza il coperchio di legno
SPESSORE = 0.010  # pareti e fondo

FRONTE = -PROFONDITA / 2  # y del fronte
RETRO = PROFONDITA / 2
Z_PIANO = 0.110  # faccia superiore del piano di tasti e lampade

# Le misure che seguono sono dell'abbozzo, non della fonte: la 4j le sostituisce.
PASSO_TASTI = 0.026  # distanza fra due tasti, e fra due lampade, della stessa fila
Y_VANO = -0.010  # dove finisce il piano e comincia il vano dei rotori
Y_ASSE = 0.075  # asse dei rotori
Z_ASSE = 0.070
RAGGIO_ROTORE = 0.050
RAGGIO_CONTATTI = 0.035  # cerchio dei 26 contatti sulle facce di rotori, ruota d'ingresso e riflettore

# Le tre file della tastiera e delle lampade dell'Enigma I, dalla più lontana alla più vicina a chi
# scrive.
FILE_QWERTZ = ("QWERTZUIO", "ASDFGHJK", "PYXCVBNML")


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
    ):
        for blocco in list(raccolta):
            raccolta.remove(blocco)


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


def materiali():
    """I materiali dell'abbozzo, per nome."""
    return {
        "legno": materiale("legno", (0.23, 0.12, 0.05), ruvidita=0.6),
        "vernice": materiale("vernice", (0.02, 0.02, 0.02), ruvidita=0.8),
        "metallo": materiale("metallo", (0.62, 0.62, 0.64), metallico=1.0, ruvidita=0.35),
        "metallo_scuro": materiale("metallo_scuro", (0.10, 0.10, 0.11), metallico=0.7, ruvidita=0.5),
        "bachelite": materiale("bachelite", (0.03, 0.03, 0.03), ruvidita=0.4),
        "vetro": materiale("vetro", (0.85, 0.80, 0.62), ruvidita=0.2),
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


def posizioni_qwertz(y_file, z):
    """Per ogni lettera, la posizione nel mondo del suo tasto o della sua lampada.

    y_file sono le tre y delle file, nell'ordine di FILE_QWERTZ.
    """
    posizioni = {}
    for fila, y in zip(FILE_QWERTZ, y_file):
        primo = -(len(fila) - 1) / 2 * PASSO_TASTI
        for i, lettera in enumerate(fila):
            posizioni[lettera.lower()] = (primo + i * PASSO_TASTI, y, z)
    return posizioni
