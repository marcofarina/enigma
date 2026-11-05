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
const selettore = (page: Page) => page.getByLabel('Smontaggio', { exact: true });
const finestrelle = (page: Page) => page.locator('.macchina-nastro dd').first();
const MESSAGGIO_BLOCCO = 'La macchina è smontata e non cifra: riporta il selettore su «macchina chiusa».';

/** Apre `/macchina/` con l'Enigma I da `positions` (rotori I, II e III) e avvia la vista. */
async function avviaDa(page: Page, positions: string) {
  await page.goto(`macchina/?${encodeConfig({ ...defaultConfig('I'), positions })}`);
  await avvia(page).click();
  await expect(scena(page)).toHaveAttribute('data-fase', 'pronta', { timeout: 45_000 });
}

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

test.describe('smontaggio', () => {
  test.setTimeout(60_000);

  test('il selettore a 4 dice la fase in parole e porta la clip alla fine', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'macchina chiusa');
    await selettore(page).fill('4');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'meccanica sotto i tasti');
    // La clip dura 4 s e si ferma un attimo prima, dove un'azione che si ripete tornerebbe a zero.
    await expect(page.locator('canvas')).toHaveAttribute('data-tempo-clip', /^3\.99/);
    await selettore(page).fill('2.5');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'da rotori estratti a rotori aperti');
    await expect(page.locator('canvas')).toHaveAttribute('data-tempo-clip', '2.5');
    await page.getByRole('button', { name: 'Rimonta la macchina' }).click();
    await expect(selettore(page)).toHaveValue('0');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'macchina chiusa');
  });

  test('con i tasti freccia il selettore passa da una fase all’altra', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await selettore(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'macchina aperta');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'rotori aperti');
    await page.keyboard.press('ArrowLeft');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'rotori estratti');
  });

  test('a macchina smontata la tastiera non cifra e il messaggio viene annunciato', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await selettore(page).fill('2');
    await scena(page).focus();
    await page.keyboard.press('a');
    await expect(annuncio(page)).toHaveText(MESSAGGIO_BLOCCO);
    await expect(page.locator('[data-blocco]')).toHaveText(MESSAGGIO_BLOCCO);
    await expect(page.locator('[data-nastro="tasti"]')).toHaveText('');
    await expect(finestrelle(page)).toHaveText('A A A');
    await page.keyboard.press('Backspace');
    await expect(annuncio(page)).toHaveText(MESSAGGIO_BLOCCO);

    // Rimontata, la macchina cifra di nuovo, e l'annuncio torna a essere la lampada.
    await page.getByRole('button', { name: 'Rimonta la macchina' }).click();
    await expect(page.locator('[data-blocco]')).toHaveCount(0);
    await scena(page).focus();
    await page.keyboard.press('a');
    await expect(annuncio(page)).toHaveText(`Lampada ${encipherWith(defaultConfig('I'), 'A')}`);
    await expect(finestrelle(page)).toHaveText('A A B');
  });

  test('da ADU i rotori mostrano il doppio passo: ADV, AEW, BFX', async ({ page }) => {
    await avviaDa(page, 'ADU');
    await expect(finestrelle(page)).toHaveText('A D U');
    await scena(page).focus();
    for (const [lettera, attese] of [
      ['a', 'A D V'],
      ['b', 'A E W'], // il rotore III era sulla tacca: avanza anche il centrale
      ['c', 'B F X'], // il centrale è sulla tacca: avanzano insieme il centrale e quello di sinistra
      ['d', 'B F Y'],
    ] as const) {
      await page.keyboard.press(lettera);
      await expect(finestrelle(page)).toHaveText(attese);
    }
    expect(await page.locator('[data-nastro="lampade"]').textContent()).toBe(
      encipherWith({ ...defaultConfig('I'), positions: 'ADU' }, 'ABCD'),
    );
  });

  test('con prefers-reduced-motion il selettore sposta lo stesso i pezzi', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', baseURL: baseURL ?? '' });
    const page = await context.newPage();
    await avviaDa(page, 'AAA');
    await selettore(page).fill('3');
    await expect(page.locator('canvas')).toHaveAttribute('data-tempo-clip', '3');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'rotori aperti');
    await context.close();
  });

  test('i cavi del pannello e il cablaggio non cambiano l’accessibilità', async ({ page }) => {
    const config = { ...defaultConfig('I'), plugboard: ['AF', 'TV', 'KO'] };
    await page.goto(`macchina/?${encodeConfig(config)}`);
    await avvia(page).click();
    await expect(scena(page)).toHaveAttribute('data-fase', 'pronta', { timeout: 45_000 });
    await selettore(page).fill('3');
    await expect(selettore(page)).toHaveAttribute('aria-valuetext', 'rotori aperti');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
