"""Rende i confronti dell'interno con l'esterno di ASHISH (fase 4m), dal .glb grezzo esportato.

Da terminale, con Blender in background:

    blender -b --factory-startup --python-exit-code 1 -P scripts/blender/confronto.py -- <cartella>

Importa scripts/blender/sorgenti/enigma-i-grezzo.glb, cioè il file com'è uscito dall'esportatore con
le sue texture, e rende un'immagine per inquadratura, tutte con la stessa luce. Ogni inquadratura dice
a quale fotogramma della clip `smontaggio` (24 per fase) sta la macchina, che pezzi inquadrare e da
quale direzione; la piastra di ASHISH (`coperchio_interno`) e il resto dell'esterno restano in vista.
"""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

QUI = Path(__file__).resolve().parent
GLB = QUI / "sorgenti" / "enigma-i-grezzo.glb"

# nome del file, fotogramma, pezzi da inquadrare, direzione dall'oggetto all'occhio, distanza in metri,
# nodi da nascondere (quelli che coprono i pezzi: i nottolini stanno sotto la piastra della cassa)
INQUADRATURE = [
    ("rotore-aperto", 72, ["rotore_centrale"], (0.55, -0.80, 0.45), 0.34, []),
    ("riflettore", 72, ["riflettore", "rotore_sinistro"], (-0.45, -0.75, 0.50), 0.36, []),
    ("nottolini", 96, ["nottolino_sinistro", "nottolino_centrale", "nottolino_destro"], (0.75, -0.45, 0.40), 0.22, ["cassa", "tastiera", "coperchio_legno", "tasto_", "lampada_"]),
    ("batteria", 96, ["batteria", "ruota_ingresso"], (0.80, -0.55, 0.45), 0.34, []),
    ("rotori-estratti", 48, ["rotore_destro", "rotore_centrale", "rotore_sinistro", "riflettore"], (0.45, -0.85, 0.55), 0.62, []),
]


def importa():
    for ogg in list(bpy.data.objects):
        bpy.data.objects.remove(ogg)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    # glTF porta i nodi vuoti: i nomi sono quelli della convenzione.


def scatola(nomi):
    """Centro e raggio dei pezzi (e dei loro discendenti) al fotogramma corrente."""
    punti = []
    pila = [bpy.data.objects[n] for n in nomi if n in bpy.data.objects]
    while pila:
        ogg = pila.pop()
        pila.extend(ogg.children)
        if ogg.type == "MESH":
            punti += [ogg.matrix_world @ Vector(v) for v in ogg.bound_box]
    minimo = Vector((min(p[i] for p in punti) for i in range(3)))
    massimo = Vector((max(p[i] for p in punti) for i in range(3)))
    return (minimo + massimo) / 2, (massimo - minimo).length / 2


def scena_di_resa():
    scena = bpy.context.scene
    camera = bpy.data.objects.new("camera_confronto", bpy.data.cameras.new("camera_confronto"))
    camera.data.lens = 50
    scena.collection.objects.link(camera)
    scena.camera = camera
    sole = bpy.data.objects.new("sole_confronto", bpy.data.lights.new("sole_confronto", "SUN"))
    sole.data.energy = 3.0
    sole.data.angle = math.radians(10)
    scena.collection.objects.link(sole)
    if scena.world is None:
        scena.world = bpy.data.worlds.new("mondo")
    if scena.world.node_tree is None:
        scena.world.use_nodes = True
    sfondo = next(n for n in scena.world.node_tree.nodes if n.type == "BACKGROUND")
    sfondo.inputs["Color"].default_value = (0.8, 0.8, 0.8, 1.0)
    sfondo.inputs["Strength"].default_value = 0.6
    try:
        scena.render.engine = "BLENDER_EEVEE"
    except TypeError as errore:
        print(f"EEVEE non disponibile, uso Workbench: {errore}")
        scena.render.engine = "BLENDER_WORKBENCH"
    scena.render.resolution_x, scena.render.resolution_y = 1100, 700
    scena.render.film_transparent = False
    scena.render.image_settings.file_format = "PNG"
    scena.render.image_settings.color_mode = "RGB"
    return camera, sole


def guarda(ogg, bersaglio):
    ogg.rotation_euler = (Vector(bersaglio) - ogg.location).to_track_quat("-Z", "Y").to_euler()


def main():
    cartella = Path(sys.argv[sys.argv.index("--") + 1])
    cartella.mkdir(parents=True, exist_ok=True)
    importa()
    camera, sole = scena_di_resa()
    scena = bpy.context.scene
    for nome, fotogramma, pezzi, direzione, distanza, nascosti in INQUADRATURE:
        scena.frame_set(fotogramma)
        bpy.context.view_layer.update()
        centro, _ = scatola(pezzi)
        versore = Vector(direzione).normalized()
        camera.location = centro + versore * distanza
        guarda(camera, centro)
        sole.location = centro + Vector((-0.3, -0.4, 0.8))
        guarda(sole, centro)
        da_nascondere = [o for o in bpy.data.objects if any(o.name.startswith(n) for n in nascosti)]
        for o in da_nascondere:
            o.hide_render = True
        scena.render.filepath = str(cartella / nome)
        bpy.ops.render.render(write_still=True)
        for o in da_nascondere:
            o.hide_render = False
        print(f"reso {nome} al fotogramma {fotogramma}")


if __name__ == "__main__":
    main()
