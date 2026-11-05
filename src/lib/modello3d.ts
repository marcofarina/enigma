import { url } from './url.ts';

/**
 * Il modello 3D dell’Enigma I (fasi 4i–4k di docs/piano.md). La geometria è nostra, con la licenza
 * dei contenuti del sito (decisione D14); i crediti stanno nella pagina «Fonti e crediti».
 */
export const modello3d = {
  /** Il `.glb` in `public/`, scaricato solo dopo «Avvia la vista 3D». */
  file: url('modelli/enigma-i.glb'),
  /** L’anteprima resa da Blender con la stessa inquadratura della camera della pagina. */
  anteprima: url('modelli/enigma-i-anteprima.webp'),
  larghezzaAnteprima: 1280,
  altezzaAnteprima: 720,
  licenza: 'CC-BY-NC-SA-4.0',
  urlLicenza: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it',
  /** Il carattere dell’atlante delle lettere. */
  carattere: { licenza: 'SIL OFL 1.1', url: 'https://openfontlicense.org/' },
  /** Ancora della voce nella pagina «Fonti e crediti». */
  crediti: url('fonti/#modello-3d'),
} as const;
