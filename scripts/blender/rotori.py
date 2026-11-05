"""Il gruppo dei rotori: asse, tre rotori con i loro pezzi, ruota d'ingresso, riflettore, nottolini.

Da sinistra a destra lungo X: riflettore, rotore sinistro, centrale, destro, ruota d'ingresso.
Ogni rotore è un vuoto con l'origine sull'asse: il codice lo gira con la sola rotazione su X.

Un rotore, da sinistra a destra (x relativa al suo centro, in millimetri; pezzi come nella foto
`rotori-e-perno`, dove il cricchetto e i puntali stanno dallo stesso lato):

    -15 … -14   contatti piani (ottone)           sulla faccia di sinistra
    -14 … 13,5  nucleo (bachelite, con il foro per l'asse)
    -12,5 … 0,5 anello con i 26 numeri e la tacca
    0,5 … 4,5   rotella dentata d'alluminio, con cui si gira il rotore a mano
    9,5 … 12,8  cricchetto a 26 denti, su cui spinge il nottolino
    13,5 … 15   puntali a molla (ottone)           sulla faccia di destra

Angoli (convenzione, «Angoli»): la faccia k dell'anello, il numero k, sta all'angolo (k − 1) · 360° / 26
da +Z verso +Y, cioè all'indietro. A riposo il numero 01 guarda in alto, e girare il rotore di
+360° / 26 su X porta in alto il numero 02: è il passo del rotore.
"""

import math

import bmesh
from mathutils import Matrix, Vector

import comune as c

ROTORI ={"rotore_sinistro": -0.030, "rotore_centrale": 0.0, "rotore_destro": 0.030}

# Stazioni dei pezzi lungo l'asse di un rotore (x relativa al centro).
X_CONTATTI_PIANI = (-0.0150, -0.0140)
X_NUCLEO = (-0.0140, 0.0135)
X_ANELLO = (-0.0125, 0.0005)
X_NUMERI = 0.0100  # la parte numerata dell'anello è larga 10 mm; il resto è il bordo con la tacca
X_ROTELLA = (0.0005, 0.0045)
X_CRICCHETTO = (0.0095, 0.0128)
X_PUNTALI = (0.0135, 0.0150)

RAGGIO_NUCLEO = 0.043
RAGGIO_INTERNO_ANELLO = 0.0435
RAGGIO_FORO = 0.0045  # l'asse (4 mm) ci passa
RAGGIO_ROTELLA = (0.0495, 0.0525)  # fondo e cima dei denti
RAGGIO_CRICCHETTO = (0.0440, 0.0475)
PROFONDITA_TACCA = 0.004

# I due fissi: sono più bassi dei rotori, per non toccare il coperchio. Le facce rivolte ai rotori
# stanno a 5 mm dal piano dei contatti di quelli, che la sporgenza dei contatti colma.
X_RIFLETTORE = -0.060
X_INGRESSO = 0.055
RAGGIO_FISSI = 0.040
LUNGHEZZA_FISSI = 0.020
SPORGENZA_CONTATTI_FISSI = 0.005

# Ogni nottolino sta a destra del rotore che spinge, sotto il cricchetto, e il perno è comune
# (comune.py). La leva è una lastra che parte dal perno e punta all'asse del rotore: ruotando il
# nottolino su X la punta si sposta lungo il bordo del cricchetto.
NOTTOLINI = {"nottolino_sinistro": -0.018, "nottolino_centrale": 0.012, "nottolino_destro": 0.042}
Y_PERNO, Z_PERNO = c.Y_PERNO, c.Z_PERNO
LARGHEZZA_NOTTOLINO = 0.004
LUNGHEZZA_DITO = 0.0085  # il dito che appoggia sull'anello del rotore vicino; manca al destro


def _punto_yz(raggio, angolo):
    return (raggio * math.sin(angolo), raggio * math.cos(angolo))


