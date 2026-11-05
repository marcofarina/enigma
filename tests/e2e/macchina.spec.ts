import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { defaultConfig, encipherWith, encodeConfig, MODELS } from '../../src/engine/index.ts';

/*
 * La pagina 3D (fase 5a di docs/piano.md). three.js e il modello arrivano solo dopo il pulsante e
 * solo dal sito. Il Chromium dei test ha WebGL 2 con SwiftShader (vedi playwright.config.ts).
 */

/** Il chunk di three.js (nome fissato in astro.config.mjs) e il modello. */
const pesante = (url: string) => /\/_astro\/three\.[^/]*\.js$|\.glb$/.test(new URL(url).pathname);

/** Tutte le richieste della pagina, dalla prima. */
function richieste(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  return urls;
}

const avvia = (page: Page) => page.getByRole('button', { name: 'Avvia la vista 3D' });
const scena = (page: Page) => page.getByRole('application', { name: /Enigma I in 3D/ });
const annuncio = (page: Page) => page.locator('[data-annuncio]');

test('né la home né la pagina 3D scaricano three.js o il modello prima del pulsante', async ({ page }) => {
  const urls = richieste(page);
  await page.goto('');
  await page.waitForLoadState('networkidle');
  await page.goto('macchina/');
  await expect(avvia(page)).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(urls.filter(pesante)).toEqual([]);
});

test('avvia la vista, batte una lettera e la lampada risponde; nessuna richiesta esce dal sito', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60_000);
  const urls = richieste(page);
  await page.goto('macchina/');
  await avvia(page).click();
  await expect(scena(page)).toHaveAttribute('data-fase', 'pronta', { timeout: 45_000 });
  await expect(scena(page)).toBeFocused();

  await page.keyboard.press('a');
  await expect(annuncio(page)).toHaveText(`Lampada ${encipherWith(defaultConfig('I'), 'A')}`);
  await page.keyboard.press('Shift+B');
  await expect(annuncio(page)).toHaveText(`Lampada ${encipherWith(defaultConfig('I'), 'AB').at(-1)}`);
  await expect(page.locator('[data-nastro="tasti"]')).toHaveText('AB');
  await expect(page.locator('[data-nastro="lampade"]')).toHaveText(encipherWith(defaultConfig('I'), 'AB'));
  await page.keyboard.press('Backspace');
  await expect(page.locator('[data-nastro="tasti"]')).toHaveText('A');

  // Il modello e three.js sono arrivati, e solo dal sito (il blob è la texture estratta dal .glb).
  expect(urls.some((url) => url.endsWith('.glb'))).toBe(true);
  expect(urls.some((url) => /\/_astro\/three\./.test(url))).toBe(true);
  const sito = new URL(baseURL ?? '').origin;
  expect(urls.filter((url) => !url.startsWith(sito) && !/^(blob|data):/.test(url))).toEqual([]);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('un link dell’Enigma I apre la stessa configurazione con il messaggio', async ({ page }) => {
  const config = { ...defaultConfig('I'), rotors: ['II', 'IV', 'V'], rings: 'BUL', positions: 'BLA' };
  await page.goto(`macchina/?${encodeConfig(config)}&t=CIAO`);
  await expect(page.locator('[data-nastro="lampade"]')).toHaveText(encipherWith(config, 'CIAO'));
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Apri questa configurazione nel simulatore' })).toHaveAttribute(
    'href',
    `/enigma/?${encodeConfig(config)}&t=CIAO`,
  );
});

test('con un’Enigma M4 nella query avvisa e rimanda al simulatore', async ({ page }) => {
  const query = encodeConfig(defaultConfig('M4'));
  await page.goto(`macchina/?${query}`);
  await expect(page.getByRole('note').filter({ hasText: MODELS.M4.label })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Apri il link nel simulatore' })).toHaveAttribute(
    'href',
    `/enigma/?${query}`,
  );
  // Sotto c’è l’Enigma I di base.
  await expect(page.getByRole('link', { name: 'Apri questa configurazione nel simulatore' })).toHaveAttribute(
    'href',
    `/enigma/?${encodeConfig(defaultConfig('I'))}`,
  );
});

test('senza WebGL resta un avviso con il rimando al simulatore', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type.startsWith('webgl') ? null : getContext.call(this, type, ...(rest as []));
    } as typeof getContext;
  });
  const urls = richieste(page);
  await page.goto('macchina/');
  await avvia(page).click();
  await expect(page.getByRole('note').filter({ hasText: 'non ha WebGL' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Apri il simulatore' })).toHaveAttribute('href', /^\/enigma\/\?v=1/);
  expect(urls.filter(pesante)).toEqual([]);
});
