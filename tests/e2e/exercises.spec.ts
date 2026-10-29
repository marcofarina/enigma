import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function axe(page: Page) {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
}

test('l’elenco degli esercizi è diviso per livello ed è accessibile', async ({ page }) => {
  await page.goto('esercizi/');
  await expect(page.getByRole('heading', { name: 'Livello 1 — Operatore' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Livello 2 — Meccanica' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cifra un messaggio', exact: true })).toBeVisible();
  await expect(page.getByText('Non ancora risolto').first()).toBeVisible();
  await axe(page);
});

test('un esercizio corregge la risposta e ricorda le varianti risolte', async ({ page }) => {
  await page.goto('esercizi/cifra/?seme=1234');
  await expect(page.getByRole('heading', { name: 'Variante 1234' })).toBeVisible();
  const answer = page.getByLabel('Testo cifrato', { exact: true });
  await answer.fill('AAAAA');
  await page.getByRole('button', { name: 'Verifica' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Non ancora' })).toBeVisible();

  await page.getByText('Mostra la soluzione').click();
  const solution = await page.getByText(/^Il testo cifrato è /).textContent();
  const cipher = solution?.replace('Il testo cifrato è ', '').replace('.', '') ?? '';
  await answer.fill(cipher.toLowerCase());
  await page.getByRole('button', { name: 'Verifica' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Corretto!' })).toBeVisible();
  await expect(page.getByText('Varianti risolte: 1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rivedi nel simulatore' })).toHaveAttribute('href', /simulatore\/\?v=1/);

  await page.goto('esercizi/');
  await expect(
    page.locator('li', { has: page.getByRole('link', { name: 'Cifra un messaggio', exact: true }) }),
  ).toContainText('Varianti risolte: 1');
});

test('una nuova variante cambia il seme nell’indirizzo', async ({ page }) => {
  await page.goto('esercizi/posizioni/?seme=77');
  await expect(page.getByRole('heading', { name: 'Variante 77' })).toBeVisible();
  await page.getByRole('button', { name: 'Nuova variante' }).click();
  await expect(page.getByRole('heading', { name: 'Variante 77' })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get('seme')).not.toBe('77');
  await page.getByLabel('Numero della variante').fill('77');
  await page.getByRole('button', { name: 'Apri' }).click();
  await expect(page.getByRole('heading', { name: 'Variante 77' })).toBeVisible();
});

test('gli esercizi di meccanica non mostrano il simulatore e sono accessibili', async ({ page }) => {
  for (const id of ['a-mano', 'impossibile', 'posizioni']) {
    await page.goto(`esercizi/${id}/?seme=5`);
    await expect(page.getByRole('heading', { name: 'Variante 5' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Simulatore' })).toHaveCount(0);
    await axe(page);
  }
});

test('gli esercizi da operatore hanno il simulatore e sono accessibili', async ({ page }) => {
  for (const id of ['foglio-chiave', 'indicatore']) {
    await page.goto(`esercizi/${id}/?seme=5`);
    await expect(page.getByRole('heading', { name: 'Simulatore' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Foglio chiave' })).toBeVisible();
    await axe(page);
  }
});
