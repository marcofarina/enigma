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
