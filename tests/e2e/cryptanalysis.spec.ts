import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Le isole `client:visible` si idratano quando entrano nello schermo: prima non rispondono ai clic. */
async function island(page: Page, path: string, text: string) {
  await page.goto(path);
  const element = page.locator('astro-island', { hasText: text });
  await element.scrollIntoViewIfNeeded();
  await expect(element).not.toHaveAttribute('ssr');
  return element;
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
}

test('la sezione di crittoanalisi elenca le lezioni nell’ordine', async ({ page }) => {
  await page.goto('crittoanalisi/');
  const links = page.getByRole('main').getByRole('listitem').getByRole('link');
  await expect(links.first()).toContainText('Rejewski e la teoria delle permutazioni');
  await expect(links).toHaveCount(5);
  await axe(page);
});

test('gli indicatori riempiono le tabelle e i cicli vanno a coppie', async ({ page }) => {
  const figure = await island(page, 'crittoanalisi/rejewski-e-la-teoria-delle-permutazioni/', 'Intercetta');
  for (let i = 0; i < 20; i++) await figure.getByRole('button', { name: /Intercetta/ }).click();
  await expect(figure.getByText('Indicatori intercettati: 200')).toBeVisible();
  const structures = figure.getByText(/^Tabella completa\. Lunghezze dei cicli:/);
  await expect(structures).toHaveCount(3);
  for (const text of await structures.allTextContents()) {
    const lengths = text
      .replace(/.*cicli: ([\d, ]+)\..*/, '$1')
      .split(', ')
      .map(Number);
    expect(lengths.reduce((a, b) => a + b, 0)).toBe(26);
  }
  await figure.getByLabel(/Confronta/).check();
  await expect(figure.getByRole('table', { name: /con e senza i cavi/ })).toBeVisible();
  await axe(page);
});

test('la Bombe si ferma sulla chiave vera solo con il crib al posto giusto', async ({ page }) => {
  const figure = await island(page, 'crittoanalisi/bletchley-park-e-la-bombe/', 'Dove sta il crib?');
  const status = figure.getByRole('status');
  await expect(status).toContainText('Posizione 4: impossibile');
  await expect(figure.getByRole('button', { name: 'Avvia la Bombe' })).toHaveCount(0);
  await figure.getByLabel('Posizione').fill('0');
  await expect(status).toContainText('Posizione 1: nessuna lettera coincide');
  await figure.getByRole('button', { name: 'Avvia la Bombe' }).click();
  await expect(figure.getByText('LBU: E collegata con I')).toBeVisible({ timeout: 30_000 });
  await expect(figure.getByText('è la chiave vera')).toBeVisible();
  await axe(page);
});