def _anello(bm):
    """L'anello: 26 facce, ognuna con il suo numero, e il bordo di destra con la tacca sotto il 01."""
    n = 26
    xa, xc = X_ANELLO
    xb = xa + X_NUMERI
    r, ri = c.RAGGIO_ROTORE, RAGGIO_INTERNO_ANELLO
    angoli = [(i - 0.5) * c.PASSO_ANGOLO for i in range(n)]  # il bordo i separa la faccia i dalla i + 1

    def anello(x, raggio):
        return [bm.verts.new((x, *_punto_yz(raggio, a))) for a in angoli]

    oa, ob, oc, ia, ic = anello(xa, r), anello(xb, r), anello(xc, r), anello(xa, ri), anello(xc, ri)
    # La tacca è una tasca nel bordo di destra della faccia 1, aperta verso la ruota dentata.
    fondo_b = [bm.verts.new((xb, *_punto_yz(r - PROFONDITA_TACCA, angoli[i]))) for i in (0, 1)]
    fondo_c = [bm.verts.new((xc, *_punto_yz(r - PROFONDITA_TACCA, angoli[i]))) for i in (0, 1)]

    scuro, tessera = 0, 1
    facce = []
    strato = bm.loops.layers.uv.verify()
    corda = 2 * r * math.sin(c.PASSO_ANGOLO / 2)
    for j in range(n):
        k = (j + 1) % n
        numerata = bm.faces.new((oa[j], oa[k], ob[k], ob[j]))
        numerata.material_index = tessera
        facce.append(numerata)
        # Il numero j + 1 occupa 0,96 della cella in altezza (lungo la corda) e, alla stessa scala,
        # la larghezza dell'anello: così le cifre non si deformano.
        u0, v0, lato = c.centro_cella(c.CELLA_NUMERO + j)
        scala = 0.96 * lato / corda  # unità UV per metro
        mezza_larghezza = (xb - xa) * scala / 2
        uv = {oa[j]: (-1, -1), oa[k]: (-1, 1), ob[k]: (1, 1), ob[j]: (1, -1)}
        for loop in numerata.loops:
            sx, sy = uv[loop.vert]
            loop[strato].uv = (u0 + sx * mezza_larghezza, v0 + sy * 0.48 * lato)
        # Bordo di destra, bocche e interno.
        if j != 0:
            facce.append(bm.faces.new((ob[j], ob[k], oc[k], oc[j])))
        # La bocca di destra. Ai due lati della tacca il suo bordo porta anche il vertice del fondo.
        if j == 0:
            bocca = (fondo_c[0], fondo_c[1], ic[1], ic[0])
        elif j == 1:
            bocca = (oc[1], oc[2], ic[2], ic[1], fondo_c[1])
        elif j == n - 1:
            bocca = (oc[j], oc[0], fondo_c[0], ic[0], ic[j])
        else:
            bocca = (oc[j], oc[k], ic[k], ic[j])
        facce.append(bm.faces.new(bocca))
        facce.append(bm.faces.new((oa[j], ia[j], ia[k], oa[k])))
        facce.append(bm.faces.new((ia[j], ic[j], ic[k], ia[k])))
    facce += [
        bm.faces.new((ob[0], ob[1], fondo_b[1], fondo_b[0])),  # fondo della tacca, lato nucleo
        bm.faces.new((fondo_b[0], fondo_b[1], fondo_c[1], fondo_c[0])),
        bm.faces.new((ob[0], fondo_b[0], fondo_c[0], oc[0])),
        bm.faces.new((ob[1], oc[1], fondo_c[1], fondo_b[1])),
    ]
    bmesh.ops.recalc_face_normals(bm, faces=facce)
    for f in facce:
        if f.material_index != tessera:
            f.material_index = scuro


def _dentata(profilo, x0, x1):
    """Costruttore del prisma a 26 denti, dalla coppia (fondo, cima) dei raggi."""
    fondo, cima = profilo

    def costruisci(bm):
        punti = []
        for i in range(26):
            punti.append(_punto_yz(fondo, i * c.PASSO_ANGOLO))
            punti.append(_punto_yz(cima, (i + 0.5) * c.PASSO_ANGOLO))
        c.prisma_x(bm, punti, x0, x1)

    return costruisci


def _cricchetto(bm):
    """26 denti a sega: salgono piano e scendono di colpo, perché il nottolino spinge in un verso."""
    fondo, cima = RAGGIO_CRICCHETTO
    punti = []
    for i in range(26):
        punti.append(_punto_yz(fondo, i * c.PASSO_ANGOLO))
        punti.append(_punto_yz(cima, (i + 0.85) * c.PASSO_ANGOLO))
    c.prisma_x(bm, punti, *X_CRICCHETTO)


def _nucleo(bm):
    c.tubo(bm, ((X_NUCLEO[0] + X_NUCLEO[1]) / 2, 0, 0), RAGGIO_FORO, RAGGIO_NUCLEO, X_NUCLEO[1] - X_NUCLEO[0], "X")


def _contatti_piani(bm):
    c.contatti_sul_cerchio(bm, X_CONTATTI_PIANI[0], c.RAGGIO_CONTATTI, X_CONTATTI_PIANI[1] - X_CONTATTI_PIANI[0], 0.0020, verso=1, lati=8)


def _contatti_molla(bm):
    c.contatti_sul_cerchio(bm, X_PUNTALI[0], c.RAGGIO_CONTATTI, X_PUNTALI[1] - X_PUNTALI[0], 0.0012, verso=1, lati=6)


def _riflettore(bm):
    """Il disco del riflettore e i suoi 26 contatti a molla sulla faccia di destra."""
    mezzo = LUNGHEZZA_FISSI / 2
    c.cilindro(bm, (0, 0, 0), RAGGIO_FISSI, LUNGHEZZA_FISSI, "X", 26)
    c.contatti_sul_cerchio(bm, mezzo, c.RAGGIO_CONTATTI, SPORGENZA_CONTATTI_FISSI, 0.0012, 1, 6, 1)


