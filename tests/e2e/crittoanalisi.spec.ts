import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PAGE = 'prove/crittoanalisi/';

/** Porta in vista un’isola, aspetta che si idrati e la restituisce. */
async function island(page: Page, index: number): Promise<Locator> {
  const element = page.locator('astro-island').nth(index);
  await element.scrollIntoViewIfNeeded();
  await expect(element).not.toHaveAttribute('ssr');
  return element;
}

test('la pagina delle animazioni di crittoanalisi è accessibile, in chiaro e in scuro', async ({ page }) => {
  await page.goto(PAGE);
  await island(page, 0);
  await island(page, 1);
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('gli indicatori chiudono i cicli di AD, BE e CF uno dopo l’altro', async ({ page }) => {
  await page.goto(PAGE);
  const figure = await island(page, 0);
  await expect(figure.getByText('Nessun indicatore ancora')).toBeVisible();
  await figure.getByRole('button', { name: 'Aggiungi un indicatore' }).click();
  await expect(figure.getByText(/^Indicatore 1: chiave/)).toBeVisible();
  await figure.getByRole('button', { name: 'Aggiungine dieci' }).click();
  await expect(figure.getByText(/^Indicatore 11: chiave/)).toBeVisible();
  await expect(figure.getByRole('button', { name: 'Ricomincia' })).toBeEnabled();

  await figure.getByRole('button', { name: 'Completa la caratteristica' }).click();
  await expect(figure.getByText('La permutazione è completa')).toHaveCount(3);
  await expect(figure.getByText('26 lettere su 26', { exact: true })).toHaveCount(3);
  // I cicli di ogni lunghezza sono a coppie (Rejewski 1980, p. 9).
  await expect(figure.getByText('I cicli di ogni lunghezza sono in numero pari.')).toHaveCount(3);
  await expect(figure.getByRole('button', { name: 'Completa la caratteristica' })).toBeDisabled();

  await figure.getByRole('button', { name: 'Ricomincia' }).click();
  await expect(figure.getByText('Nessun indicatore ancora')).toBeVisible();
});

test('il menu propone un anello e l’ipotesi giusta regge fino in fondo', async ({ page }) => {
  await page.goto(PAGE);
  const figure = await island(page, 1);
  await expect(figure.getByRole('list', { name: 'Crib allineato al testo cifrato' }).getByRole('listitem')).toHaveCount(
    16,
  );
  await figure.getByRole('button', { name: 'Percorri l’anello' }).click();
  await figure.getByRole('button', { name: 'Mostra tutte' }).click();
  await expect(figure.getByText(/^Tutte le \d+ deduzioni sono coerenti/)).toBeVisible();
});

test('con i rotori spostati l’ipotesi si contraddice e la prova si ferma', async ({ page }) => {
  await page.goto(PAGE);
  const figure = await island(page, 1);
  await figure.getByLabel('Rotori').selectOption({ label: 'spostati di 3 passi' });
  await figure.getByRole('button', { name: 'Mostra tutte' }).click();
  await expect(figure.getByText(/^Contraddizione alla deduzione \d+/)).toBeVisible();
  const items = figure.getByRole('list', { name: 'Deduzioni, in ordine' }).getByRole('listitem');
  expect(await items.count()).toBeLessThan(40);
  await figure.getByRole('button', { name: 'Da capo' }).click();
  await expect(items).toHaveCount(1);
});

test('con prefers-reduced-motion i tracciati compaiono senza movimento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE);
  const figure = await island(page, 1);
  await figure.getByRole('button', { name: 'Percorri l’anello' }).click();
  const names = await figure
    .locator('.tracciato')
    .evaluateAll((lines) => lines.map((l) => getComputedStyle(l).animationName));
  expect(names.length).toBeGreaterThan(0);
  expect(new Set(names)).toEqual(new Set(['none']));
});
