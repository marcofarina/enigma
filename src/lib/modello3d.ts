import { url } from './url.ts';

/**
 * Il modello 3D dell’Enigma I (fasi 4i–4n di docs/piano.md). Dalla 4l è ibrido (decisione D20):
 * l’esterno deriva dal modello «Enigma Machine» di ASHISH (CC BY 4.0), l’interno è nostro. Il `.glb`
 * ha la licenza dei contenuti del sito, come la CC BY permette; i crediti stanno nella pagina
 * «Fonti e crediti» e, in breve, sotto la vista.
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
  /** Il modello di partenza dell’esterno (scripts/blender/sorgenti.md). L’autore si scrive nelle pagine. */
  esterno: {
    titolo: 'Enigma Machine',
    url: 'https://sketchfab.com/3d-models/enigma-machine-30b85c037a164174a109ad6f002b9c47',
    urlAutore: 'https://sketchfab.com/3dmodelsmith',
    licenza: 'CC-BY-4.0',
    urlLicenza: 'https://creativecommons.org/licenses/by/4.0/deed.it',
  },
  /**
   * La luce d’ambiente della scena (fase 5f): la HDRI «studio» che Blender distribuisce, 1024 × 512, di
   * Greg Zaal per Poly Haven, CC0 (`datafiles/studiolights/world/license.txt` di Blender).
   */
  ambiente: {
    file: url('ambienti/studio.exr'),
    autore: 'Greg Zaal',
    url: 'https://polyhaven.com/',
  },
  /** Il carattere dell’atlante dei numeri degli anelli. */
  carattere: { licenza: 'SIL OFL 1.1', url: 'https://openfontlicense.org/' },
  /** Ancora della voce nella pagina «Fonti e crediti». */
  crediti: url('fonti/#modello-3d'),
} as const;
