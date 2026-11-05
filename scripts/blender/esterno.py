"""L'esterno della macchina dal modello «Enigma Machine» di ASHISH (Sketchfab, CC BY 4.0; D20).

Il modello di ASHISH ha la cassa, il coperchio di legno, la piastra, il coperchio dei rotori, la
tastiera e il pannello a spine, ma dentro è vuoto: rotori, nottolini, leva e batteria restano quelli
di rotori.py e meccanica.py. La copia di partenza sta fuori da git (D21): vedi sorgenti.md.

Che cosa fa questo modulo:

1. importa `sorgenti/ashish/scene.gltf` e porta ogni pezzo nel sistema della convenzione: ruota di
   90° attorno a Z (in ASHISH il pannello a spine guarda verso −X, nella convenzione il fronte
   guarda verso −Y), scala di SCALA e alza il fondo della cassa a z = 0;
2. assegna ogni pezzo (`part.012`, …) a un nodo della convenzione con la tabella CORRISPONDENZA;
3. scompone i pezzi che contengono più nodi: le tre file di tasti diventano 26 tasti, il disco con
   la lettera delle lampade diventa 26 lampade, la piastra superiore si taglia in due (davanti resta
   alla cassa, dietro va al coperchio interno);
4. toglie spine e cavi del pannello (li disegna la pagina, D15) e rimette le prese che le spine
   coprivano, copiando quella di ASHISH;
5. mette le ancore di tasti, prese e lampade sulla geometria nuova.

Le normali: il modello ha le normali personalizzate su cui sono cotte le normal map. Il passaggio da
bmesh non le conserva, quindi viaggiano in uno strato degli angoli («normale») e alla fine tornano
normali personalizzate.
"""

import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

import comune as c

QUI = Path(__file__).resolve().parent
SORGENTE = QUI / "sorgenti" / "ashish" / "scene.gltf"

# --- Trasformazione -----------------------------------------------------------------------------
# Dopo l'importazione il fondo di ASHISH (`part.085`) misura 350 × 290 mm, con il lato lungo su X.
# La convenzione dà 340 mm di profondità e 280 di larghezza (fonte «technikmuseum-enigma»): la scala
# è uniforme e porta la profondità a 340 mm; la larghezza diventa 281,7 mm.
SCALA = 0.340 / 0.350
ROTAZIONE = Matrix.Rotation(math.pi / 2, 4, "Z")  # −X di ASHISH (il fronte) diventa −Y

