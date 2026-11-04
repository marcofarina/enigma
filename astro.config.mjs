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

// Il sito è pubblicato come project site di GitHub Pages: https://marcofarina.github.io/enigma/
export default defineConfig({
  site: 'https://marcofarina.github.io',
  base: '/enigma',
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
  },
});
