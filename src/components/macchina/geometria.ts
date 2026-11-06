import { LETTER_COUNT } from '@/engine';
import type { Inquadratura } from '@/lib/lezione-3d';

/*
 * Conti della pagina 3D che non toccano three.js, così si provano senza WebGL. Le regole vengono
 * da docs/piano/convenzione-3d.md.
 */

/** Un passo di rotore: 360° / 26, in radianti. */
export const PASSO = (2 * Math.PI) / LETTER_COUNT;

/** I nodi dei rotori da sinistra a destra, come gli slot di `MachineConfig.rotors`. */
export const NODI_ROTORI = ['rotore_sinistro', 'rotore_centrale', 'rotore_destro'] as const;

/**
 * Rotazioni su X di un rotore e del suo anello (figlio del rotore), dati la lettera in finestrella
 * e la Ringstellung, entrambe come indici 0–25.
 *
 * Il contatto *i* del cablaggio sta all’angolo *i* · PASSO nel rotore, e il motore lo collega al
 * contatto fisso *i* − (posizione − anello): quindi il rotore gira di (posizione − anello) passi.
 * L’anello deve mostrare in alto il numero posizione + 1, cioè girare in tutto di «posizione»
 * passi: rispetto al rotore, di «anello» passi.
 */
export function rotazioniRotore(posizione: number, anello: number): { rotore: number; anello: number } {
  return { rotore: (posizione - anello) * PASSO, anello: anello * PASSO };
}

/** Lo spostamento della texture che porta la cella 0 dell’atlante (la A) sulla lettera richiesta. */
export function offsetAtlante(indice: number): { x: number; y: number } {
  return { x: (indice % 8) / 8, y: Math.floor(indice / 8) / 8 };
}

/** Lettera (da A a Z) di un nodo `tasto_<l>` o `lampada_<l>`, oppure `null`. */
export function letteraDelNodo(nome: string, prefisso: 'tasto' | 'lampada'): string | null {
  const match = new RegExp(`^${prefisso}_([a-z])$`).exec(nome);
  return match?.[1] ? match[1].toUpperCase() : null;
}

/*
 * Vista esplosa, cablaggio e nottolini (fase 5b).
 */

/** Durata della clip `smontaggio`: un secondo per fase, quattro fasi (convenzione-3d, «La clip»). */
export const FASI = 4;
export const DURATA_CLIP = FASI;

/** Il valore del selettore da portare al mixer: la clip si ferma un attimo prima della fine, dove un'azione che si ripete tornerebbe a zero. */
export function tempoClip(valore: number): number {
  return Math.min(Math.max(valore, 0), DURATA_CLIP - 1e-4);
}

/** Quanto di una grandezza che compare fra `da` e `a` si vede con il selettore su `valore`: da 0 a 1. */
export function rampa(valore: number, da: number, a: number): number {
  return Math.min(Math.max((valore - da) / (a - da), 0), 1);
}

/** Il contatto *i* (A = 0) di un rotore, della ruota d’ingresso o del riflettore, sul cerchio di raggio `raggio`, in metri, nel piano (Y, Z) del nodo. */
export function puntoContatto(indice: number, raggio: number): { y: number; z: number } {
  // Convenzione-3d, «Angoli»: il contatto 0 guarda in alto (+Y in glTF) e l'angolo cresce verso il retro (−Z).
  const angolo = indice * PASSO;
  return { y: raggio * Math.cos(angolo), z: -raggio * Math.sin(angolo) };
}

/**
 * Le 26 linee del cablaggio di un rotore, come coppie di punti (x, y, z) per un `LineSegments`:
 * dal contatto *i* della faccia d’ingresso (a destra, `xIngresso`) al contatto del cablaggio
 * sulla faccia d’uscita (a sinistra, `xUscita`). Le coordinate sono nel sistema del rotore, che
 * ruota con lui.
 */
export function segmentiCablaggio(
  cablaggio: readonly number[],
  raggio: number,
  xIngresso: number,
  xUscita: number,
): Float32Array {
  const punti = new Float32Array(cablaggio.length * 6);
  cablaggio.forEach((uscita, ingresso) => {
    const a = puntoContatto(ingresso, raggio);
    const b = puntoContatto(uscita, raggio);
    punti.set([xIngresso, a.y, a.z, xUscita, b.y, b.z], ingresso * 6);
  });
  return punti;
}

/*
 * La camera (fase 5g, docs/design.md «Pagina 3D»). Le inquadrature non sono più scritte a mano per
 * fase: la camera inquadra l'ingombro dei pezzi con un margine fisso, dalla direzione che si è
 * scelta. Qui stanno i conti, senza three.js.
 */