# --- Corrispondenza dei pezzi -------------------------------------------------------------------
# Nome del pezzo di ASHISH (senza `_low…`) → nodo della convenzione. I pezzi in SPECIALI si
# scompongono a parte; quelli in TOLTI non entrano nel modello.
CORRISPONDENZA = {
    # La cassa: fondo, pareti, telaio sotto la piastra, cerniere e fermi.
    "part.085": "cassa",  # fondo
    "part.082": "cassa",  # pareti
    "part.001": "cassa",  # telaio sotto la piastra
    "part.066": "cassa",  # ganci ai lati del pannello a spine
    "part.068": "cassa",  # traversa sopra il pannello a spine
    "part.018": "cassa",  # pomelli ai lati delle lampade
    "part.029": "cassa",  # fermi del coperchio interno
    "part.030": "cassa",
    "part.031": "cassa",
    "part.079": "cassa",  # cerniere del coperchio di legno, lato cassa
    "part.080": "cassa",
    "part.081": "cassa",
    # Il coperchio interno: la lamiera con le tre finestrelle e quello che ci sta sopra.
    "part.009": "coperchio_interno",  # lamiera delle finestrelle
    "part.011": "coperchio_interno",  # cornici delle finestrelle
    "part.074": "coperchio_interno",
    "part.087": "coperchio_interno",  # vetri delle finestrelle
    "part.015": "coperchio_interno",  # cerniera
    "part.017": "coperchio_interno",
    "part.021": "coperchio_interno",
    "part.022": "coperchio_interno",
    "part.072": "coperchio_interno",
    "part.073": "coperchio_interno",
    "part.032": "coperchio_interno",  # leve di chiusura
    "part.033": "coperchio_interno",
    "part.034": "coperchio_interno",
    "part.045": "coperchio_interno",  # quadrante semicircolare
    "part.052": "coperchio_interno",  # indice del quadrante
    "part.053": "coperchio_interno",
    "part.046": "coperchio_interno",  # i quattro morsetti agli angoli
    "part.047": "coperchio_interno",
    "part.048": "coperchio_interno",
    "part.049": "coperchio_interno",
    "part.050": "coperchio_interno",
    "part.051": "coperchio_interno",
    # La tastiera: la piastra a gradini con la sua flangia e la targhetta.
    "part.006": "tastiera",
    "part.004": "tastiera",
    "part.067": "tastiera",
    "part.075": "tastiera",
    # Il pannello a spine: la lastra, le prese libere, le viti, la striscia delle lettere.
    "part.008": "pannello_spine",
    "part.086": "pannello_spine",
    "part.076": "pannello_spine",
    "part.020": "pannello_spine",
    # Lo sportello del pannello, aperto verso il basso.
    "part": "sportello_spine",
    "part.024": "sportello_spine",
    "part.025": "sportello_spine",
    "part.026": "sportello_spine",
    "part.027": "sportello_spine",
    "part.028": "sportello_spine",
    "part.083": "sportello_spine",
    "part.084": "sportello_spine",
    # Il coperchio di legno, aperto dietro la macchina (D22), con quello che porta dentro, i due
    # bracci che lo reggono e la loro staffa sulla cassa.
    "part.077": "coperchio_legno",
    "part.078": "coperchio_legno",
    "part.003": "coperchio_legno",
    "part.035": "coperchio_legno",
    "part.036": "coperchio_legno",
    "part.037": "coperchio_legno",
    "part.038": "coperchio_legno",
    "part.023": "coperchio_legno",
    "part.056": "coperchio_legno",
    "part.039": "coperchio_legno",
    "part.040": "coperchio_legno",
    "part.041": "coperchio_legno",
    "part.042": "coperchio_legno",
    "part.043": "coperchio_legno",
    "part.044": "coperchio_legno",
    "part.019": "coperchio_legno",  # staffe dei bracci
    "part.069": "coperchio_legno",  # bracci
    "part.070": "coperchio_legno",
    "part.071": "coperchio_legno",
    "part.002": "coperchio_legno",  # ferramenta della cerniera, lato coperchio
    "part.007": "coperchio_legno",
}
SPECIALI = {
    "part.005": "piastra superiore: davanti alla cassa, dietro Y_TAGLIO al coperchio interno",
    "part.010": "26 lampade: un disco e la sua lettera per lampada",
    "part.012": "fila dei tasti PYXCVBNML",
    "part.014": "fila dei tasti ASDFGHJK",
    "part.013": "fila dei tasti QWERTZUIO",
}
TOLTI = {
    "part.054": "le 18 spine inserite, con i loro puntali",
    "part.060": "i nove cavi",
    "part.016": "la finta fascia dei rotori sotto le finestrelle, con i numeri dipinti 08, 17, 07: "
    "nelle finestrelle si vedono gli anelli veri",
}
FILE_TASTI = {"part.013": "QWERTZUIO", "part.014": "ASDFGHJK", "part.012": "PYXCVBNML"}

# La piastra superiore si taglia sul piano y = Y_TAGLIO, fra l'ultima fila di lampade (che arriva a
# 39 mm) e le finestrelle (da 44 mm). Misura nel sistema della convenzione, in metri.
Y_TAGLIO = 0.0425 * SCALA

# Un tasto è fatto di 7 pezzi staccati; due tasti vicini distano 27 mm.
PEZZI_PER_TASTO = 7
DISTANZA_TASTI = 0.008  # oltre questa distanza lungo la fila, i pezzi sono di un altro tasto


# --- Strumenti ----------------------------------------------------------------------------------
def _chiave(ogg):
    """`part.012_low_low_mec.002_0` → `part.012`; `part_low_low_box.001_0` → `part`."""
    return ogg.name.split("_low")[0]


