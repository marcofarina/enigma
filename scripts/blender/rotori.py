"""Il gruppo dei rotori: asse, tre rotori con il loro anello, ruota d'ingresso, riflettore, nottolini.

Da sinistra a destra lungo X: riflettore, rotore sinistro, centrale, destro, ruota d'ingresso.
Ogni rotore è un vuoto con l'origine sull'asse: il codice lo gira con la sola rotazione su X.
"""

from mathutils import Vector

import comune as c

ROTORI = {"rotore_sinistro": -0.030, "rotore_centrale": 0.0, "rotore_destro": 0.030}
LARGHEZZA_ANELLO = 0.024
X_RIFLETTORE = -0.065
X_INGRESSO = 0.065
RAGGIO_FISSI = 0.045  # riflettore e ruota d'ingresso
PROFONDITA_TACCA = 0.006

# Ogni nottolino sta nello spazio a destra del rotore che spinge.
NOTTOLINI = {"nottolino_sinistro": -0.015, "nottolino_centrale": 0.015, "nottolino_destro": 0.0485}
Y_PERNO = 0.012
Z_PERNO = 0.030


def _anello(bm):
    """Un cilindro a 26 lati, uno per lettera, con la tacca: un intaglio a V in cima."""
    verts = c.cilindro(bm, (0, 0, 0), c.RAGGIO_ROTORE, LARGHEZZA_ANELLO, asse="X")
    cima = max(verts, key=lambda v: (round(v.co.z, 6), v.co.y)).co.copy()
    for v in verts:
        if abs(v.co.y - cima.y) < 1e-6 and abs(v.co.z - cima.z) < 1e-6:
            radiale = Vector((0.0, v.co.y, v.co.z))
            v.co -= radiale.normalized() * PROFONDITA_TACCA


def _nottolino(bm):
    """Una leva che sale dal perno, sull'origine, verso il rotore."""
    c.cuboide(bm, (-0.002, -0.003, 0.0), (0.002, 0.003, 0.036))


def costruisci(m):
    asse = (0.0, c.Y_ASSE, c.Z_ASSE)
    c.oggetto(
        "asse_rotori",
        c.mesh("asse_rotori", lambda bm: c.cilindro(bm, (0, 0, 0), 0.004, 0.110, "X", 12), [m["metallo"]]),
        asse,
        fase=2,
    )
    anello = c.mesh("anello", _anello, [m["metallo"]])
    for nome, x in ROTORI.items():
        centro = (x, c.Y_ASSE, c.Z_ASSE)
        rotore = c.oggetto(nome, None, centro, fase=2, raggio_contatti=c.RAGGIO_CONTATTI)
        c.oggetto(f"{nome}_anello", anello, centro, genitore=rotore, fase=3)

    c.oggetto(
        "riflettore",
        c.mesh(
            "riflettore",
            lambda bm: c.cilindro(bm, (0, 0, 0), RAGGIO_FISSI, 0.022, "X"),
            [m["metallo_scuro"]],
        ),
        (X_RIFLETTORE, c.Y_ASSE, c.Z_ASSE),
        fase=2,
        raggio_contatti=c.RAGGIO_CONTATTI,
    )
    c.oggetto(
        "ruota_ingresso",
        c.mesh(
            "ruota_ingresso",
            lambda bm: c.cilindro(bm, (0, 0, 0), RAGGIO_FISSI, 0.020, "X"),
            [m["metallo_scuro"]],
        ),
        (X_INGRESSO, c.Y_ASSE, c.Z_ASSE),
        raggio_contatti=c.RAGGIO_CONTATTI,
    )

    nottolino = c.mesh("nottolino", _nottolino, [m["metallo"]])
    for nome, x in NOTTOLINI.items():
        c.oggetto(nome, nottolino, (x, Y_PERNO, Z_PERNO))
