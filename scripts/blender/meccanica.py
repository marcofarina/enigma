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
    """La batteria piatta da 4,5 V (tipo 3R12): un mantello di carta con la cima chiusa da una pasta
    nera e due lamelle d'ottone piegate sui lati corti. Misure da Radiomuseum (62 × 68 × 22 mm,
    Daimon, Wehrmacht); la pasta nera e le lamelle sono un'ipotesi, nessuna fonte consultata le
    descrive. Le fasce del mantello le disegna il materiale (cottura.py), non la geometria.
    Fessure: 0 carta, 1 pasta, 2 ottone."""
    lx, ly, lz = DIMENSIONI_BATTERIA
    c.cuboide(bm, (-lx / 2, -ly / 2, 0.0), (lx / 2, ly / 2, lz), 0)
    # La pasta di chiusura, a filo del bordo di carta e un po' in rilievo.
    margine = 0.0015
    c.cuboide(bm, (-lx / 2 + margine, -ly / 2 + margine, lz - 0.002), (lx / 2 - margine, ly / 2 - margine, lz + 0.0012), 1)
    spessore, mezza_larghezza, quota = 0.0006, 0.0045, lz + 0.0012
    for y, verso in ((0.012, 1), (-0.012, -1)):  # il polo positivo piega sul lato +X, l'altro su −X
        x_bordo = verso * lx / 2
        x_punta = -verso * 0.005
        x0, x1 = sorted((x_punta, x_bordo + verso * spessore))
        c.cuboide(bm, (x0, y - mezza_larghezza, quota), (x1, y + mezza_larghezza, quota + spessore), 2)
        v0, v1 = sorted((x_bordo, x_bordo + verso * spessore))
        c.cuboide(bm, (v0, y - mezza_larghezza, lz - 0.007), (v1, y + mezza_larghezza, quota + spessore), 2)


def costruisci(m):
    c.oggetto("leva_tasti", c.mesh("leva_tasti", _leva, [m["metallo"]]), PERNO_LEVA)
    x, y, z = BATTERIA
    c.oggetto(
        "batteria",
        c.mesh("batteria", _batteria, [m["batteria"], m["vernice"], m["ottone"]]),
        (x, y, z),
        fase=4,
    )

    # L'ancora della batteria, sul polo positivo.
    c.oggetto("ancora_batteria", None, (x, y + 0.012, z + DIMENSIONI_BATTERIA[2] + 0.005))
