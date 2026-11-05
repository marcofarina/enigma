"""Le 26 lampade, copie collegate della stessa mesh: il codice le accende cambiando il materiale.

Il vetro ha un solo materiale, `vetro`, con la lettera sulla cella 0 dell'atlante: la pagina lo clona
per ogni lampada, sposta la texture sulla lettera e mette il colore emissivo quando la lampada si
accende. La cornice d'ottone sta nella cassa.
"""

import bmesh
from mathutils import Matrix, Vector

import comune as c

RAGGIO_BASE = 0.0085
RAGGIO_CIMA = 0.0070


def _lampada(bm):
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=20,
        radius1=RAGGIO_BASE,
        radius2=RAGGIO_CIMA,
        depth=0.004,
        matrix=Matrix.Translation(Vector((0, 0, 0.002))),
    )
    c.uv_cerchio(bm, c.faccia_superiore(bm), RAGGIO_CIMA)


def costruisci(m):
    dati = c.mesh("lampada", _lampada, [m["vetro"]])
    for lettera, posizione in sorted(c.posizioni_qwertz(c.Y_FILE_LAMPADE, c.Z_PIANO).items()):
        c.oggetto(f"lampada_{lettera}", dati, posizione)