/** Il margine dell'inquadratura: il 6 % della scena su ogni lato (docs/design.md, «Area libera della camera»). */
export const MARGINE_SCENA = 0.06;

/** Da dove guarda la camera: l'angolo attorno all'asse verticale (0 = dal fronte, +Z) e quello dall'alto (0 = in verticale). */
export interface Direzione {
  azimut: number;
  polare: number;
}

/** L'inquadratura di partenza, la stessa dell'anteprima resa da Blender: da (0,52 · 0,6 · 0,8) m verso il centro della macchina. */
export const DIREZIONE_PREDEFINITA: Direzione = { azimut: 0.576, polare: 1.05 };

/** La camera non scende sotto il piano d'appoggio (come l'`OrbitControls` di prima). */
export const POLARE_MASSIMO = Math.PI / 2 - 0.05;

export const DISTANZA_MINIMA = 0.15;
export const DISTANZA_MASSIMA = 3;

export type IdVista = 'fronte' | 'alto' | 'rotori' | 'pannello';

/** Ciò che la pagina può chiedere alla camera con i pulsanti. */
export interface ComandiCamera {
  vista: (id: IdVista) => void;
  /** `1` avvicina, `-1` allontana, di un passo fisso. */
  zoom: (verso: 1 | -1) => void;
  /** Torna all'inquadratura della fase corrente. */
  ripristina: () => void;
}

/** Se un altro passo di zoom è possibile: i pulsanti si spengono ai limiti. */
export interface StatoZoom {
  puoAvvicinare: boolean;
  puoAllontanare: boolean;
}

/**
 * Una vista predefinita: il punto di vista (la direzione da cui si guarda) e il bersaglio (i nodi di
 * cui si inquadra l'ingombro alla fase corrente; `null` = tutta la macchina). Il bersaglio segue i
 * pezzi quando si smontano, quindi la vista «Rotori» inquadra i rotori anche estratti.
 */
export interface Vista extends Direzione {
  id: IdVista;
  nodi: readonly string[] | null;
}

export const VISTE: readonly Vista[] = [
  { id: 'fronte', azimut: 0, polare: 1.2, nodi: null },
  { id: 'alto', azimut: 0, polare: 0.05, nodi: null },
  { id: 'rotori', azimut: 0.35, polare: 0.85, nodi: ['rotore_sinistro', 'rotore_centrale', 'rotore_destro'] },
  { id: 'pannello', azimut: 0, polare: 1.45, nodi: ['pannello_spine', 'sportello_spine'] },
];

/** I pezzi che la pagina distingue: il doppio clic centra la camera su uno di questi (e le viste ne inquadrano alcuni). */
export const PEZZI: readonly string[] = [
  'cassa',
  'coperchio_legno',
  'coperchio_interno',
  'sportello_spine',
  'pannello_spine',
  'tastiera',
  'ruota_ingresso',
  'riflettore',
  'asse_rotori',
  ...NODI_ROTORI,
  'nottolino_destro',
  'nottolino_centrale',
  'nottolino_sinistro',
  'leva_tasti',
  'batteria',
];

/**
 * Il pezzo a cui appartiene un nodo, oppure `null`: i pezzi di un rotore (anello, nucleo…) sono il
 * rotore, ogni lampada è un pezzo, i tasti no (un doppio clic su un tasto li batte due volte e basta).
 */
export function pezzoDelNodo(nome: string): string | null {
  if (letteraDelNodo(nome, 'tasto')) return null;
  if (letteraDelNodo(nome, 'lampada')) return nome;
  const rotore = NODI_ROTORI.find((r) => nome === r || nome.startsWith(`${r}_`));
  if (rotore) return rotore;
  return PEZZI.includes(nome) ? nome : null;
}

export type Punto = readonly [number, number, number];

/** Un parallelepipedo allineato agli assi, in metri. */
export interface Scatola {
  min: Punto;
  max: Punto;
}

/** Da dove sta la camera rispetto al bersaglio, come vettore unitario. */
export function versoLaCamera({ azimut, polare }: Direzione): Punto {
  return [Math.sin(polare) * Math.sin(azimut), Math.cos(polare), Math.sin(polare) * Math.cos(azimut)];
}

const prodotto = (a: Punto, b: Punto) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Dove mettere la camera perché una scatola stia nel quadro con un margine uguale su ogni lato,
 * guardandola dalla direzione data: il bersaglio è il centro della scatola e la distanza è la minima
 * per cui i suoi otto spigoli stanno nella parte centrale della scena (la scena meno due margini).
 * `fov` è il campo verticale in radianti, `aspetto` larghezza su altezza della scena.
 */
