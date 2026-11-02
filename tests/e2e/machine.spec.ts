import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const barbarossa = '?v=1&m=I&w=II-IV-V&r=BUL&p=BLA&u=B&s=AV.BS.CG.DL.FU.HZ.IN.KM.OW.RX';

test('la vista Macchina segue il simulatore e la tastiera fisica', async ({ page }) => {
  await page.goto(`simulatore/${barbarossa}`);
  await page.getByText('Macchina', { exact: true }).click();
  const machine = page.getByRole('img', { name: 'La macchina' });
  await expect(machine).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Schema del circuito' })).toHaveCount(0);

  // Il focus è sul pulsante di opzione appena scelto: le lettere vanno comunque alla macchina.
  await page.keyboard.type('EDPUD');
  await expect(page.locator('[data-tape="output"]')).toHaveText('AUFKL');
  await expect(machine.locator('[data-lamp="L"][data-lit]')).toHaveCount(1);
  await expect(machine.locator('[data-lit]')).toHaveCount(1);
  // Dieci cavi, venti spine.
  await expect(machine.locator('path.stroke-cable-a, path.stroke-cable-b')).toHaveCount(10);
  await expect(machine).toHaveAccessibleDescription(/Sul pannello a spine 10 cavi: AV BS CG/);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('la scelta della vista resta e si possono vedere entrambe', async ({ page }) => {
  await page.goto('simulatore/');
  await page.getByText('Entrambe', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'La macchina' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Schema del circuito' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Entrambe' })).toBeChecked();
});

test('i modelli senza pannello e la M4 cambiano il disegno', async ({ page }) => {
  await page.goto('simulatore/?v=1&m=G31&w=I-II-III&r=AAA&p=AAA&u=UKW');
  await page.getByText('Macchina', { exact: true }).click();
  const machine = page.getByRole('img', { name: 'La macchina' });
  await expect(machine).toHaveAccessibleDescription(/non ha il pannello a spine/);
  await expect(machine.getByText('UKW', { exact: true })).toBeVisible();

  await page.goto('simulatore/?v=1&m=M4&w=Beta-II-IV-I&r=AAAV&p=VJNA&u=B-thin');
  await expect(machine.getByText('Beta', { exact: true })).toBeVisible();
});
