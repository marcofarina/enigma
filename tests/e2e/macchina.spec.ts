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
/** Le cinque fasi dello smontaggio sono un gruppo di pulsanti di opzione. */
const fasi = (page: Page) => page.getByRole('radiogroup', { name: 'Smontaggio' });
const fase = (page: Page, nome: string) => page.getByRole('radio', { name: nome, exact: true });
const finestrelle = (page: Page) => page.locator('[data-finestrelle]');
const tempoClip = (page: Page) => page.locator('canvas');
const MESSAGGIO_BLOCCO = 'La macchina è smontata e non cifra: scegli «macchina chiusa» nell’elenco.';

/** Sul telefono le viste sono un menu, a desktop quattro pulsanti: questo sceglie l'una o l'altra. */
async function scegliVista(page: Page, nome: string) {
  const pulsante = page.getByRole('button', { name: nome, exact: true });
  if (await pulsante.isVisible()) await pulsante.click();
  else await page.getByLabel('Vista', { exact: true }).selectOption({ label: nome });
}

/** La camera come la scrive la scena: azimut, angolo polare e distanza. */
const camera = async (page: Page) => (await page.locator('canvas').getAttribute('data-camera')) ?? '';

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
  await expect(page.getByRole('link', { name: 'Apri nel simulatore' })).toHaveAttribute(
    'href',
    `/?${encodeConfig(config)}&t=CIAO`,
  );
});