def _ruota_ingresso(bm):
    """La ruota d'ingresso: il disco e i suoi 26 contatti piani sulla faccia di sinistra."""
    mezzo = LUNGHEZZA_FISSI / 2
    c.cilindro(bm, (0, 0, 0), RAGGIO_FISSI, LUNGHEZZA_FISSI, "X", 26)
    c.contatti_sul_cerchio(bm, -mezzo, c.RAGGIO_CONTATTI, SPORGENZA_CONTATTI_FISSI / 5, 0.0020, -1, 8, 1)


def _asse(bm):
    # Lungo 210 mm: a smontaggio finito i rotori si sono allargati lungo X e restano tutti infilati
    # sull'asse (vedi smontaggio.py). Montato, sta dentro il vano e i dischi lo nascondono.
    c.cilindro(bm, (0, 0, 0), 0.004, 0.210, "X", 12)


def _nottolino(con_dito):
    """La leva: dal perno (origine) verso l'asse del rotore, in un piano perpendicolare a X."""
    dy, dz = c.Y_ASSE - Y_PERNO, c.Z_ASSE - Z_PERNO
    distanza = math.hypot(dy, dz)
    angolo = math.atan2(dz, dy)
    lunghezza = distanza - RAGGIO_CRICCHETTO[1] - 0.001  # la punta arriva sul bordo del cricchetto
    mezzo = LARGHEZZA_NOTTOLINO / 2

    def costruisci(bm):
        v = c.cuboide(bm, (-mezzo, 0.0, -0.0015), (mezzo, lunghezza, 0.0015))
        if con_dito:
            # Il dito poggia sull'anello del rotore a destra: la sua faccia inferiore sta sul raggio
            # dell'anello, e la tacca lo accoglie.
            v += c.cuboide(
                bm,
                (mezzo, distanza - c.RAGGIO_ROTORE - 0.003, -0.0015),
                (mezzo + LUNGHEZZA_DITO, distanza - c.RAGGIO_ROTORE, 0.0015),
            )
        bmesh.ops.transform(bm, matrix=Matrix.Rotation(angolo, 4, "X"), verts=v)

    return costruisci


def costruisci(m):
    asse = (0.0, c.Y_ASSE, c.Z_ASSE)
    c.oggetto("asse_rotori", c.mesh("asse_rotori", _asse, [m["metallo"]]), asse, fase=2)

    anello = c.mesh("anello", _anello, [m["bachelite"], m["tessera"]])
    nucleo = c.mesh("nucleo", _nucleo, [m["bachelite"]])
    piani = c.mesh("contatti_piani", _contatti_piani, [m["ottone"]])
    molla = c.mesh("contatti_molla", _contatti_molla, [m["ottone"]])
    cricchetto = c.mesh("cricchetto", _cricchetto, [m["bachelite"]])
    rotella = c.mesh("rotella", _dentata(RAGGIO_ROTELLA, *X_ROTELLA), [m["metallo"]])
    for nome, x in ROTORI.items():
        centro = (x, c.Y_ASSE, c.Z_ASSE)
        rotore = c.oggetto(nome, None, centro, fase=2, raggio_contatti=c.RAGGIO_CONTATTI)
        a = c.oggetto(f"{nome}_anello", anello, centro, genitore=rotore, fase=3)
        # La tacca: un vuoto sul fondo della tasca, che gira con l'anello.
        x_bordo = (X_ANELLO[0] + X_NUMERI + X_ANELLO[1]) / 2  # il mezzo del bordo di destra
        tacca = (x + x_bordo, c.Y_ASSE, c.Z_ASSE + c.RAGGIO_ROTORE - PROFONDITA_TACCA)
        c.oggetto(f"{nome}_tacca", None, tacca, genitore=a)
        for suffisso, dati in (
            ("nucleo", nucleo),
            ("contatti_piani", piani),
            ("contatti_molla", molla),
            ("cricchetto", cricchetto),
            ("rotella", rotella),
        ):
            c.oggetto(f"{nome}_{suffisso}", dati, centro, genitore=rotore, fase=3)

    c.oggetto(
        "riflettore",
        c.mesh("riflettore", _riflettore, [m["metallo_scuro"], m["ottone"]]),
        (X_RIFLETTORE, c.Y_ASSE, c.Z_ASSE),
        fase=2,
        raggio_contatti=c.RAGGIO_CONTATTI,
    )
    c.oggetto(
        "ruota_ingresso",
        c.mesh("ruota_ingresso", _ruota_ingresso, [m["metallo_scuro"], m["ottone"]]),
        (X_INGRESSO, c.Y_ASSE, c.Z_ASSE),
        raggio_contatti=c.RAGGIO_CONTATTI,
    )

    senza_dito = c.mesh("nottolino", _nottolino(False), [m["metallo"]])
    con_dito = c.mesh("nottolino_con_dito", _nottolino(True), [m["metallo"]])
    for nome, x in NOTTOLINI.items():
        c.oggetto(nome, senza_dito if nome == "nottolino_destro" else con_dito, (x, Y_PERNO, Z_PERNO))
