import { LETTER_COUNT } from '@/engine';

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

/**
 * Dove sta il selettore rispetto alle fasi: su una fase intera (0 = macchina chiusa, 1–4) oppure
 * fra due, quando la clip è a metà.
 */
export type PosizioneSelettore = { fase: number } | { da: number; a: number };

export function posizioneSelettore(valore: number): PosizioneSelettore {
  const v = Math.min(Math.max(valore, 0), FASI);
  const vicina = Math.round(v);
  if (Math.abs(v - vicina) < 0.01) return { fase: vicina };
  return { da: Math.floor(v), a: Math.ceil(v) };
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

/** La camera segue lo smontaggio: dove guarda (`y`, in metri) e quanto si allontana (`scala`, 1 = macchina chiusa). */
export interface Inquadratura {
  y: number;
  scala: number;
}

const INQUADRATURE: readonly Inquadratura[] = [
  { y: 0.055, scala: 1 },
  { y: 0.075, scala: 1.1 },
  { y: 0.1, scala: 1.3 },
  { y: 0.11, scala: 1.35 },
  { y: 0.14, scala: 1.5 },
];

/** L'inquadratura per un valore del selettore, interpolata fra quelle delle fasi. */
export function inquadratura(valore: number): Inquadratura {
  const v = Math.min(Math.max(valore, 0), FASI);
  const sotto = Math.min(Math.floor(v), FASI - 1);
  const t = v - sotto;
  const a = INQUADRATURE[sotto]!;
  const b = INQUADRATURE[sotto + 1]!;
  return { y: a.y + (b.y - a.y) * t, scala: a.scala + (b.scala - a.scala) * t };
}

/** Quanto ruota un nottolino a un tasto: va e torna, `u` da 0 a 1 è il tempo del movimento. Quello in presa spinge di più. */
export const OSCILLAZIONE_NOTTOLINO = { inPresa: 0.32, sullAnello: 0.1 } as const;

export function angoloNottolino(u: number, inPresa: boolean): number {
  const ampiezza = inPresa ? OSCILLAZIONE_NOTTOLINO.inPresa : OSCILLAZIONE_NOTTOLINO.sullAnello;
  return ampiezza * Math.sin(Math.PI * Math.min(Math.max(u, 0), 1));
}

/** Quanto ruota a un tasto la leva sotto i tasti, in radianti: il suo movimento accompagna quello dei nottolini. */
export const OSCILLAZIONE_LEVA = 0.05;
