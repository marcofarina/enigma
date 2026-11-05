"""Le 26 lampade, copie collegate della stessa mesh: il codice le accende cambiando il materiale."""

import comune as c

Y_FILE = (-0.030, -0.050, -0.070)  # QWERTZUIO, ASDFGHJK, PYXCVBNML


def _lampada(bm):
    c.cilindro(bm, (0, 0, 0.0015), 0.0085, 0.003, lati=16)


def costruisci(m):
    dati = c.mesh("lampada", _lampada, [m["vetro"]])
    for lettera, posizione in sorted(c.posizioni_qwertz(Y_FILE, c.Z_PIANO).items()):
        c.oggetto(f"lampada_{lettera}", dati, posizione)
