import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Apre una lezione e restituisce l’n-esima isola interattiva, dopo che si è idratata. */
async function island(page: Page, path: string, index = 0): Promise<Locator> {
  await page.goto(path);
  const element = page.locator('astro-island').nth(index);
  await element.scrollIntoViewIfNeeded();
  await expect(element).not.toHaveAttribute('ssr');
  return element;
}

const lessons = [
  'dalla-sostituzione-al-rotore',
  'tastiera-lampade-e-circuito',
  'i-rotori',
  'il-passo-e-il-doppio-passo',
  'il-riflettore',
];

for (const slug of lessons) {
  test(`la lezione ${slug} è accessibile, anche in tema scuro`, async ({ page }) => {
    await page.goto(`come-funziona/${slug}/`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Navigazione tra le lezioni' })).toBeVisible();
    // Le isole React si idratano quando entrano nello schermo.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}

test('il disco di Cesare cifra con spostamento tre', async ({ page }) => {
  const disc = await island(page, 'come-funziona/dalla-sostituzione-al-rotore/');
  await expect(disc.getByText('YHQLY LGLYL FL')).toBeVisible();
  await disc.getByRole('button', { name: 'Ruota il disco interno avanti di un passo' }).click();
  await expect(disc.getByText('Spostamento: 4')).toBeVisible();
});

test('nel circuito il tasto premuto accende la lampada dell’altra lettera', async ({ page }) => {
  const circuit = await island(page, 'come-funziona/tastiera-lampade-e-circuito/');
  await circuit.getByRole('button', { name: 'B', exact: true }).click();
  await expect(circuit.locator('p[aria-live]')).toContainText('Tasto B premuto');
  await expect(circuit.locator('p[aria-live]')).toContainText('alla lampada D.');
});

test('l’animazione mostra il doppio passo da ADU', async ({ page }) => {
  const animation = await island(page, 'come-funziona/il-passo-e-il-doppio-passo/');
  const press = animation.getByRole('button', { name: 'Premi un tasto' });
  for (let i = 0; i < 3; i++) await press.click();
  await expect(animation.getByRole('list', { name: 'Posizioni raggiunte' })).toHaveText(/ADU\s*ADV\s*AEW\s*BFX/);
  await expect(animation.getByText('avanza sinistro, centrale, destro')).toBeVisible();
});

test('il mini simulatore usa la tastiera fisica solo quando ha il focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Tastiera fisica solo su desktop.');
  const mini = await island(page, 'come-funziona/il-riflettore/');
  await page.keyboard.type('HELLO');
  await expect(mini.locator('[data-tape="input"]')).toHaveText('Ancora nessuna lettera.');
  await mini.getByRole('region', { name: 'Tastiera' }).getByRole('button', { name: 'H', exact: true }).click();
  await page.keyboard.type('ELLO');
  await expect(mini.locator('[data-tape="output"]')).toHaveText('ILBDA');
});
