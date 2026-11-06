import { statSync } from 'node:fs';
import { join } from 'node:path';
import { megabytes } from './format.ts';

/**
 * Quanto scarica la vista 3D dopo il pulsante, letto alla build dai file in `public/`: il modello e la
 * HDRI della luce (fase 5f). Il codice di three.js non conta: arriva compresso e pesa molto meno.
 * Solo lato server (`node:fs`): la pagina lo passa all’isola come proprietà.
 */
const FILE_DELLA_VISTA = ['modelli/enigma-i.glb', 'ambienti/studio.exr'];

export function pesoVista(): string {
  const byte = FILE_DELLA_VISTA.reduce(
    (totale, file) => totale + statSync(join(process.cwd(), 'public', file)).size,
    0,
  );
  return megabytes(byte);
}