export function inquadra(
  scatola: Scatola,
  direzione: Direzione,
  fov: number,
  aspetto: number,
  margine = MARGINE_SCENA,
): { bersaglio: Punto; distanza: number } {
  const centro: Punto = [
    (scatola.min[0] + scatola.max[0]) / 2,
    (scatola.min[1] + scatola.max[1]) / 2,
    (scatola.min[2] + scatola.max[2]) / 2,
  ];
  const verso = versoLaCamera(direzione);
  const destra: Punto = [Math.cos(direzione.azimut), 0, -Math.sin(direzione.azimut)];
  const su: Punto = [
    verso[1] * destra[2] - verso[2] * destra[1],
    verso[2] * destra[0] - verso[0] * destra[2],
    verso[0] * destra[1] - verso[1] * destra[0],
  ];
  const utile = 1 - 2 * margine;
  const tanV = Math.tan(fov / 2);
  const tanH = tanV * aspetto;
  let distanza = 0;
  for (const x of [scatola.min[0], scatola.max[0]]) {
    for (const y of [scatola.min[1], scatola.max[1]]) {
      for (const z of [scatola.min[2], scatola.max[2]]) {
        const p: Punto = [x - centro[0], y - centro[1], z - centro[2]];
        const profondita = prodotto(p, verso);
        distanza = Math.max(
          distanza,
          profondita + Math.abs(prodotto(p, destra)) / (utile * tanH),
          profondita + Math.abs(prodotto(p, su)) / (utile * tanV),
        );
      }
    }
  }
  return { bersaglio: centro, distanza };
}

/** Un passo dello zoom: ogni pressione porta la camera a questa frazione della distanza (o al suo inverso). */
export const PASSO_ZOOM = 0.75;

/** La distanza dopo un passo di zoom (`verso` 1 = avvicina), sempre dentro i limiti. */
export function distanzaDopoLoZoom(distanza: number, verso: 1 | -1): number {
  const nuova = verso > 0 ? distanza * PASSO_ZOOM : distanza / PASSO_ZOOM;
  return Math.min(Math.max(nuova, DISTANZA_MINIMA), DISTANZA_MASSIMA);
}

/** L'angolo equivalente a `voluto` più vicino a `attuale`: la camera non rifà indietro i giri già fatti. */
export function angoloPiuVicinoA(attuale: number, voluto: number): number {
  const giro = 2 * Math.PI;
  return voluto + giro * Math.round((attuale - voluto) / giro);
}

/** Quanto, a macchina smontata, dura il passaggio da una fase all'altra: un secondo per fase, al più 2,5 s in tutto. */
export function velocitaSmontaggio(da: number, a: number): number {
  return Math.max(1, Math.abs(a - da) / 2.5);
}

/** Quanto ruota un nottolino a un tasto: va e torna, `u` da 0 a 1 è il tempo del movimento. Quello in presa spinge di più. */
export const OSCILLAZIONE_NOTTOLINO = { inPresa: 0.32, sullAnello: 0.1 } as const;

export function angoloNottolino(u: number, inPresa: boolean): number {
  const ampiezza = inPresa ? OSCILLAZIONE_NOTTOLINO.inPresa : OSCILLAZIONE_NOTTOLINO.sullAnello;
  return ampiezza * Math.sin(Math.PI * Math.min(Math.max(u, 0), 1));
}

/** Quanto ruota a un tasto la leva sotto i tasti, in radianti: il suo movimento accompagna quello dei nottolini. */
export const OSCILLAZIONE_LEVA = 0.05;

/*
 * Le inquadrature della lezione animata (fase 5d): il copione le chiama per nome. Come le viste
 * predefinite, ognuna è una direzione e i nodi di cui inquadra l'ingombro, a macchina chiusa.
 */

const LAMPADE = Array.from({ length: LETTER_COUNT }, (_, i) => `lampada_${String.fromCharCode(97 + i)}`);

export const INQUADRATURE_LEZIONE: Readonly<Record<Inquadratura, Direzione & { nodi: readonly string[] | null }>> = {
  insieme: { ...DIREZIONE_PREDEFINITA, nodi: null },
  tastiera: { azimut: 0, polare: 0.7, nodi: ['tastiera', ...LAMPADE] },
  pannello: { azimut: 0.25, polare: 1.15, nodi: ['pannello_spine', 'sportello_spine', 'tastiera'] },
  rotori: { azimut: 0.3, polare: 0.55, nodi: ['ruota_ingresso', ...NODI_ROTORI, 'riflettore'] },
  riflettore: { azimut: -0.7, polare: 0.9, nodi: ['riflettore', 'rotore_sinistro'] },
};
