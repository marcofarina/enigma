import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  '',
  'come-funziona/',
  'come-funziona/che-cos-e-enigma/',
  'storia/',
  'glossario/',
  'storia/galleria/',
  'crittoanalisi/',
  'schede/',
  'fonti/',
  'docenti/',
];

for (const path of pages) {
  test(`la pagina /${path} si carica ed è accessibile`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Enigma/);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('il tema scuro si attiva e viene ricordato', async ({ page, isMobile }) => {
  await page.goto('come-funziona/');
  await page.emulateMedia({ colorScheme: 'light' });
  // Sul telefono il pulsante del tema sta nel menu a foglio sotto la barra.
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /tema/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('a 375 px l’intestazione sta su una riga e il menu si apre e si chiude', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('come-funziona/');
  const brand = page.getByRole('link', { name: /^Enigma/ });
  const menu = page.getByRole('button', { name: 'Menu' });
  const [a, b] = [await brand.boundingBox(), await menu.boundingBox()];
  expect(a && b && Math.abs(a.y - b.y)).toBeLessThan(1);
  expect(b?.height).toBeGreaterThanOrEqual(44);
  expect(b?.width).toBeGreaterThanOrEqual(44);

  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Simulatore', exact: true })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Come funziona', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('il glossario è ordinato, collega le lezioni ed è accessibile', async ({ page }) => {
  await page.goto('glossario/');
  await expect(page.getByRole('heading', { level: 1, name: 'Glossario' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Iniziali del glossario' })).toBeVisible();
  const entry = page.locator('#riflettore');
  await expect(entry).toContainText('Umkehrwalze (UKW)');
  await expect(entry).toContainText('reflector');
  await entry.getByRole('link', { name: 'Approfondisci' }).click();
  await expect(page).toHaveURL(/come-funziona\/il-riflettore\/$/);
});

test('la galleria mostra ogni immagine con i crediti', async ({ page }) => {
  await page.goto('storia/galleria/');
  const figures = page.locator('figure');
  expect(await figures.count()).toBeGreaterThan(5);
  for (const figure of await figures.all()) {
    await expect(figure.locator('img')).toHaveAttribute('alt', /.{20,}/);
    await expect(figure.getByRole('link', { name: 'fonte' })).toHaveAttribute(
      'href',
      /^https:\/\/commons\.wikimedia\.org\//,
    );
  }
  await page.goto('fonti/');
  await expect(page.getByText('Alessandro Nassiri', { exact: false }).first()).toBeVisible();
});

test('la guida per i docenti è nel menu e i suoi link aprono le procedure che descrive', async ({ page, isMobile }) => {
  await page.goto('come-funziona/');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Docenti' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Guida per i docenti' })).toBeVisible();
  // Sul telefono il menu a foglio si chiude con la navigazione: la voce corrente si vede solo a desktop.
  if (!isMobile) await expect(page.getByRole('link', { name: 'Docenti' })).toHaveAttribute('aria-current', 'page');

  // La serie di schede: primo numero e numero di schede vengono dall’indirizzo.
  await page.getByRole('link', { name: 'questo link apre la serie dalla n. 100 alla n. 124' }).click();
  await expect(page.getByText('Verranno stampate 25 schede, dalla n. 100 alla n. 124.')).toBeVisible();
  await page.goBack();

  // La stessa variante per tutta la classe.
  await page.getByRole('link', { name: 'questa è la variante 4827 di «Decifra un messaggio»' }).click();
  await expect(page.getByText('Variante 4827')).toBeVisible();
  await expect(page.getByText('RUKCR RTYSU CETAC UOUJS EGZZU NCKHI EK')).toBeVisible();
});

test('a 768 px le sette voci dell’intestazione stanno su una riga', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('docenti/');
  const nav = page.getByRole('navigation', { name: 'Navigazione principale' }).first();
  const links = nav.getByRole('link');
  await expect(links).toHaveCount(7);
  const boxes = await Promise.all((await links.all()).map((link) => link.boundingBox()));
  const heights = boxes.map((box) => box?.height ?? 0);
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
});
