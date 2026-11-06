// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Tema di Shiki fatto di sole variabili CSS (`--code-*` in src/styles/tokens.css): i blocchi di
 * codice seguono il tema chiaro e scuro scelto con `data-theme`, senza un secondo passaggio.
 */
/** @type {import('astro').ShikiConfig['theme']} */
const temaCodice = {
  name: 'enigma',
  type: 'light',
  colors: {
    'editor.foreground': 'var(--code-ink)',
    'editor.background': 'var(--code-paper)',
  },
  tokenColors: [
    { settings: { foreground: 'var(--code-ink)', background: 'var(--code-paper)' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--code-comment)' } },
    {
      scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.word'],
      settings: { foreground: 'var(--code-keyword)' },
    },
    { scope: ['string', 'string.quoted', 'constant.character'], settings: { foreground: 'var(--code-string)' } },
  ],
};

// Il sito è pubblicato su GitHub Pages con dominio personalizzato: https://enigma.rainbowbits.cloud/
// (il file public/CNAME dice a GitHub Pages quale dominio servire). Il sito sta alla radice, quindi base è '/'.
export default defineConfig({
  site: 'https://enigma.rainbowbits.cloud',
  base: '/',
  trailingSlash: 'always',
  integrations: [react(), mdx()],
  markdown: {
    shikiConfig: { theme: temaCodice },
  },
  i18n: {
    // L'inglese verrà aggiunto a `locales` quando i contenuti saranno tradotti.
    locales: ['it'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // three.js in un chunk riconoscibile, scaricato solo dalla pagina 3D dopo «Avvia la vista 3D»
          // (fase 5a di docs/piano.md: lo controllano i test di rete). Solo il pacchetto `three`, che
          // non ha dipendenze: un gruppo trascina con sé le dipendenze dei suoi moduli, e con React
          // Three Fiber ci finirebbe React, che serve a tutte le pagine.
          codeSplitting: {
            groups: [{ name: 'three', test: /[\\/]node_modules[\\/]three[\\/]/ }],
          },
        },
      },
    },
  },
});
