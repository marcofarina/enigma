import type { ImageMetadata } from 'astro';

/** Immagini di terzi: i file stanno in `src/assets/immagini/`, i crediti in `src/content/immagini.yaml`. */
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/immagini/*.{jpg,png,webp}', {
  eager: true,
});

export function imageFile(name: string): ImageMetadata {
  const image = files[`/src/assets/immagini/${name}`]?.default;
  if (!image) throw new Error(`Immagine mancante in src/assets/immagini: ${name}`);
  return image;
}

export const imageFileNames = () => Object.keys(files).map((path) => path.split('/').at(-1) ?? path);

/** Etichetta leggibile della licenza: “CC-BY-SA-4.0” diventa “CC BY-SA 4.0”. */
export function licenseLabel(license: string): string {
  if (license === 'PD') return 'pubblico dominio';
  if (license === 'propria') return 'licenza propria';
  if (license.startsWith('CC0')) return 'CC0';
  const match = /^CC-(BY(?:-NC)?(?:-SA)?)-(\d\.\d)(?:-([A-Z]{2}))?$/.exec(license);
  return match ? ['CC', match[1], match[2], match[3]].filter(Boolean).join(' ') : license;
}
