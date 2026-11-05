"""La tastiera: un vuoto che raccoglie i 26 tasti, copie collegate della stessa mesh.

Ogni tasto ha l'origine alla base, sul piano: il codice lo abbassa traslandolo.
"""

import comune as c

Y_FILE = (-0.094, -0.117, -0.140)  # QWERTZUIO, ASDFGHJK, PYXCVBNML


def _tasto(bm):
    c.cilindro(bm, (0, 0, 0.006), 0.003, 0.012, lati=8, indice_materiale=0)  # gambo
    c.cilindro(bm, (0, 0, 0.015), 0.009, 0.006, lati=16, indice_materiale=1)  # testa


def costruisci(m):
    tastiera = c.oggetto("tastiera", None, (0.0, Y_FILE[1], c.Z_PIANO), fase=4)
    dati = c.mesh("tasto", _tasto, [m["metallo"], m["bachelite"]])
    for lettera, posizione in sorted(c.posizioni_qwertz(Y_FILE, c.Z_PIANO).items()):
        c.oggetto(f"tasto_{lettera}", dati, posizione, genitore=tastiera)
