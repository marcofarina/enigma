"""Ricostruisce il modello dell'Enigma I da una scena vuota, lo esporta in glTF e ne fa l'anteprima.

Da terminale, con Blender in background:   pnpm modello
Dall'MCP di Blender, nella sessione aperta:
    exec(open(P).read(), {"__file__": P, "__name__": "__main__"})
con P il percorso assoluto di questo file. Con un altro __name__ definisce le funzioni e non esegue
nulla, così si può chiamare costruisci() da solo e guardare la scena. Attenzione: costruisci() parte
da comune.svuota(), che toglie dal file tutti gli oggetti, i materiali e le immagini, anche quelli
delle altre scene.

L'esterno viene dal modello di ASHISH (esterno.py), che sta fuori da git: vedi sorgenti.md. Blender
esporta un .glb grezzo in sorgenti/; `pnpm modello` lo comprime poi con meshopt
(scripts/comprimi-modello.ts) e lo scrive in public/modelli/.

Gli script sono la fonte del modello: il .blend non va in git, e una modifica fatta a mano nella
GUI va riportata qui.
"""

import importlib
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent.parent
CARTELLA = RADICE / "public" / "modelli"
GLB = QUI / "sorgenti" / "enigma-i-grezzo.glb"  # lo comprime scripts/comprimi-modello.ts
ANTEPRIMA = CARTELLA / "enigma-i-anteprima"  # l'estensione la aggiunge Blender

if str(QUI) not in sys.path:
    sys.path.insert(0, str(QUI))

import atlante  # noqa: E402
import comune  # noqa: E402
import esterno  # noqa: E402
import meccanica  # noqa: E402
import rotori  # noqa: E402
import smontaggio  # noqa: E402

# Nella sessione aperta dell'MCP i moduli restano importati fra un'esecuzione e l'altra: si
# ricaricano, prima comune e poi i pezzi che lo usano. Prima l'interno, poi l'esterno, che mette il
# perno dei nottolini nella cassa e sposta l'interno sotto le finestrelle.
importlib.reload(comune)
importlib.reload(atlante)
PEZZI = [importlib.reload(modulo) for modulo in (rotori, meccanica)]
importlib.reload(esterno)
importlib.reload(smontaggio)
ANTEPRIME = QUI / "anteprime"  # un'immagine per fase dello smontaggio; non va in git


def costruisci():
    comune.svuota()
    immagine = atlante.genera(bpy.app.tempdir or str(RADICE))
    mats = comune.materiali(immagine)
    for pezzo in PEZZI:
        pezzo.costruisci(mats)
    esterno.costruisci(mats)
    esterno.allinea_interno()
    bpy.context.view_layer.update()
    smontaggio.costruisci()
    problemi = smontaggio.sovrapposizioni()
    if problemi:
        raise RuntimeError(f"a smontaggio finito si sovrappongono: {problemi}")


def esporta():
    """Esporta tutta la scena, prima che ci siano la camera e la luce dell'anteprima.

    La scena è sul fotogramma 0, quindi i nodi escono con la macchina chiusa. Le tracce di `location`
    diventano un'unica animazione, `smontaggio`, col tempo della scena (24 fotogrammi al secondo).
    """
    bpy.context.scene.frame_set(0)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB),
        export_format="GLB",
        export_yup=True,
        export_extras=True,
        export_apply=False,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
        # Texture in WebP (D23): le immagini di ASHISH, già ridotte a 2048 px, e l'atlante.
        export_image_format="WEBP",
        export_image_quality=85,
        export_animations=True,
        export_animation_mode="SCENE",
        export_anim_scene_split_object=False,
        export_frame_range=False,
    )
    print(f"esportato {GLB} ({GLB.stat().st_size} byte)")


def _guarda(ogg, bersaglio):
    direzione = Vector(bersaglio) - ogg.location
    ogg.rotation_euler = direzione.to_track_quat("-Z", "Y").to_euler()


def anteprima():
    """Rende l'immagine statica della pagina 3D: 1280 × 720, sfondo trasparente."""
    scena = bpy.context.scene
    bersaglio = (0.0, 0.0, 0.055)

    camera = bpy.data.objects.new("camera_anteprima", bpy.data.cameras.new("camera_anteprima"))
    camera.data.lens = 50
    camera.location = (0.52, -0.80, 0.60)
    _guarda(camera, bersaglio)
    scena.collection.objects.link(camera)
    scena.camera = camera

    sole = bpy.data.objects.new("sole_anteprima", bpy.data.lights.new("sole_anteprima", "SUN"))
    sole.data.energy = 3.0
    sole.data.angle = math.radians(10)
    sole.location = (-0.3, -0.4, 0.8)
    _guarda(sole, bersaglio)
    scena.collection.objects.link(sole)

    if scena.world is None:
        scena.world = bpy.data.worlds.new("mondo")
    if scena.world.node_tree is None:  # use_nodes esce in Blender 6: lo si tocca solo se serve
        scena.world.use_nodes = True
    sfondo = next(n for n in scena.world.node_tree.nodes if n.type == "BACKGROUND")
    sfondo.inputs["Color"].default_value = (0.8, 0.8, 0.8, 1.0)
    sfondo.inputs["Strength"].default_value = 0.6

    try:
        scena.render.engine = "BLENDER_EEVEE"
    except TypeError as errore:
        print(f"EEVEE non disponibile, uso Workbench: {errore}")
        scena.render.engine = "BLENDER_WORKBENCH"
    scena.render.resolution_x, scena.render.resolution_y = 1280, 720
    scena.render.resolution_percentage = 100
    scena.render.film_transparent = True
    impostazioni = scena.render.image_settings
    formati = [i.identifier for i in impostazioni.bl_rna.properties["file_format"].enum_items]
    impostazioni.file_format = "WEBP" if "WEBP" in formati else "PNG"
    impostazioni.color_mode = "RGBA"
    if impostazioni.file_format == "WEBP":
        impostazioni.quality = 85
    scena.render.use_file_extension = True
    scena.render.filepath = str(ANTEPRIMA)
    bpy.ops.render.render(write_still=True)
    print(f"anteprima in {ANTEPRIMA}.{impostazioni.file_format.lower()}")


def anteprime_fasi():
    """Rende un'immagine per fase dello smontaggio in anteprime/: fase-0.png è la macchina chiusa,
    fase-1.png … fase-4.png la fine di ciascuna fase. Servono a guardare il risultato prima di
    esportare; si chiama dopo anteprima(), che mette camera e luce."""
    scena = bpy.context.scene
    camera = scena.camera
    bersaglio = (0.0, 0.0, 0.13)
    camera.location = (0.62, -1.00, 0.72)
    _guarda(camera, bersaglio)
    scena.render.resolution_x, scena.render.resolution_y = 960, 540
    scena.render.film_transparent = False
    scena.render.image_settings.file_format = "PNG"
    scena.render.image_settings.color_mode = "RGB"
    ANTEPRIME.mkdir(exist_ok=True)
    for fase in range(5):
        scena.frame_set(fase * smontaggio.FOTOGRAMMI_FASE)
        scena.render.filepath = str(ANTEPRIME / f"fase-{fase}")
        bpy.ops.render.render(write_still=True)
    scena.frame_set(0)
    print(f"anteprime delle fasi in {ANTEPRIME}")


if __name__ == "__main__":
    costruisci()
    esporta()
    anteprima()
    anteprime_fasi()