test('con un’Enigma M4 nella query avvisa e rimanda al simulatore', async ({ page }) => {
  const query = encodeConfig(defaultConfig('M4'));
  await page.goto(`macchina/?${query}`);
  await expect(page.getByRole('note').filter({ hasText: MODELS.M4.label })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Apri il link nel simulatore' })).toHaveAttribute('href', `/?${query}`);
  // Sotto c’è l’Enigma I di base.
  await expect(page.getByRole('link', { name: 'Apri nel simulatore' })).toHaveAttribute(
    'href',
    `/?${encodeConfig(defaultConfig('I'))}`,
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
  await expect(page.getByRole('link', { name: 'Apri il simulatore' })).toHaveAttribute('href', /^\/\?v=1/);
  expect(urls.filter(pesante)).toEqual([]);
});

test.describe('smontaggio', () => {
  test.setTimeout(60_000);

  test('l’elenco ha cinque fasi e la clip arriva alla fase scelta', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await expect(fasi(page).getByRole('radio')).toHaveCount(5);
    await expect(fase(page, 'macchina chiusa')).toBeChecked();
    await fase(page, 'meccanica sotto i tasti').check();
    await expect(fase(page, 'meccanica sotto i tasti')).toBeChecked();
    // La clip dura 4 s e si ferma un attimo prima, dove un'azione che si ripete tornerebbe a zero.
    await expect(tempoClip(page)).toHaveAttribute('data-tempo-clip', /^3\.99/, { timeout: 15_000 });
    await fase(page, 'rotori estratti').check();
    await expect(tempoClip(page)).toHaveAttribute('data-tempo-clip', '2', { timeout: 15_000 });
    // Non c'è più «Rimonta la macchina»: si rimonta scegliendo la prima voce.
    await expect(page.getByRole('button', { name: 'Rimonta la macchina' })).toHaveCount(0);
    await fase(page, 'macchina chiusa').check();
    await expect(tempoClip(page)).toHaveAttribute('data-tempo-clip', '0', { timeout: 15_000 });
  });

  test('con le frecce l’elenco passa da una fase all’altra', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await fase(page, 'macchina chiusa').focus();
    await page.keyboard.press('ArrowDown');
    await expect(fase(page, 'macchina aperta')).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(fase(page, 'rotori aperti')).toBeChecked();
    await page.keyboard.press('ArrowUp');
    await expect(fase(page, 'rotori estratti')).toBeChecked();
  });

  test('a macchina smontata la tastiera non cifra e il messaggio viene annunciato', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await fase(page, 'rotori estratti').check();
    await scena(page).focus();
    await page.keyboard.press('a');
    await expect(annuncio(page)).toHaveText(MESSAGGIO_BLOCCO);
    await expect(page.locator('[data-blocco]')).toHaveText(MESSAGGIO_BLOCCO);
    await expect(page.locator('[data-nastro="tasti"]')).toHaveText('');
    await expect(finestrelle(page)).toHaveText('A A A');
    await page.keyboard.press('Backspace');
    await expect(annuncio(page)).toHaveText(MESSAGGIO_BLOCCO);

    // Rimontata, la macchina cifra di nuovo, e l'annuncio torna a essere la lampada.
    await fase(page, 'macchina chiusa').check();
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

  test('con prefers-reduced-motion la fase scelta si raggiunge subito', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', baseURL: baseURL ?? '' });
    const page = await context.newPage();
    await avviaDa(page, 'AAA');
    await fase(page, 'rotori aperti').check();
    await expect(tempoClip(page)).toHaveAttribute('data-tempo-clip', '3', { timeout: 5_000 });
    await context.close();
  });

  test('i cavi del pannello e il cablaggio non cambiano l’accessibilità', async ({ page }) => {
    const config = { ...defaultConfig('I'), plugboard: ['AF', 'TV', 'KO'] };
    await page.goto(`macchina/?${encodeConfig(config)}`);
    await avvia(page).click();
    await expect(scena(page)).toHaveAttribute('data-fase', 'pronta', { timeout: 45_000 });
    await fase(page, 'rotori aperti').check();
    await expect(tempoClip(page)).toHaveAttribute('data-tempo-clip', '3', { timeout: 15_000 });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('camera', () => {
  test.setTimeout(60_000);

  test('«Dall’alto» sceglie la vista e la camera si porta in verticale', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await expect(scena(page)).toHaveAttribute('data-vista', 'fase');
    await scegliVista(page, 'Dall’alto');
    await expect(scena(page)).toHaveAttribute('data-vista', 'alto');
    // L'angolo polare (il secondo numero) tende a 0,05 rad.
    await expect.poll(async () => Number((await camera(page)).split(' ')[1])).toBeLessThan(0.1);
    // Scegliere una fase azzera la vista; «Ripristina la vista» fa lo stesso.
    await fase(page, 'macchina aperta').check();
    await expect(scena(page)).toHaveAttribute('data-vista', 'fase');
    await scegliVista(page, 'Rotori');
    await expect(scena(page)).toHaveAttribute('data-vista', 'rotori');
    await page.getByRole('button', { name: 'Ripristina la vista' }).click();
    await expect(scena(page)).toHaveAttribute('data-vista', 'fase');
  });

  test('la pulsantiera si raggiunge con Tab dalla scena, nell’ordine scena, viste, zoom', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await expect(scena(page)).toBeFocused();
    await page.keyboard.press('Tab');
    const nellaPulsantiera = () => page.evaluate(() => document.activeElement?.closest('[data-pulsantiera]') !== null);
    expect(await nellaPulsantiera()).toBe(true);
    // Si arriva ai pulsanti dello zoom e del ripristino, e poi si esce dalla pulsantiera verso il foglio.
    await page.getByRole('button', { name: 'Allontana' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Avvicina' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Ripristina la vista' })).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await nellaPulsantiera()).toBe(false);
  });

  test('lo zoom con i pulsanti avvicina e allontana la camera', async ({ page }) => {
    await avviaDa(page, 'AAA');
    const distanza = async () => Number((await camera(page)).split(' ')[2]);
    await expect.poll(distanza).toBeGreaterThan(0);
    // La camera si assesta dopo l'inquadratura iniziale.
    await expect.poll(async () => (await camera(page)) === (await camera(page))).toBe(true);
    const prima = await distanza();
    await page.getByRole('button', { name: 'Avvicina' }).click();
    await expect.poll(distanza).toBeLessThan(prima * 0.9);
    await page.getByRole('button', { name: 'Allontana' }).click();
    await page.getByRole('button', { name: 'Allontana' }).click();
    await expect.poll(distanza).toBeGreaterThan(prima * 1.1);
  });

  test('una lettera con il fuoco sulla scena accende la lampada e non muove la camera', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await expect.poll(async () => (await camera(page)) === (await camera(page))).toBe(true);
    await page.waitForTimeout(1500); // l'inquadratura iniziale ha finito di assestarsi
    const prima = await camera(page);
    await scena(page).focus();
    for (const lettera of ['w', 'a', 's', 'd', 'q', 'e', 'z', 'x', 'ArrowLeft', 'ArrowUp', 'PageDown']) {
      await page.keyboard.press(lettera);
    }
    await expect(annuncio(page)).toContainText('Lampada');
    await page.waitForTimeout(500);
    expect(await camera(page)).toBe(prima);
  });
});