def _bm_trasformato(ogg, matrice):
    """La mesh di ogg in un bmesh, nel sistema della convenzione, con le normali in uno strato."""
    rotazione = matrice.to_3x3().normalized()
    copia = ogg.data.copy()
    normali = [(rotazione @ Vector(n.vector)).normalized() for n in ogg.data.corner_normals]
    strato = copia.attributes.new("normale", "FLOAT_VECTOR", "CORNER")
    strato.data.foreach_set("vector", [x for n in normali for x in n])
    bm = bmesh.new()
    bm.from_mesh(copia)
    bpy.data.meshes.remove(copia)
    bm.transform(matrice)
    return bm


def _componenti(bm):
    """Le parti staccate di bm, come liste di facce."""
    bm.faces.ensure_lookup_table()
    visti = set()
    parti = []
    for inizio in bm.faces:
        if inizio.index in visti:
            continue
        pila, parte = [inizio], []
        visti.add(inizio.index)
        while pila:
            f = pila.pop()
            parte.append(f)
            for v in f.verts:
                for g in v.link_faces:
                    if g.index not in visti:
                        visti.add(g.index)
                        pila.append(g)
        parti.append(parte)
    return parti


def _scatola(punti):
    punti = list(punti)
    return (
        Vector([min(p[i] for p in punti) for i in range(3)]),
        Vector([max(p[i] for p in punti) for i in range(3)]),
    )


def _scatola_facce(facce):
    return _scatola(v.co for f in facce for v in f.verts)


def _centro(facce):
    lo, hi = _scatola_facce(facce)
    return (lo + hi) / 2


def _sottoinsieme(bm, facce):
    """Un bmesh nuovo con le sole facce indicate di bm (gli indici restano quelli di bm)."""
    tenere = {f.index for f in facce}
    copia = bm.copy()
    copia.faces.ensure_lookup_table()
    via = [f for f in copia.faces if f.index not in tenere]
    bmesh.ops.delete(copia, geom=via, context="FACES")
    return copia


class Nodo:
    """Raccoglie i pezzi di un nodo, ognuno con il suo materiale, e alla fine ne fa una mesh."""

    def __init__(self, nome):
        self.nome = nome
        self.pezzi = []  # (bmesh, materiale)

    def aggiungi(self, bm, materiale):
        self.pezzi.append((bm, materiale))

    def scatola(self):
        return _scatola(v.co for bm, _ in self.pezzi for v in bm.verts)

    def mesh(self, origine):
        """La mesh del nodo, con le coordinate relative a origine e le normali personalizzate."""
        materiali = []
        for _, mat in self.pezzi:
            if mat not in materiali:
                materiali.append(mat)
        uscita = bmesh.new()
        for bm, mat in self.pezzi:
            indice = materiali.index(mat)
            for f in bm.faces:
                f.material_index = indice
            appoggio = bpy.data.meshes.new("appoggio")
            bm.to_mesh(appoggio)
            uscita.from_mesh(appoggio)
            bpy.data.meshes.remove(appoggio)
        bmesh.ops.translate(uscita, vec=-Vector(origine), verts=uscita.verts)
        dati = bpy.data.meshes.new(self.nome)
        uscita.to_mesh(dati)
        uscita.free()
        for mat in materiali:
            dati.materials.append(mat)
        _ripristina_normali(dati)
        return dati


def _ripristina_normali(dati):
    """Dallo strato «normale» degli angoli alle normali personalizzate della mesh."""
    attributo = dati.attributes.get("normale")
    if attributo is None:
        return
    normali = [Vector(a.vector) for a in attributo.data]
    for p in dati.polygons:
        p.use_smooth = True
    dati.normals_split_custom_set(normali)
    dati.attributes.remove(dati.attributes["normale"])


