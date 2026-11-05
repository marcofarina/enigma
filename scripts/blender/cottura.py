"""Materiali dell'interno, cotti in un atlante (fase 4m).

I pezzi dell'interno (rotori, riflettore, ruota d'ingresso, nottolini, leva, batteria, asse) nascono
con materiali piani. Qui prendono materiali procedurali (alluminio, bachelite, ottone, vernice
raggrinzita, cartone), che Cycles cuoce in tre immagini sull'unico materiale `interno`:

    interno_colore    colore base (sRGB)
    interno_orm       occlusione (R), ruvidità (G), metallicità (B): il formato di glTF
    interno_normale   normal map nello spazio tangente

L'occlusione si cuoce un pezzo alla volta, da solo: dà le ombre dentro il pezzo (fra i denti, nei fori,
negli smussi) e resta giusta anche a macchina smontata.

Restano fuori dall'atlante le facce numerate degli anelli: hanno il materiale `tessera`, con l'atlante
dei glifi della convenzione (comune.py), e le loro UV non si toccano.

Si chiama da costruisci.py dopo gli smussi (smussi.py); tutto avviene in background, con Cycles.
"""

import math

import bmesh
import bpy
import numpy as np

import comune as c

LATO = 1024  # con 2048 il .glb passa il tetto di 6 MB (6650 KB): la densità resta di circa 10 pixel per mm
MARGINE = 4  # pixel di margine attorno alle isole, perché il filtro delle texture non peschi il vuoto
CAMPIONI = 24
CAMPIONI_AO = 96
DISTANZA_AO = 0.006  # metri: oltre questa distanza un pezzo non fa ombra a un altro

# Il colore del vuoto in ciascuna immagine.
VUOTO = {"colore": (0.02, 0.02, 0.02, 1.0), "normale": (0.5, 0.5, 1.0, 1.0)}

# I rappresentanti: per ogni mesh un solo oggetto, scelto fra quelli che la usano. I tre rotori hanno
# le stesse mesh e la stessa texture, quindi si cuoce il rotore centrale.
RAPPRESENTANTI = (
    "rotore_centrale_anello",
    "rotore_centrale_nucleo",
    "rotore_centrale_contatti_piani",
    "rotore_centrale_contatti_molla",
    "rotore_centrale_cricchetto",
    "rotore_centrale_rotella",
    "riflettore",
    "ruota_ingresso",
    "nottolino_centrale",
    "nottolino_destro",
    "asse_rotori",
    "leva_tasti",
    "batteria",
)

# Che materiale procedurale ha ogni (mesh, materiale piano). Ciò che non è qui resta com'era.
RICETTE = {
    ("anello", "bachelite"): "bachelite_lucida",
    ("nucleo", "bachelite"): "bachelite",
    ("contatti_piani", "ottone"): "ottone",
    ("contatti_molla", "ottone"): "ottone",
    ("cricchetto", "bachelite"): "bachelite",
    ("rotella", "metallo"): "alluminio_zigrinato",
    ("riflettore", "metallo_scuro"): "vernice",
    ("riflettore", "ottone"): "ottone",
    ("ruota_ingresso", "metallo_scuro"): "vernice",
    ("ruota_ingresso", "ottone"): "ottone",
    ("nottolino", "metallo"): "acciaio",
    ("nottolino_con_dito", "metallo"): "acciaio",
    ("asse_rotori", "metallo"): "acciaio",
    ("leva_tasti", "metallo"): "acciaio",
    ("batteria", "vernice"): "cartone_scuro",
    ("batteria", "batteria"): "cartone",
    ("batteria", "ottone"): "ottone",
}


# --- Materiali procedurali ----------------------------------------------------------------------
def _n(albero, tipo, **proprieta):
    nodo = albero.nodes.new(tipo)
    for chiave, valore in proprieta.items():
        setattr(nodo, chiave, valore)
    return nodo


def _rumore(albero, coordinate, scala, dettaglio=4.0, rugosita=0.55):
    nodo = _n(albero, "ShaderNodeTexNoise")
    nodo.inputs["Scale"].default_value = scala
    nodo.inputs["Detail"].default_value = dettaglio
    nodo.inputs["Roughness"].default_value = rugosita
    albero.links.new(coordinate, nodo.inputs["Vector"])
    return nodo.outputs["Fac"]


