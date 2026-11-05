"""La cassa con il vano dei rotori, il coperchio interno, il pannello a spine e il suo sportello."""

import comune as c

X_ROTORI = (-0.030, 0.0, 0.030)  # sinistro, centrale, destro: le finestrelle stanno sopra di loro
MEZZA_FINESTRA_X = 0.013
MEZZA_FINESTRA_Y = 0.030


def _cassa(bm):
    w, s = c.LARGHEZZA / 2, c.SPESSORE
    legno, vernice = 0, 1
    c.cuboide(bm, (-w, c.FRONTE, 0), (w, c.RETRO, s), legno)  # fondo
    c.cuboide(bm, (-w, c.FRONTE, s), (w, c.FRONTE + s, c.ALTEZZA), legno)  # parete davanti
    c.cuboide(bm, (-w, c.RETRO - s, s), (w, c.RETRO, c.ALTEZZA), legno)  # parete dietro
    c.cuboide(bm, (-w, c.FRONTE + s, s), (-w + s, c.RETRO - s, c.ALTEZZA), legno)  # sinistra
    c.cuboide(bm, (w - s, c.FRONTE + s, s), (w, c.RETRO - s, c.ALTEZZA), legno)  # destra
    # Il piano di tasti e lampade, e la paratia che chiude il vano dei rotori sul davanti.
    c.cuboide(bm, (-w + s, c.FRONTE + s, c.Z_PIANO - 0.004), (w - s, c.Y_VANO, c.Z_PIANO), vernice)
    c.cuboide(bm, (-w + s, c.Y_VANO - 0.003, s), (w - s, c.Y_VANO, c.Z_PIANO - 0.004), vernice)


def _coperchio(bm):
    """La lamiera sopra il vano, con tre finestrelle sopra i rotori.

    Le coordinate sono relative all'origine, sulla cerniera lungo lo spigolo posteriore.
    """
    w = c.LARGHEZZA / 2 - c.SPESSORE
    dietro = c.RETRO - c.SPESSORE
    y0, y1 = c.Y_VANO - dietro, 0.0
    ya, yb = c.Y_ASSE - MEZZA_FINESTRA_Y - dietro, c.Y_ASSE + MEZZA_FINESTRA_Y - dietro
    z0, z1 = -0.003, 0.0
    c.cuboide(bm, (-w, y0, z0), (w, ya, z1))
    c.cuboide(bm, (-w, yb, z0), (w, y1, z1))
    bordi = [-w]
    for x in X_ROTORI:
        bordi += [x - MEZZA_FINESTRA_X, x + MEZZA_FINESTRA_X]
    bordi.append(w)
    for sinistra, destra in zip(bordi[0::2], bordi[1::2]):
        c.cuboide(bm, (sinistra, ya, z0), (destra, yb, z1))


def costruisci(m):
    c.oggetto("cassa", c.mesh("cassa", _cassa, [m["legno"], m["vernice"]]))
    c.oggetto(
        "coperchio_interno",
        c.mesh("coperchio_interno", _coperchio, [m["metallo_scuro"]]),
        (0.0, c.RETRO - c.SPESSORE, c.ALTEZZA),
        fase=1,
    )
    c.oggetto(
        "pannello_spine",
        c.mesh(
            "pannello_spine",
            lambda bm: c.cuboide(bm, (-0.120, -0.002, -0.030), (0.120, 0.002, 0.030)),
            [m["vernice"]],
        ),
        (0.0, c.FRONTE - 0.002, 0.050),
    )
    # Lo sportello ha l'origine sulla cerniera, lungo lo spigolo inferiore: si apre ruotando su X.
    c.oggetto(
        "sportello_spine",
        c.mesh(
            "sportello_spine",
            lambda bm: c.cuboide(bm, (-0.130, -0.002, 0.0), (0.130, 0.002, 0.080)),
            [m["legno"]],
        ),
        (0.0, c.FRONTE - 0.007, 0.012),
        fase=1,
    )