# --- Importazione -------------------------------------------------------------------------------
def importa():
    """Importa il modello di ASHISH e restituisce, per ogni pezzo, il bmesh nel sistema della
    convenzione e il suo materiale. Gli oggetti importati si cancellano subito: restano solo i
    materiali e le immagini."""
    if not SORGENTE.exists():
        raise SystemExit(
            f"manca {SORGENTE.relative_to(QUI.parent.parent)}: il modello di ASHISH sta fuori da git, "
            "vedi scripts/blender/sorgenti.md per scaricarlo ed estrarlo"
        )
    prima = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(SORGENTE))
    importati = [o for o in bpy.data.objects if o not in prima]
    bpy.context.view_layer.update()

    trasforma = Matrix.Diagonal((SCALA, SCALA, SCALA, 1.0)) @ ROTAZIONE
    fondo = next(o for o in importati if o.type == "MESH" and _chiave(o) == "part.085")
    z_fondo = min((trasforma @ fondo.matrix_world @ Vector(v.co)).z for v in fondo.data.vertices)
    trasforma = Matrix.Translation((0.0, 0.0, -z_fondo)) @ trasforma

    pezzi = {}
    for ogg in importati:
        if ogg.type != "MESH":
            continue
        chiave = _chiave(ogg)
        if chiave in TOLTI:
            continue
        if chiave not in CORRISPONDENZA and chiave not in SPECIALI:
            raise RuntimeError(f"il pezzo {ogg.name} di ASHISH non è nella tabella CORRISPONDENZA")
        if len(ogg.data.materials) != 1:
            raise RuntimeError(f"{ogg.name}: ci si aspetta un materiale solo")
        mat = ogg.data.materials[0]
        mat = bpy.data.materials[SOSTITUTI.get(mat.name, mat.name)]
        pezzi[chiave] = (_bm_trasformato(ogg, trasforma @ ogg.matrix_world), mat)
    _semplifica_vetro(bpy.data.materials["glass"])
    mancanti = (set(CORRISPONDENZA) | set(SPECIALI)) - set(pezzi)
    if mancanti:
        raise RuntimeError(f"pezzi della tabella che il modello non ha: {sorted(mancanti)}")

    for ogg in importati:
        dati = ogg.data
        bpy.data.objects.remove(ogg)
        if isinstance(dati, bpy.types.Mesh) and dati.users == 0:
            bpy.data.meshes.remove(dati)
    return pezzi


def riduci_texture(lato=2048):
    """Le texture di ASHISH sono 4096 × 4096: si portano a lato × lato (D23)."""
    for immagine in bpy.data.images:
        if immagine.name.startswith("atlante") or immagine.size[0] <= lato:
            continue
        immagine.scale(lato, lato)


# Due materiali di ASHISH costano una texture di 600 KB ciascuno per pochi pezzi: `w1_low_box`
# (solo `part.056`, dentro il coperchio di legno) diventa `low_box.001`, che ha la stessa base e la
# stessa normal map; `glass` (i vetri delle finestrelle, tre quadrilateri) perde la texture di
# metallicità e ruvidità e prende valori costanti.
SOSTITUTI = {"w1_low_box": "low_box.001"}


def _semplifica_vetro(mat):
    nodi = mat.node_tree.nodes
    for nodo in [n for n in nodi if n.type in ("TEX_IMAGE", "SEPARATE_COLOR", "MATH")]:
        nodi.remove(nodo)
    bsdf = next(n for n in nodi if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.05


# --- Scomposizione ------------------------------------------------------------------------------
def _taglia_piastra(bm):
    """La piastra superiore divisa sul piano y = Y_TAGLIO: (davanti, dietro)."""
    geom = list(bm.verts) + list(bm.edges) + list(bm.faces)
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0.0, Y_TAGLIO, 0.0), plane_no=(0.0, 1.0, 0.0))
    bm.faces.index_update()
    davanti = [f for f in bm.faces if f.calc_center_median().y < Y_TAGLIO]
    dietro = [f for f in bm.faces if f.calc_center_median().y >= Y_TAGLIO]
    return _sottoinsieme(bm, davanti), _sottoinsieme(bm, dietro)


