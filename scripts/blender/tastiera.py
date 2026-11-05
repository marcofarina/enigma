"""La tastiera: la piastra dei tasti e i 26 tasti, copie collegate della stessa mesh.

`tastiera` è la piastra, con l'origine sul piano, e ha i tasti per figli: la fase 4 dello smontaggio
alza tutto insieme e scopre la leva e la batteria. Ogni tasto ha l'origine alla base, sul piano: il
codice lo abbassa traslandolo. La lettera sta in cima, sulla cella 0 dell'atlante: la pagina sposta
la texture sulla lettera del tasto.
"""

import comune as c

Y_FILE = c.Y_FILE_TASTI
RAGGIO_TESTA = 0.0092


def _piastra(bm):
    """La lastra fra le guide della cassa, davanti al piano delle lampade (coordinate relative)."""
    w = c.LARGHEZZA / 2 - c.SPESSORE - 0.002  # appoggia per 2 mm sulle guide della cassa
    y_centro = Y_FILE[1]
    c.cuboide(bm, (-w, c.FRONTE + c.SPESSORE + 0.006 - y_centro, -0.004), (w, c.Y_PIANO_TASTI - y_centro, 0.0), 0)


def _tasto(bm):
    # Il gambo scende fino alla leva; la testa ha il bordo nero e, in cima, la tessera con la lettera.
    c.cilindro(bm, (0, 0, -0.005), 0.0025, 0.034, lati=8, indice_materiale=0)
    c.cilindro(bm, (0, 0, 0.015), RAGGIO_TESTA, 0.006, lati=20, indice_materiale=1)
    cima = c.faccia_superiore(bm)
    cima.material_index = 2
    c.uv_cerchio(bm, cima, RAGGIO_TESTA)


def costruisci(m):
    tastiera = c.oggetto(
        "tastiera",
        c.mesh("piastra_tasti", _piastra, [m["vernice"]]),
        (0.0, Y_FILE[1], c.Z_PIANO),
        fase=4,
    )
    dati = c.mesh("tasto", _tasto, [m["metallo"], m["bachelite"], m["cima_tasto"]])
    for lettera, posizione in sorted(c.posizioni_qwertz(Y_FILE, c.Z_PIANO).items()):
        c.oggetto(f"tasto_{lettera}", dati, posizione, genitore=tastiera)