def _intervallo(albero, valore, da_min, da_max, a_min, a_max):
    nodo = _n(albero, "ShaderNodeMapRange")
    nodo.clamp = True
    for nome, v in (("From Min", da_min), ("From Max", da_max), ("To Min", a_min), ("To Max", a_max)):
        nodo.inputs[nome].default_value = v
    albero.links.new(valore, nodo.inputs["Value"])
    return nodo.outputs["Result"]


def _mescola(albero, fattore, a, b):
    """Mescola due colori: a (default_value o socket) e b. Dà il socket del risultato."""
    nodo = _n(albero, "ShaderNodeMix", data_type="RGBA")
    albero.links.new(fattore, nodo.inputs[0])
    for indice, valore in ((6, a), (7, b)):
        if hasattr(valore, "node"):
            albero.links.new(valore, nodo.inputs[indice])
        else:
            nodo.inputs[indice].default_value = valore
    return nodo.outputs[2]


def procedurale(
    nome,
    colore,
    metallico=0.0,
    ruvidita=0.5,
    varia_colore=0.1,
    varia_ruvidita=0.1,
    scala=350.0,
    rilievo=0.0,
    scala_rilievo=1200.0,
    zigrino=False,
    usura=None,
):
    """Un materiale Principled con colore e ruvidità che variano col rumore, un rilievo fine e, se c'è
    `usura` = (colore, metallicità), lo spigolo smussato che lascia scoperto il materiale di sotto."""
    mat = bpy.data.materials.new(f"proc_{nome}")
    mat.use_nodes = True
    albero = mat.node_tree
    albero.nodes.clear()
    uscita = _n(albero, "ShaderNodeOutputMaterial")
    bsdf = _n(albero, "ShaderNodeBsdfPrincipled")
    albero.links.new(bsdf.outputs["BSDF"], uscita.inputs["Surface"])
    coordinate = _n(albero, "ShaderNodeTexCoord").outputs["Object"]

    chiaro = tuple(min(1.0, v * (1 + varia_colore)) for v in colore) + (1.0,)
    scuro = tuple(v * (1 - varia_colore) for v in colore) + (1.0,)
    fattore = _intervallo(albero, _rumore(albero, coordinate, scala), 0.35, 0.65, 0.0, 1.0)
    base = _mescola(albero, fattore, scuro, chiaro)
    ruv = _intervallo(
        albero,
        _rumore(albero, coordinate, scala * 1.7),
        0.35,
        0.65,
        max(0.0, ruvidita - varia_ruvidita),
        min(1.0, ruvidita + varia_ruvidita),
    )
    metal = metallico

    if usura is not None:
        # Maschera dello spigolo: la normale smussata (nodo Bevel) si scosta da quella vera dove c'è
        # uno spigolo. 1 − (N · N_smussata) è 0 sulle facce e cresce sugli spigoli.
        smusso = _n(albero, "ShaderNodeBevel")
        smusso.inputs["Radius"].default_value = 0.0006
        geometria = _n(albero, "ShaderNodeNewGeometry")
        punto = _n(albero, "ShaderNodeVectorMath", operation="DOT_PRODUCT")
        albero.links.new(geometria.outputs["Normal"], punto.inputs[0])
        albero.links.new(smusso.outputs["Normal"], punto.inputs[1])
        scarto = _n(albero, "ShaderNodeMath", operation="SUBTRACT")
        scarto.inputs[0].default_value = 1.0
        albero.links.new(punto.outputs["Value"], scarto.inputs[1])
        maschera = _intervallo(albero, scarto.outputs["Value"], 0.002, 0.03, 0.0, 1.0)
        colore_usura, metallo_usura = usura
        base = _mescola(albero, maschera, base, colore_usura + (1.0,))
        ruv_nodo = _n(albero, "ShaderNodeMix", data_type="FLOAT")
        albero.links.new(maschera, ruv_nodo.inputs[0])
        albero.links.new(ruv, ruv_nodo.inputs[2])
        ruv_nodo.inputs[3].default_value = 0.35
        ruv = ruv_nodo.outputs[0]
        met_nodo = _n(albero, "ShaderNodeMix", data_type="FLOAT")
        albero.links.new(maschera, met_nodo.inputs[0])
        met_nodo.inputs[2].default_value = metallico
        met_nodo.inputs[3].default_value = metallo_usura
        metal = met_nodo.outputs[0]

    albero.links.new(base, bsdf.inputs["Base Color"])
    albero.links.new(ruv, bsdf.inputs["Roughness"])
    if hasattr(metal, "node"):
        albero.links.new(metal, bsdf.inputs["Metallic"])
    else:
        bsdf.inputs["Metallic"].default_value = metal

    if rilievo:
        if zigrino:
            # Zigrinatura: i bordi delle celle di Voronoi, a scala fine.
            vor = _n(albero, "ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
            vor.inputs["Scale"].default_value = scala_rilievo
            albero.links.new(coordinate, vor.inputs["Vector"])
            altezza = vor.outputs["Distance"]
        else:
            altezza = _rumore(albero, coordinate, scala_rilievo, dettaglio=6.0, rugosita=0.6)
        bump = _n(albero, "ShaderNodeBump")
        bump.inputs["Strength"].default_value = rilievo
        bump.inputs["Distance"].default_value = 0.0012
        albero.links.new(altezza, bump.inputs["Height"])
        albero.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def materiali_procedurali():
    """I materiali procedurali per nome. I colori sono lineari, stimati dalle foto della galleria
    (`rotori-con-anelli`, `rotori-e-perno`) e dalle texture di ASHISH (`low_mec.002_baseColor`)."""
    argento = (0.62, 0.63, 0.65)
    return {
        "bachelite": procedurale("bachelite", (0.012, 0.012, 0.012), ruvidita=0.42, varia_colore=0.5, rilievo=0.25, scala_rilievo=900, usura=((0.05, 0.05, 0.05), 0.0)),
        "bachelite_lucida": procedurale("bachelite_lucida", (0.010, 0.010, 0.010), ruvidita=0.28, varia_colore=0.4, rilievo=0.12, scala_rilievo=900, usura=((0.07, 0.07, 0.07), 0.0)),
        "alluminio_zigrinato": procedurale("alluminio_zigrinato", (0.40, 0.41, 0.43), metallico=1.0, ruvidita=0.42, varia_colore=0.08, varia_ruvidita=0.10, rilievo=0.6, scala_rilievo=500, zigrino=True, usura=((0.85, 0.86, 0.88), 1.0)),
        "acciaio": procedurale("acciaio", (0.50, 0.51, 0.53), metallico=1.0, ruvidita=0.34, varia_colore=0.1, varia_ruvidita=0.1, rilievo=0.15, scala_rilievo=1500, usura=((0.78, 0.79, 0.81), 1.0)),
        "ottone": procedurale("ottone", (0.62, 0.40, 0.11), metallico=1.0, ruvidita=0.28, varia_colore=0.12, varia_ruvidita=0.1, rilievo=0.10, scala_rilievo=1500),
        # Vernice nera raggrinzita; agli spigoli si vede il ferro.
        "vernice": procedurale("vernice", (0.030, 0.029, 0.027), ruvidita=0.78, varia_colore=0.25, varia_ruvidita=0.08, rilievo=1.0, scala_rilievo=1400, usura=(argento, 1.0)),
        "cartone": procedurale("cartone", (0.50, 0.42, 0.27), ruvidita=0.85, varia_colore=0.18, varia_ruvidita=0.05, rilievo=0.5, scala_rilievo=1600),
        "cartone_scuro": procedurale("cartone_scuro", (0.13, 0.09, 0.05), ruvidita=0.8, varia_colore=0.25, varia_ruvidita=0.05, rilievo=0.5, scala_rilievo=1600),
    }


# --- UV -----------------------------------------------------------------------------------------
def _e_tessera(ogg, poligono_o_faccia):
    nome = ogg.data.materials[poligono_o_faccia.material_index].name
    return nome == "tessera"


def srotola(oggetti):
    """Isole UV non sovrapposte di tutti gli oggetti dati, sullo stesso atlante e con la stessa densità
    di pixel. Le facce con il materiale `tessera` non si toccano."""
    for ogg in oggetti:
        if not ogg.data.uv_layers:
            ogg.data.uv_layers.new(name="UVMap")
    bpy.ops.object.select_all(action="DESELECT")
    for ogg in oggetti:
        ogg.select_set(True)
    bpy.context.view_layer.objects.active = oggetti[0]
    bpy.ops.object.mode_set(mode="EDIT")
    for ogg in oggetti:
        bm = bmesh.from_edit_mesh(ogg.data)
        for faccia in bm.faces:
            faccia.select_set(not _e_tessera(ogg, faccia))
        bm.select_flush_mode()
        bmesh.update_edit_mesh(ogg.data)
    bpy.ops.uv.smart_project(
        angle_limit=math.radians(66),
        island_margin=MARGINE / LATO,
        area_weight=0.0,
        correct_aspect=True,
        scale_to_bounds=False,
    )
    bpy.ops.object.mode_set(mode="OBJECT")


def densita(ogg):
    """Area UV su area 3D delle facce non tessera: deve essere simile fra una mesh e l'altra."""
    uv = ogg.data.uv_layers.active.data
    a_uv = a_3d = 0.0
    for p in ogg.data.polygons:
        if _e_tessera(ogg, p):
            continue
        punti = [uv[i].uv for i in p.loop_indices]
        area = 0.0
        for i in range(len(punti)):
            x1, y1 = punti[i]
            x2, y2 = punti[(i + 1) % len(punti)]
            area += x1 * y2 - x2 * y1
        a_uv += abs(area) / 2
        a_3d += p.area
    return a_uv / a_3d if a_3d else 0.0


# --- Cottura ------------------------------------------------------------------------------------
def _immagine(nome, colore, spazio, lato=LATO):
    immagine = bpy.data.images.new(nome, lato, lato, alpha=False, float_buffer=False)
    immagine.generated_color = colore
    immagine.colorspace_settings.name = spazio
    return immagine


def _prepara_materiali(oggetti, procedurali):
    """Sostituisce, nelle mesh degli oggetti, i materiali piani con quelli procedurali. Le facce
    `tessera` prendono un materiale di scarto: Cycles vuole un'immagine in ogni materiale, e le loro UV
    stanno nello spazio dell'atlante dei glifi, non in questo."""
    scarto = bpy.data.materials.new("scarto")
    scarto.use_nodes = True
    originali = {}
    for ogg in oggetti:
        dati = ogg.data
        originali[dati.name] = [m for m in dati.materials]
        for i, mat in enumerate(originali[dati.name]):
            ricetta = RICETTE.get((dati.name, mat.name))
            if mat.name == "tessera":
                dati.materials[i] = scarto
            elif ricetta is not None:
                dati.materials[i] = procedurali[ricetta]
            else:
                raise RuntimeError(f"nessuna ricetta per {dati.name} / {mat.name}")
    return scarto, originali


def _bersaglio(materiali, immagine):
    """Mette in ogni materiale un nodo immagine attivo che punta a `immagine`; il materiale di scarto
    punta a un'immagine sua, così le sue UV (quelle dei glifi) non sporcano l'atlante."""
    for mat in materiali:
        nodo = next((n for n in mat.node_tree.nodes if n.name == "bersaglio"), None)
        if nodo is None:
            nodo = mat.node_tree.nodes.new("ShaderNodeTexImage")
            nodo.name = "bersaglio"
        if mat.name == "scarto":
            nodo.image = bpy.data.images.get("cottura_scarto") or _immagine("cottura_scarto", (0, 0, 0, 1), "Non-Color", 64)
        else:
            nodo.image = immagine
        mat.node_tree.nodes.active = nodo
        nodo.select = True


def _emissione(mat, ingresso):
    """Collega all'uscita del materiale un'emissione col valore dell'ingresso del Principled."""
    albero = mat.node_tree
    bsdf = next(n for n in albero.nodes if n.type == "BSDF_PRINCIPLED")
    uscita = next(n for n in albero.nodes if n.type == "OUTPUT_MATERIAL")
    emissione = albero.nodes.new("ShaderNodeEmission")
    presa = bsdf.inputs[ingresso]
    if presa.is_linked:
        albero.links.new(presa.links[0].from_socket, emissione.inputs["Color"])
    else:
        v = presa.default_value
        emissione.inputs["Color"].default_value = (*tuple(v)[:3], 1.0) if hasattr(v, "__len__") else (v, v, v, 1.0)
    albero.links.new(emissione.outputs["Emission"], uscita.inputs["Surface"])
    return bsdf, uscita, emissione


def _ripristina(albero, bsdf, uscita, emissione):
    albero.nodes.remove(emissione)
    albero.links.new(bsdf.outputs["BSDF"], uscita.inputs["Surface"])


def _cuoci(tipo, oggetti, immagine, materiali, **impostazioni):
    _bersaglio(materiali, immagine)
    bake = bpy.context.scene.render.bake
    bake.target = "IMAGE_TEXTURES"
    bake.use_selected_to_active = False
    bake.use_clear = False
    bake.margin = MARGINE
    bake.margin_type = "EXTEND"
    for chiave, valore in impostazioni.items():
        setattr(bake, chiave, valore)
    bpy.ops.object.select_all(action="DESELECT")
    for ogg in oggetti:
        ogg.select_set(True)
    bpy.context.view_layer.objects.active = oggetti[0]
    bpy.ops.object.bake(type=tipo)


def _cuoci_emissione(ingresso, oggetti, immagine, procedurali):
    salvati = [(mat.node_tree,) + _emissione(mat, ingresso) for mat in procedurali]
    try:
        _cuoci("EMIT", oggetti, immagine, procedurali + [bpy.data.materials["scarto"]])
    finally:
        for albero, bsdf, uscita, emissione in salvati:
            _ripristina(albero, bsdf, uscita, emissione)


def cuoci(oggetti_interno):
    """Cuoce l'atlante dell'interno e dà (colore, orm, normale, statistiche)."""
    scena = bpy.context.scene
    scena.render.engine = "CYCLES"
    scena.cycles.device = "CPU"
    scena.cycles.samples = CAMPIONI
    scena.cycles.use_denoising = False
    scena.cycles.use_adaptive_sampling = False

    rapp = [bpy.data.objects[nome] for nome in RAPPRESENTANTI]
    srotola(rapp)

    procedurali = materiali_procedurali()
    scarto, originali = _prepara_materiali(rapp, procedurali)
    usati = [m for m in procedurali.values()]

    colore = _immagine("interno_colore", VUOTO["colore"], "sRGB")
    normale = _immagine("interno_normale", VUOTO["normale"], "Non-Color")
    grigi = {
        "ao": _immagine("cottura_ao", (1.0, 1.0, 1.0, 1.0), "Non-Color"),
        "ruvidita": _immagine("cottura_ruvidita", (0.5, 0.5, 0.5, 1.0), "Non-Color"),
        "metallo": _immagine("cottura_metallo", (0.0, 0.0, 0.0, 1.0), "Non-Color"),
    }

    # Le emissioni e la normale non dipendono dalla scena: si cuociono con tutto visibile.
    _cuoci_emissione("Base Color", rapp, colore, usati)
    _cuoci_emissione("Roughness", rapp, grigi["ruvidita"], usati)
    _cuoci_emissione("Metallic", rapp, grigi["metallo"], usati)
    scena.render.bake.normal_space = "TANGENT"
    _cuoci("NORMAL", rapp, normale, usati + [scarto])

    # L'occlusione si cuoce un pezzo alla volta, da solo: dà le ombre dentro il pezzo (fra i denti,
    # nei fori, negli smussi) e resta giusta anche a macchina smontata. Cuocerli montati darebbe nero
    # alle facce che si toccano e che lo smontaggio scopre (la rotella sull'anello, il cricchetto nel
    # nucleo).
    mondo = scena.world or bpy.data.worlds.new("mondo_cottura")
    scena.world = mondo
    mondo.light_settings.distance = DISTANZA_AO
    scena.cycles.samples = CAMPIONI_AO
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    for ogg in rapp:
        for altro in meshes:
            altro.hide_render = altro is not ogg
        _cuoci("AO", [ogg], grigi["ao"], usati + [scarto])
    for ogg in meshes:
        ogg.hide_render = False

    orm = _componi_orm(grigi)
    stat = {
        "densita": {o.data.name: densita(o) for o in rapp},
        "originali": originali,
    }
    return colore, orm, normale, stat


def _componi_orm(grigi):
    """Un'immagine sola con occlusione, ruvidità e metallicità nei canali R, G, B."""
    n = LATO * LATO * 4
    canali = {}
    for nome, immagine in grigi.items():
        buffer = np.empty(n, dtype=np.float32)
        immagine.pixels.foreach_get(buffer)
        canali[nome] = buffer.reshape(-1, 4)[:, 0]
    orm = _immagine("interno_orm", (1.0, 1.0, 1.0, 1.0), "Non-Color")
    pixel = np.ones((LATO * LATO, 4), dtype=np.float32)
    pixel[:, 0], pixel[:, 1], pixel[:, 2] = canali["ao"], canali["ruvidita"], canali["metallo"]
    orm.pixels.foreach_set(pixel.reshape(-1))
    orm.update()
    for immagine in grigi.values():
        bpy.data.images.remove(immagine)
    return orm


# --- Il materiale finale ------------------------------------------------------------------------
def _gruppo_gltf():
    """Il gruppo «glTF Material Output», dove l'esportatore cerca l'occlusione."""
    try:
        from io_scene_gltf2.blender.com.material_helpers import create_settings_group, get_gltf_node_name

        return create_settings_group(get_gltf_node_name())
    except ImportError:
        gruppo = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        gruppo.interface.new_socket("Occlusion", socket_type="NodeSocketFloat")
        return gruppo


def materiale_interno(colore, orm, normale):
    """Il materiale `interno`: colore, ORM e normal map. L'occlusione va al gruppo glTF."""
    mat = bpy.data.materials.new("interno")
    mat.use_nodes = True
    albero = mat.node_tree
    bsdf = next(n for n in albero.nodes if n.type == "BSDF_PRINCIPLED")
    tex_colore = _n(albero, "ShaderNodeTexImage", image=colore)
    tex_orm = _n(albero, "ShaderNodeTexImage", image=orm)
    tex_normale = _n(albero, "ShaderNodeTexImage", image=normale)
    separa = _n(albero, "ShaderNodeSeparateColor")
    mappa = _n(albero, "ShaderNodeNormalMap")
    mappa.space = "TANGENT"
    gltf = _n(albero, "ShaderNodeGroup")
    gltf.node_tree = _gruppo_gltf()
    albero.links.new(tex_colore.outputs["Color"], bsdf.inputs["Base Color"])
    albero.links.new(tex_orm.outputs["Color"], separa.inputs["Color"])
    albero.links.new(separa.outputs["Red"], gltf.inputs["Occlusion"])
    albero.links.new(separa.outputs["Green"], bsdf.inputs["Roughness"])
    albero.links.new(separa.outputs["Blue"], bsdf.inputs["Metallic"])
    albero.links.new(tex_normale.outputs["Color"], mappa.inputs["Color"])
    albero.links.new(mappa.outputs["Normal"], bsdf.inputs["Normal"])
    mat.diffuse_color = (0.3, 0.3, 0.3, 1.0)
    return mat


def assegna(oggetti, interno, originali):
    """Mette `interno` al posto dei materiali procedurali e di scarto, e lascia `tessera` dov'era. Le
    facce con lo stesso materiale finiscono in un'unica fessura."""
    tessera = bpy.data.materials["tessera"]
    for ogg in oggetti:
        dati = ogg.data
        con_tessera = any(m.name == "tessera" for m in originali[dati.name])
        indici = {}
        if con_tessera:
            indici = {i: (1 if m.name == "tessera" else 0) for i, m in enumerate(originali[dati.name])}
        else:
            indici = {i: 0 for i in range(len(originali[dati.name]))}
        nuovi = [indici[p.material_index] for p in dati.polygons]
        dati.materials.clear()  # svuotare le fessure riporta a 0 gli indici delle facce: si rimettono dopo
        dati.materials.append(interno)
        if con_tessera:
            dati.materials.append(tessera)
        dati.polygons.foreach_set("material_index", nuovi)
        dati.update()


def toglie_procedurali():
    for mat in [m for m in bpy.data.materials if m.name.startswith("proc_") or m.name.startswith("scarto")]:
        bpy.data.materials.remove(mat)