def _tasti(pezzi):
    """Le 26 coppie (lettera, bmesh del tasto): i pezzi di una fila si raggruppano lungo X."""
    tasti = {}
    for chiave, fila in FILE_TASTI.items():
        bm, _ = pezzi[chiave]
        parti = sorted(_componenti(bm), key=lambda p: _centro(p).x)
        gruppi = []
        for parte in parti:
            x = _centro(parte).x
            if gruppi and abs(x - _centro(gruppi[-1][0]).x) < DISTANZA_TASTI:
                gruppi[-1].append(parte)
            else:
                gruppi.append([parte])
        if len(gruppi) != len(fila) or any(len(g) != PEZZI_PER_TASTO for g in gruppi):
            raise RuntimeError(f"{chiave}: {[len(g) for g in gruppi]} pezzi per tasto, attesi {len(fila)} × 7")
        for lettera, gruppo in zip(fila, gruppi):  # da sinistra a destra, come la fila
            tasti[lettera.lower()] = _sottoinsieme(bm, [f for parte in gruppo for f in parte])
    return tasti


def _lampade(bm):
    """Le 26 coppie (lettera, bmesh della lampada): disco e lettera concentrici, in tre file."""
    gruppi = []
    for parte in _componenti(bm):
        centro = _centro(parte)
        vicino = next((g for g in gruppi if (_centro(g[0]) - centro).xy.length < 0.004), None)
        if vicino is None:
            gruppi.append([parte])
        else:
            vicino.append(parte)
    if len(gruppi) != 26:
        raise RuntimeError(f"part.010: {len(gruppi)} lampade, attese 26")
    # Le file vanno dalla più lontana (y più grande) alla più vicina a chi scrive, come FILE_QWERTZ.
    gruppi.sort(key=lambda g: -_centro(g[0]).y)
    lampade = {}
    inizio = 0
    for fila in c.FILE_QWERTZ:
        riga = sorted(gruppi[inizio : inizio + len(fila)], key=lambda g: _centro(g[0]).x)
        inizio += len(fila)
        ys = [_centro(g[0]).y for g in riga]
        if max(ys) - min(ys) > 0.005:
            raise RuntimeError(f"le lampade della fila {fila} non stanno su una riga")
        for lettera, gruppo in zip(fila, riga):
            lampade[lettera.lower()] = _sottoinsieme(bm, [f for parte in gruppo for f in parte])
    return lampade


# --- Pannello a spine ---------------------------------------------------------------------------
# Una presa è una coppia di fori uno sopra l'altro, con l'anello e il fondo: nove pezzi staccati di
# `part.086`. ASHISH le disegna solo dove non c'è una spina (9 su 26); le altre 17 si copiano da una
# di quelle. Il passo fra le prese di una fila è 27 mm in ASHISH, 26,2 mm qui.
PEZZI_PER_PRESA = 9


def _prese(bm_prese):
    """Le prese di ASHISH: (centro sul piano x-z, facce), dove il centro sta fra i due fori."""
    gruppi = []
    for parte in _componenti(bm_prese):
        centro = _centro(parte)
        vicino = next(
            # I due fori di una presa distano 12,3 mm in z, due file 22 mm.
            (g for g in gruppi if abs(g[0].x - centro.x) < 0.004 and abs(g[0].z - centro.z) < 0.015),
            None,
        )
        if vicino is None:
            gruppi.append([centro, parte])
        else:
            vicino.append(parte)
    prese = []
    for centro, *parti in gruppi:
        facce = [f for p in parti for f in p]
        lo, hi = _scatola_facce(facce)
        prese.append(((lo + hi) / 2, facce))
    return prese


