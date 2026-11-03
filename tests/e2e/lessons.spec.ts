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
  'come-funziona/dalla-sostituzione-al-rotore',
  'come-funziona/tastiera-lampade-e-circuito',
  'come-funziona/i-rotori',
  'come-funziona/il-passo-e-il-doppio-passo',
  'come-funziona/il-riflettore',
  'come-funziona/il-pannello-a-spine-e-l-uhr',
  'come-funziona/la-matematica-di-enigma',
  'storia/scherbius-e-le-macchine-commerciali',
  'storia/l-adozione-militare',
  'storia/fogli-chiave-e-procedure',
  'storia/enigma-e-l-italia',
];

for (const path of lessons) {
  test(`la lezione ${path} è accessibile, anche in tema scuro`, async ({ page }) => {
    await page.goto(`${path}/`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Navigazione tra le lezioni' })).toBeVisible();
    // Le isole React si idratano quando entrano nello schermo: le porto tutte in vista una
    // per una e aspetto che perdano l’attributo `ssr`. `networkidle` non serviva allo scopo e
    // in locale non si risolveva su alcune pagine.
    const islands = page.locator('astro-island');
    for (let i = 0; i < (await islands.count()); i++) {
      await islands.nth(i).scrollIntoViewIfNeeded();
      await expect(islands.nth(i)).not.toHaveAttribute('ssr');
    }
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

test('il pannello a spine conta le configurazioni dei cavi collegati', async ({ page }) => {
  const board = await island(page, 'come-funziona/il-pannello-a-spine-e-l-uhr/');
  await expect(board.locator('p[aria-live]').last()).toContainText('3 cavi');
  await board.getByRole('textbox').fill('AZ BN GI KL PC ED QT HV MF JR');
  await expect(board.locator('p[aria-live]').last()).toContainText('150\u00a0738\u00a0274\u00a0937\u00a0250');
});

test('l’Uhr è reciproca solo nelle posizioni multiple di quattro', async ({ page }) => {
  const uhr = await island(page, 'come-funziona/il-pannello-a-spine-e-l-uhr/', 2);
  const status = uhr.locator('p[aria-live]');
  await expect(status).toContainText('Posizione 00: la sostituzione è reciproca');
  await uhr.getByRole('combobox', { name: 'Posizione del selettore' }).selectOption('3');
  await expect(status).toContainText('La A va in C, ma la C non torna in A: va in K.');
  await uhr.getByRole('button', { name: 'Posizione successiva' }).click();
  await expect(status).toContainText('Posizione 04: la sostituzione è reciproca');
});

test('i cicli del rotore cambiano lettere ma non lunghezze', async ({ page }) => {
  const cycles = await island(page, 'come-funziona/la-matematica-di-enigma/');
  const summary = cycles.locator('p[aria-live]');
  await expect(summary).toHaveText('Rotore I in posizione A: 7 cicli, di lunghezza 10, 4, 4, 3, 2, 2, 1.');
  await expect(cycles.getByText('(AELTPHQXRU)')).toBeVisible();
  await cycles.getByRole('combobox', { name: 'Posizione (finestrella)' }).selectOption('B');
  await expect(summary).toHaveText('Rotore I in posizione B: 7 cicli, di lunghezza 10, 4, 4, 3, 2, 2, 1.');
  await expect(cycles.getByText('(AELTPHQXRU)')).toHaveCount(0);
});

test('il calcolatore dà le impostazioni dell’Enigma I e della M4', async ({ page }) => {
  const calculator = await island(page, 'come-funziona/la-matematica-di-enigma/', 1);
  const summary = calculator.locator('p[aria-live]');
  await expect(summary).toHaveText('Circa 1,07 × 10²³ impostazioni, cioè una chiave di circa 76,5 bit.');
  await calculator.getByRole('button', { name: 'Enigma M4' }).click();
  await expect(summary).toContainText('6,26 × 10²⁵');
  await calculator.getByRole('checkbox').check();
  await expect(calculator.locator('tfoot')).toContainText('60 269 444 695 419 208 913 664 000');
});

test('nell’Enigma K la L premuta di continuo non dà mai L', async ({ page }) => {
  const mini = await island(page, 'storia/enigma-e-l-italia/');
  const key = mini.getByRole('region', { name: 'Tastiera' }).getByRole('button', { name: 'L', exact: true });
  for (let i = 0; i < 20; i++) await key.click();
  await expect(mini.locator('[data-tape=input]')).toHaveText('LLLLL LLLLL LLLLL LLLLL');
  const output = (await mini.locator('[data-tape=output]').textContent())?.replaceAll(' ', '') ?? '';
  expect(output).toHaveLength(20);
  expect(output).not.toContain('L');
});
