"""L'atlante dei glifi: le 26 lettere e i numeri da 01 a 26 in un'unica immagine di 512 × 512 pixel.

Il carattere è Archivo (SIL Open Font License 1.1, copia in src/assets/fonts/archivo/, la stessa che
serve il sito). Blender lo legge dal file .woff2 e lo rende con Workbench: lettere nere su una
tessera crema, come le lettere dei tasti, delle lampade e degli anelli. Nessun testo converte in
mesh: il modello porta solo le UV (disposizione delle celle in comune.py).
"""

import math
from pathlib import Path

import bpy
import bmesh

import comune as c

RADICE = Path(__file__).resolve().parent.parent.parent
CARATTERE = RADICE / "src" / "assets" / "fonts" / "archivo" / "archivo-latin-normal.woff2"
LETTERE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# Colori in sRGB: la tessera di un tasto o di una lampada, e l'inchiostro.
SFONDO = (0.90, 0.86, 0.72)
INCHIOSTRO = (0.03, 0.03, 0.03)
ALTEZZA_LETTERA = 0.44  # altezza delle maiuscole, in celle
LARGHEZZA_MASSIMA = 0.66  # larghezza massima di un glifo, in celle


def _lineare(colore):
    """Da sRGB a lineare: object.color di Workbench passa per la trasformazione di visualizzazione."""
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in colore) + (1.0,)


def _quadrato(nome, lato, colore, z):
    bm = bmesh.new()
    mezzo = lato / 2
    bm.faces.new([bm.verts.new((x, y, z)) for x, y in ((-mezzo, -mezzo), (mezzo, -mezzo), (mezzo, mezzo), (-mezzo, mezzo))])
    dati = bpy.data.meshes.new(nome)
    bm.to_mesh(dati)
    bm.free()
    ogg = bpy.data.objects.new(nome, dati)
    ogg.color = _lineare(colore)
    bpy.context.scene.collection.objects.link(ogg)
    ogg.location = (c.ATLANTE_COLONNE / 2, c.ATLANTE_COLONNE / 2, 0.0)
    return ogg


def _glifo(testo, cella, carattere):
    """Un testo al centro della cella (colonna, riga), con le maiuscole alte ALTEZZA_LETTERA."""
    curva = bpy.data.curves.new(f"glifo_{testo}", "FONT")
    curva.body = testo
    curva.font = carattere
    curva.size = ALTEZZA_LETTERA / 0.70  # le maiuscole di Archivo sono alte circa 0,70 em
    ogg = bpy.data.objects.new(f"glifo_{testo}", curva)
    ogg.color = _lineare(INCHIOSTRO)
    bpy.context.scene.collection.objects.link(ogg)
    bpy.context.view_layer.update()
    larghezza = ogg.dimensions.x
    if larghezza > LARGHEZZA_MASSIMA:
        curva.size *= LARGHEZZA_MASSIMA / larghezza
        bpy.context.view_layer.update()
    # Il centro del riquadro del glifo, misurato sulla geometria valutata, va sul centro della cella.
    ev = ogg.evaluated_get(bpy.context.evaluated_depsgraph_get())
    angoli = [v[:] for v in ev.bound_box]
    cx = (min(a[0] for a in angoli) + max(a[0] for a in angoli)) / 2
    cy = (min(a[1] for a in angoli) + max(a[1] for a in angoli)) / 2
    colonna, riga = cella
    ogg.location = (colonna + 0.5 - cx, c.ATLANTE_COLONNE - (riga + 0.5) - cy, 0.01)


def genera(cartella):
    """Rende l'atlante in cartella/atlante.png e lo restituisce come immagine di Blender.

    Usa la scena corrente (camera, impostazioni di rendering): le toglie prima di tornare, e
    l'anteprima ripristina le sue. Va chiamata prima di creare il modello.
    """
    scena = bpy.context.scene
    carattere = bpy.data.fonts.load(str(CARATTERE))
    oggetti_prima = set(scena.collection.objects)

    _quadrato("atlante_sfondo", c.ATLANTE_COLONNE, SFONDO, 0.0)
    numeri = [f"{i:02d}" for i in range(1, 27)]
    for indice, testo in enumerate([*LETTERE, *numeri]):
        _glifo(testo, (indice % c.ATLANTE_COLONNE, indice // c.ATLANTE_COLONNE), carattere)

    camera = bpy.data.objects.new("atlante_camera", bpy.data.cameras.new("atlante_camera"))
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = c.ATLANTE_COLONNE
    camera.location = (c.ATLANTE_COLONNE / 2, c.ATLANTE_COLONNE / 2, 10.0)
    scena.collection.objects.link(camera)
    scena.camera = camera

    scena.render.engine = "BLENDER_WORKBENCH"
    scena.render.resolution_x = scena.render.resolution_y = c.ATLANTE_LATO
    scena.render.resolution_percentage = 100
    scena.render.film_transparent = False
    scena.render.dither_intensity = 0.0  # il rumore di dithering renderebbe il PNG sei volte più pesante
    scena.view_settings.view_transform = "Standard"
    scena.display.render_aa = "32"
    ombreggiatura = scena.display.shading
    ombreggiatura.light = "FLAT"
    ombreggiatura.color_type = "OBJECT"
    ombreggiatura.show_object_outline = False
    ombreggiatura.show_cavity = False
    ombreggiatura.show_specular_highlight = False
    impostazioni = scena.render.image_settings
    impostazioni.file_format = "PNG"
    impostazioni.color_mode = "RGB"
    impostazioni.color_depth = "8"
    impostazioni.compression = 100
    scena.render.filepath = str(Path(cartella) / "atlante.png")
    scena.render.use_file_extension = False
    bpy.ops.render.render(write_still=True)

    for ogg in set(scena.collection.objects) - oggetti_prima:
        bpy.data.objects.remove(ogg)
    # Nessun pezzo del modello esiste ancora: ciò che non ha più utenti è dell'atlante.
    for raccolta in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.fonts):
        for blocco in list(raccolta):
            if blocco.users == 0:
                raccolta.remove(blocco)
    scena.camera = None
    immagine = bpy.data.images.load(scena.render.filepath)
    immagine.name = "atlante"
    immagine.colorspace_settings.name = "sRGB"
    print(f"atlante in {scena.render.filepath}")
    return immagine