def _griglia_prese(prese):
    """Il centro di ciascuna delle 26 prese, per lettera, dalla griglia di quelle di ASHISH.

    Le file sono quelle della convenzione (9, 8, 9). Le x della fila di mezzo vengono dalle prese
    di ASHISH, che lì le ha tutte; le file di sopra e di sotto hanno le x a metà fra quelle e il
    passo stesso. Le z delle file sono quelle delle prese di ASHISH (sotto ce n'è una sola).
    """
    centri = sorted((p[0] for p in prese), key=lambda v: v.z)
    mezzo = [v for v in centri if abs(v.z - centri[-1].z) < 0.004]
    sotto = [v for v in centri if v not in mezzo]
    if len(mezzo) != 8 or len(sotto) != 1:
        raise RuntimeError(f"prese di ASHISH: {len(mezzo)} nella fila di mezzo e {len(sotto)} sotto, attese 8 e 1")
    xs = sorted(v.x for v in mezzo)
    passo = (xs[-1] - xs[0]) / 7
    z_mezzo = sum(v.z for v in mezzo) / 8
    z_sotto = sotto[0].z
    z_sopra = 2 * z_mezzo - z_sotto
    y = sum(v.y for v in mezzo) / 8
    file = {
        c.FILE_QWERTZ[0]: [xs[0] - passo / 2 + i * passo for i in range(9)],
        c.FILE_QWERTZ[1]: xs,
        c.FILE_QWERTZ[2]: [xs[0] - passo / 2 + i * passo for i in range(9)],
    }
    zeta = {c.FILE_QWERTZ[0]: z_sopra, c.FILE_QWERTZ[1]: z_mezzo, c.FILE_QWERTZ[2]: z_sotto}
    return {
        lettera.lower(): Vector((x, y, zeta[fila]))
        for fila, xs_fila in file.items()
        for lettera, x in zip(fila, xs_fila)
    }


def _completa_prese(bm_prese):
    """Il bmesh delle 26 prese e, per lettera, il punto della presa sulla faccia anteriore."""
    prese = _prese(bm_prese)
    griglia = _griglia_prese(prese)
    modello_centro, modello_facce = prese[0]
    if len(modello_facce) == 0:
        raise RuntimeError("presa di ASHISH vuota")
    uscita = _sottoinsieme(bm_prese, [f for _, facce in prese for f in facce])
    sagoma = _sottoinsieme(bm_prese, modello_facce)
    for centro in griglia.values():
        if any((centro - p[0]).length < 0.004 for p in prese):
            continue
        copia = sagoma.copy()
        bmesh.ops.translate(copia, vec=centro - modello_centro, verts=copia.verts)
        appoggio = bpy.data.meshes.new("appoggio")
        copia.to_mesh(appoggio)
        uscita.from_mesh(appoggio)
        bpy.data.meshes.remove(appoggio)
        copia.free()
    davanti = min(v.co.y for v in sagoma.verts)  # la faccia della presa verso chi scrive
    sagoma.free()
    ancore = {lettera: Vector((p.x, davanti, p.z)) for lettera, p in griglia.items()}
    return uscita, ancore