test.describe('schede dei pezzi', () => {
  test.setTimeout(60_000);
  const pezzi = (page: Page) => page.getByRole('button', { name: 'Pezzi', exact: true });
  const voce = (page: Page, nome: string) =>
    page.getByRole('region', { name: 'I pezzi della macchina' }).getByRole('button', { name: nome, exact: true });

  test('dall’elenco, con la tastiera, si apre la scheda e il fuoco torna dove era', async ({ page }) => {
    await page.goto('macchina/');
    // L’elenco c’è anche prima della vista 3D: la scheda è testo.
    await pezzi(page).focus();
    await page.keyboard.press('Enter');
    await expect(pezzi(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('heading', { name: 'I pezzi della macchina' })).toBeFocused();
    await expect(page.getByRole('region', { name: 'I pezzi della macchina' }).getByRole('listitem')).toHaveCount(21);

    await voce(page, 'Anello').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Anello', exact: true })).toBeFocused();
    const scheda = page.getByRole('region', { name: 'Anello', exact: true });
    await expect(
      scheda.getByRole('link', { name: 'Leggi la lezione «I rotori: cablaggio, posizione e anello»' }),
    ).toHaveAttribute('href', '/come-funziona/i-rotori/');
    // Prima della vista 3D non c’è niente da smontare.
    await expect(scheda.getByRole('button', { name: /^Smonta fino a/ })).toHaveCount(0);

    // Esc chiude la scheda e torna all’elenco, sulla voce che l’aveva aperta; un altro Esc torna al messaggio.
    await page.keyboard.press('Escape');
    await expect(voce(page, 'Anello')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(pezzi(page)).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Messaggio' })).toBeVisible();
  });

  test('ogni scheda porta a una lezione che esiste', async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'basta un progetto');
    await page.goto('macchina/');
    await pezzi(page).click();
    const nomi = await page
      .getByRole('region', { name: 'I pezzi della macchina' })
      .getByRole('button')
      .allTextContents();
    const lezioni = new Set<string>();
    for (const nome of nomi.filter((n) => n !== '×')) {
      await voce(page, nome).click();
      lezioni.add((await page.locator('[data-scheda] a[href^="/"]').getAttribute('href')) ?? '');
      await page.getByRole('button', { name: 'Chiudi la scheda' }).click();
    }
    expect(lezioni.size).toBeGreaterThan(4);
    for (const href of lezioni) expect((await request.get(href)).ok(), href).toBe(true);
  });

  test('a vista avviata la scheda porta lo smontaggio alla fase del pezzo e resta accessibile', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await pezzi(page).click();
    await voce(page, 'Corpo del rotore').click();
    await page.getByRole('button', { name: 'Smonta fino a «rotori aperti»' }).click();
    await expect(fase(page, 'rotori aperti')).toBeChecked();
    await expect(tempoClip(page)).toHaveAttribute('data-tempo-clip', '3', { timeout: 15_000 });
    // Le lampade non si muovono: niente pulsante.
    await page.getByRole('button', { name: 'Chiudi la scheda' }).click();
    await voce(page, 'Lampade').click();
    await expect(page.getByRole('button', { name: /^Smonta fino a/ })).toHaveCount(0);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('un clic su un pezzo del modello apre la sua scheda', async ({ page }) => {
    await avviaDa(page, 'AAA');
    await scegliVista(page, 'Pannello a spine');
    await page.waitForTimeout(800);
    const tela = page.locator('canvas');
    const box = await tela.boundingBox();
    if (!box) throw new Error('la scena non ha una tela');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator('[data-scheda]')).toHaveAttribute('data-scheda', /^(pannello-spine|sportello-spine)$/);
    await expect(page.locator('[data-scheda] h2')).toBeFocused();
    // Chiusa la scheda, il fuoco torna alla scena e il messaggio riappare.
    await page.keyboard.press('Escape');
    await expect(scena(page)).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Messaggio' })).toBeVisible();
  });
});
