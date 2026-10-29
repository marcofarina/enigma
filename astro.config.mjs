// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Il sito è pubblicato come project site di GitHub Pages: https://marcofarina.github.io/enigma/
export default defineConfig({
  site: 'https://marcofarina.github.io',
  base: '/enigma',
  trailingSlash: 'always',
  integrations: [react(), mdx()],
  i18n: {
    // L'inglese verrà aggiunto a `locales` quando i contenuti saranno tradotti.
    locales: ['it'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
