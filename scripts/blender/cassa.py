"""La cassa con il vano dei rotori, il coperchio interno, il pannello a spine e il suo sportello.

Il piano davanti ai rotori è diviso in due: le lampade stanno su un piano fisso (la cassa), i tasti su
una piastra a sé, che è il nodo `tastiera` e si alza con lui. Sotto la piastra restano la leva e la
batteria, che la fase 4 dello smontaggio scopre.
"""

import comune as c

X_ROTORI = (-0.030, 0.0, 0.030)  # sinistro, centrale, destro: le finestrelle stanno sopra di loro
MEZZA_FINESTRA_X = 0.013
MEZZA_FINESTRA_Y = 0.030

# Il pannello a spine: 26 prese in tre file come i tasti, 9 + 8 + 9, sulla faccia anteriore.
Y_PANNELLO = c.FRONTE - 0.002  # il centro del pannello (spessore 4 mm)
Z_PANNELLO = 0.050
PASSO_PRESE = 0.0235
Z_PRESE = (0.064, 0.050, 0.036)
SPORGENZA_PRESA = 0.001
Y_SPORTELLO = c.FRONTE - 0.008

# Il perno su cui girano i tre nottolini: lo regge la cassa, i nottolini ci stanno sopra.
Y_PERNO = 0.012
Z_PERNO = 0.030


def posizioni_prese():
    """Per ogni lettera, il centro della presa sulla faccia anteriore del pannello, nel mondo."""
    prese = {}
    for fila, z in zip(c.FILE_QWERTZ, Z_PRESE):
        primo = -(len(fila) - 1) / 2 * PASSO_PRESE
        for i, lettera in enumerate(fila):
            prese[lettera.lower()] = (primo + i * PASSO_PRESE, Y_PANNELLO - 0.002 - SPORGENZA_PRESA, z)
    return prese


def _cassa(bm):
    w, s = c.LARGHEZZA / 2, c.SPESSORE
    legno, vernice, ottone = 0, 1, 2
    c.cuboide(bm, (-w, c.FRONTE, 0), (w, c.RETRO, s), legno)  # fondo
    c.cuboide(bm, (-w, c.FRONTE, s), (w, c.FRONTE + s, c.ALTEZZA), legno)  # parete davanti
    c.cuboide(bm, (-w, c.RETRO - s, s), (w, c.RETRO, c.ALTEZZA), legno)  # parete dietro
    c.cuboide(bm, (-w, c.FRONTE + s, s), (-w + s, c.RETRO - s, c.ALTEZZA), legno)  # sinistra
    c.cuboide(bm, (w - s, c.FRONTE + s, s), (w, c.RETRO - s, c.ALTEZZA), legno)  # destra

    # Il piano delle lampade, e la paratia che chiude il vano dei rotori sul davanti.
    c.cuboide(bm, (-w + s, c.Y_PIANO_TASTI, c.Z_PIANO - 0.004), (w - s, c.Y_VANO, c.Z_PIANO), vernice)
    c.cuboide(bm, (-w + s, c.Y_VANO - 0.003, s), (w - s, c.Y_VANO, c.Z_PIANO - 0.004), vernice)
    # Le due guide su cui poggia la piastra dei tasti, e il bordo che la chiude sul davanti.
    for sinistra, destra in ((-w + s, -w + s + 0.004), (w - s - 0.004, w - s)):
        c.cuboide(bm, (sinistra, c.FRONTE + s, c.Z_PIANO - 0.012), (destra, c.Y_PIANO_TASTI, c.Z_PIANO - 0.004), vernice)
    c.cuboide(bm, (-w + s, c.FRONTE + s, c.Z_PIANO - 0.012), (w - s, c.FRONTE + s + 0.006, c.Z_PIANO + 0.002), vernice)

    # Le cornici d'ottone delle 26 lampade: l'anello attorno al vetro.
    for x, y, _ in c.posizioni_qwertz(c.Y_FILE_LAMPADE, c.Z_PIANO).values():
        c.tubo(bm, (x, y, c.Z_PIANO + 0.002), 0.0090, 0.0108, 0.004, "Z", 20, ottone)

    # Le cerniere sul retro e i fermi sul fronte, a coppie simmetriche: la cassa resta centrata.
    for x in (-0.085, 0.085):
        c.cuboide(bm, (x - 0.015, c.RETRO, 0.085), (x + 0.015, c.RETRO + 0.002, 0.108), ottone)
        c.cuboide(bm, (x - 0.010, c.FRONTE - 0.002, 0.070), (x + 0.010, c.FRONTE, 0.095), ottone)
    # Il perno dei nottolini.
    c.cilindro(bm, (0.0, Y_PERNO, Z_PERNO), 0.0025, 0.230, "X", 10, ottone)


def _coperchio(bm):
    """La lamiera sopra il vano, con tre finestrelle sopra i rotori e il bordo ripiegato.

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
    # Il bordo ripiegato sui tre lati liberi, e la targhetta davanti alle finestrelle.
    c.cuboide(bm, (-w, y0, -0.008), (-w + 0.003, y1, z0))
    c.cuboide(bm, (w - 0.003, y0, -0.008), (w, y1, z0))
    c.cuboide(bm, (-w, y0, -0.008), (w, y0 + 0.003, z0))
    c.cuboide(bm, (-0.045, ya - 0.016, z1), (0.045, ya - 0.004, z1 + 0.0008), 1)


def _pannello(bm):
    """La lastra e le 26 prese: un anello di metallo per ognuna."""
    c.cuboide(bm, (-0.120, -0.002, -0.030), (0.120, 0.002, 0.030), 0)
    for x, _, z in posizioni_prese().values():
        c.tubo(bm, (x, -0.002 - SPORGENZA_PRESA / 2, z - Z_PANNELLO), 0.0022, 0.0042, SPORGENZA_PRESA, "Y", 10, 1)


def costruisci(m):
    c.oggetto("cassa", c.mesh("cassa", _cassa, [m["legno"], m["vernice"], m["ottone"]]))
    c.oggetto(
        "coperchio_interno",
        c.mesh("coperchio_interno", _coperchio, [m["metallo_scuro"], m["metallo"]]),
        (0.0, c.RETRO - c.SPESSORE, c.ALTEZZA),
        fase=1,
    )
    c.oggetto(
        "pannello_spine",
        c.mesh("pannello_spine", _pannello, [m["vernice"], m["metallo"]]),
        (0.0, Y_PANNELLO, Z_PANNELLO),
    )
    # Lo sportello ha l'origine sulla cerniera, lungo lo spigolo inferiore: si apre ruotando su X.
    c.oggetto(
        "sportello_spine",
        c.mesh(
            "sportello_spine",
            lambda bm: (
                c.cuboide(bm, (-0.130, -0.002, 0.0), (0.130, 0.002, 0.080), 0),
                c.cuboide(bm, (-0.012, -0.0035, 0.060), (0.012, -0.002, 0.070), 1),  # il fermo
            ),
            [m["legno"], m["ottone"]],
        ),
        (0.0, Y_SPORTELLO, 0.012),
        fase=1,
    )
