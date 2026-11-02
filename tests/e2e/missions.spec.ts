import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const wheel = (page: Page, slot: string) => page.getByRole('spinbutton', { name: `Posizione del rotore ${slot}` });

async function setWindows(page: Page, letters: string) {
  const slots = ['sinistro', 'centrale', 'destro'];
  for (const [i, slot] of slots.entries()) await wheel(page, slot).press(letters[i] ?? 'A');
}

test('l’elenco delle missioni è accessibile', async ({ page }) => {
  await page.goto('missioni/');
  await expect(page.getByRole('heading', { level: 1, name: 'Missioni storiche' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Operazione Barbarossa, parte 1/ })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('si decifra l’indicatore e poi il messaggio di Barbarossa', async ({ page }) => {
  await page.goto('missioni/barbarossa-parte-1/');
  const status = page.locator('[data-mission]');
  await expect(status).toHaveAttribute('data-mission', 'empty');

  // L’indicatore: rotori su WXC, si digita KCH e le lampade danno la chiave del messaggio.
  await setWindows(page, 'WXC');
  await page.getByRole('button', { name: 'K', exact: true }).click();
  await page.getByRole('button', { name: 'C', exact: true }).click();
  await page.getByRole('button', { name: 'H', exact: true }).click();
  await expect(page.locator('[data-tape="output"]')).toHaveText('BLA');
  await expect(status).toHaveAttribute('data-mission', 'other');

  await setWindows(page, 'BLA');
  const cipher = (await page.locator('[data-cipher]').textContent()) ?? '';
  await page.getByLabel('Testo da cifrare o decifrare').fill(cipher.slice(0, 11));
  await page.getByRole('button', { name: 'Digita sulla macchina' }).click();
  await expect(status).toContainText('Finora tutto torna: 10 lettere');
  await page.getByLabel('Testo da cifrare o decifrare').fill(cipher.slice(11));
  await page.getByRole('button', { name: 'Digita sulla macchina' }).click();
  await expect(status).toHaveAttribute('data-mission', 'solved');

  await page.getByText('Mostra il testo decifrato e la traduzione').click();
  await expect(page.getByText(/Kurtinowa a nord-ovest di Sebež/)).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('una chiave sbagliata viene segnalata', async ({ page }) => {
  await page.goto('missioni/scharnhorst/');
  await setWindows(page, 'UZW');
  await page.getByLabel('Testo da cifrare o decifrare').fill('YKAEN');
  await page.getByRole('button', { name: 'Digita sulla macchina' }).click();
  await expect(page.locator('[data-mission]')).toHaveAttribute('data-mission', 'wrong');
});