# --- Costruzione --------------------------------------------------------------------------------
def costruisci(mats):
    """Costruisce i nodi dell'esterno e le loro ancore. mats sono i materiali piani di comune."""
    pezzi = importa()
    riduci_texture()
    nodi = {nome: Nodo(nome) for nome in sorted(set(CORRISPONDENZA.values()))}
    for chiave, nome in CORRISPONDENZA.items():
        bm, mat = pezzi[chiave]
        if chiave == "part.086":
            continue  # le prese si completano più sotto
        nodi[nome].aggiungi(bm, mat)

    piastra, mat_piastra = pezzi["part.005"]
    davanti, dietro = _taglia_piastra(piastra)
    nodi["cassa"].aggiungi(davanti, mat_piastra)
    nodi["coperchio_interno"].aggiungi(dietro, mat_piastra)

    prese, ancore_prese = _completa_prese(pezzi["part.086"][0])
    nodi["pannello_spine"].aggiungi(prese, pezzi["part.086"][1])

    # Il perno dei nottolini: lo regge la cassa (convenzione, «Misure della 4j»), spostato con
    # l'interno (OFFSET_INTERNO).
    perno = bmesh.new()
    x, y, z = Vector((0.0, c.Y_PERNO, c.Z_PERNO)) + OFFSET_INTERNO
    c.cilindro(perno, (x, y, z), 0.0025, 0.230, "X", 10)
    perno.normal_update()
    strato = perno.loops.layers.float_vector.new("normale")
    for f in perno.faces:
        for loop in f.loops:
            loop[strato] = f.normal
    nodi["cassa"].aggiungi(perno, mats["ottone"])

    # Origini: la cassa al centro del fondo; i coperchi e lo sportello sulla cerniera; il pannello al
    # suo centro; la tastiera sopra la piastra, al centro delle file.
    lo, hi = nodi["coperchio_interno"].scatola()
    origini = {"cassa": Vector((0.0, 0.0, 0.0)), "coperchio_interno": Vector((0.0, hi.y, hi.z))}
    cerniere = _scatola(v.co for k in ("part.079", "part.080") for v in pezzi[k][0].verts)
    origini["coperchio_legno"] = Vector((0.0, *((cerniere[0] + cerniere[1]) / 2).yz))
    lo, hi = nodi["sportello_spine"].scatola()
    origini["sportello_spine"] = Vector((0.0, hi.y, hi.z))
    lo, hi = nodi["pannello_spine"].scatola()
    origini["pannello_spine"] = (lo + hi) / 2
    lo, hi = nodi["tastiera"].scatola()
    origini["tastiera"] = Vector((0.0, (lo.y + hi.y) / 2, hi.z))

    oggetti = {}
    for nome, nodo in nodi.items():
        proprieta = {"fase": FASI_ESTERNO[nome]} if nome in FASI_ESTERNO else {}
        oggetti[nome] = c.oggetto(nome, nodo.mesh(origini[nome]), origini[nome], **proprieta)

    # I tasti, figli della tastiera, con l'origine alla base; e le loro ancore, sotto il gambo.
    _, mat_tasti = pezzi["part.012"]
    for lettera, bm in sorted(_tasti(pezzi).items()):
        lo, hi = _scatola(v.co for v in bm.verts)
        base = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
        nodo = Nodo(f"tasto_{lettera}")
        nodo.aggiungi(bm, mat_tasti)
        c.oggetto(nodo.nome, nodo.mesh(base), base, genitore=oggetti["tastiera"])
        c.oggetto(f"ancora_tasto_{lettera}", None, base)

    # Le lampade: il disco e la sua lettera, con il materiale `vetro` che la pagina accende.
    bm_lampade, mat_lampade = pezzi["part.010"]
    vetro = mat_lampade.copy()
    vetro.name = "vetro"
    for lettera, bm in sorted(_lampade(bm_lampade).items()):
        lo, hi = _scatola(v.co for v in bm.verts)
        base = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
        nodo = Nodo(f"lampada_{lettera}")
        nodo.aggiungi(bm, vetro)
        c.oggetto(nodo.nome, nodo.mesh(base), base)
        c.oggetto(f"ancora_lampada_{lettera}", None, base - Vector((0.0, 0.0, 0.002)))

    for lettera, punto in sorted(ancore_prese.items()):
        c.oggetto(f"ancora_presa_{lettera}", None, punto)

    for bm, _ in pezzi.values():
        bm.free()


# I nodi dell'esterno che la clip `smontaggio` muove, con la loro fase.
FASI_ESTERNO = {"coperchio_interno": 1, "sportello_spine": 1, "coperchio_legno": 1, "tastiera": 4}

# --- L'interno sotto l'esterno ------------------------------------------------------------------
# I pezzi di rotori.py e meccanica.py stanno dove li ha messi la 4j, per la cassa di allora. Qui si
# spostano tutti insieme perché la fascia numerata del rotore centrale (7,5 mm a sinistra del suo
# centro) stia sotto la finestrella di mezzo di ASHISH (x = −25,8 mm, y = 83,0 mm) e la cima della
# rotella sotto la lamiera del coperchio. Il passo fra le finestrelle di ASHISH è 28,1 mm, quello fra
# i nostri rotori 30: gli anelli di destra e di sinistra stanno 2 mm fuori centro, e la 4m li
# sistema.
OFFSET_INTERNO = Vector((-0.0183, 0.008, -0.004))
RADICI_INTERNO = (
    "asse_rotori",
    "rotore_sinistro",
    "rotore_centrale",
    "rotore_destro",
    "riflettore",
    "ruota_ingresso",
    "nottolino_sinistro",
    "nottolino_centrale",
    "nottolino_destro",
    "leva_tasti",
    "batteria",
    "ancora_batteria",
)


def allinea_interno():
    """Sposta di OFFSET_INTERNO i nodi radice dell'interno; i figli li seguono."""
    for nome in RADICI_INTERNO:
        bpy.data.objects[nome].location += OFFSET_INTERNO
