import { encode } from 'uqr';

/** Margine bianco attorno al codice, in moduli: lo standard ne chiede almeno quattro. */
export const QR_QUIET_ZONE = 4;

/**
 * Codice QR come un unico percorso SVG: un quadrato di lato 1 per ogni modulo scuro, con il
 * margine già compreso nelle coordinate. `size` è il lato totale in moduli.
 */
export function qrPath(text: string): { size: number; d: string } {
  const { data, size } = encode(text, { ecc: 'M', border: QR_QUIET_ZONE });
  let d = '';
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return { size, d };
}
