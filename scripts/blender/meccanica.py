"""La meccanica sotto i tasti: la leva che muove i nottolini, la batteria e la sua ancora.

Le ancore di tasti, prese e lampade le mette esterno.py, sulla geometria di ASHISH (convenzione,
«Ancore»).
"""

import math

import bmesh
from mathutils import Matrix

import comune as c

# La leva: un asse su X con l'origine sul perno, una lastra sotto i tasti che i gambi premono, e due
# bracci che la collegano al perno dei nottolini. Il codice la ruota su X.
PERNO_LEVA = (0.0, -0.030, 0.085)
X_BRACCI = 0.120

# La batteria da 4,5 volt (la piatta): 62 × 22 × 67 mm, nel vano a destra della ruota d'ingresso.
BATTERIA = (0.108, 0.075, c.SPESSORE)  # centro della base
DIMENSIONI_BATTERIA = (0.022, 0.062, 0.067)


def _leva(bm):
    c.cilindro(bm, (0, 0, 0), 0.003, 0.250, "X", 10, 0)  # l'asse
    # La lastra sotto i gambi: dalla fila davanti (y -0,146) alla fila di dietro (y -0,088).
    c.cuboide(bm, (-0.115, -0.116, -0.002), (0.115, -0.058, 0.001), 0)
    for lato in (-1, 1):
        x0, x1 = sorted((lato * X_BRACCI, lato * (X_BRACCI - 0.003)))
        c.cuboide(bm, (x0, -0.116, -0.002), (x1, 0.0, 0.003), 0)  # il braccio verso la lastra
        # Il tirante che scende al perno dei nottolini: dal perno della leva a quello dei nottolini.
        dy = c.Y_PERNO - PERNO_LEVA[1]
        dz = c.Z_PERNO - PERNO_LEVA[2]
        lunghezza = math.hypot(dy, dz)
        v = c.cuboide(bm, (x0, 0.0, -0.0015), (x1, lunghezza, 0.0015), 0)
        bmesh.ops.transform(bm, matrix=Matrix.Rotation(math.atan2(dz, dy), 4, "X"), verts=v)


def _batteria(bm):
    lx, ly, lz = DIMENSIONI_BATTERIA
    c.cuboide(bm, (-lx / 2, -ly / 2, 0.0), (lx / 2, ly / 2, lz), 0)
    c.cuboide(bm, (-lx / 2 - 0.0003, -ly / 2 + 0.010, 0.012), (lx / 2 + 0.0003, ly / 2 - 0.010, 0.040), 1)  # l'etichetta
    for y in (-0.012, 0.012):  # i due poli
        c.cilindro(bm, (0.0, y, lz + 0.0025), 0.0035, 0.005, "Z", 8, 2)


def costruisci(m):
    c.oggetto("leva_tasti", c.mesh("leva_tasti", _leva, [m["metallo"]]), PERNO_LEVA)
    x, y, z = BATTERIA
    c.oggetto(
        "batteria",
        c.mesh("batteria", _batteria, [m["vernice"], m["batteria"], m["ottone"]]),
        (x, y, z),
        fase=4,
    )

    # L'ancora della batteria, sul polo positivo.
    c.oggetto("ancora_batteria", None, (x, y + 0.012, z + DIMENSIONI_BATTERIA[2] + 0.005))
