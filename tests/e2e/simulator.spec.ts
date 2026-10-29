import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const typed = (page: Page) => page.locator('[data-tape="input"]');
const lit = (page: Page) => page.locator('[data-tape="output"]');
const wheel = (page: Page, slot: string) => page.getByRole('spinbutton', { name: `Posizione del rotore ${slot}` });
const screenKey = (page: Page, letter: string) =>
  page.getByRole('region', { name: 'Tastiera' }).getByRole('button', { name: letter, exact: true });

async function open(page: Page, query = '') {
  await page.goto(`simulatore/${query}`);
  await expect(page.getByRole('heading', { name: 'Nastro' })).toBeVisible();
}

test('la tastiera fisica cifra, ignora i tasti speciali e Backspace annulla', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Tastiera fisica solo su desktop.');
  await open(page);
  await page.keyboard.type('Hello');
  await expect(lit(page)).toHaveText('ILBDA');
  await expect(wheel(page, 'destro')).toHaveAttribute('aria-valuetext', 'F');

  for (const key of ['Shift', 'ArrowLeft', 'F1', 'Comma', 'Digit1', 'Space', 'Control+KeyA'])
    await page.keyboard.press(key);
  await expect(typed(page)).toHaveText('HELLO');

  await page.keyboard.press('Shift+KeyX');
  await expect(typed(page)).toHaveText('HELLO X');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await expect(typed(page)).toHaveText('HELL');
  await expect(wheel(page, 'destro')).toHaveAttribute('aria-valuetext', 'E');
  await page.getByRole('button', { name: 'Ripeti' }).click();
  await expect(lit(page)).toHaveText('ILBDA');
  await expect(page.locator('[data-lit]')).toHaveText('A');
});

test('i tasti a schermo funzionano e i campi di testo non digitano sulla macchina', async ({ page }) => {
  await open(page);
  for (const letter of 'HELLO') await screenKey(page, letter).click();
  await expect(lit(page)).toHaveText('ILBDA');
  await page.getByLabel('Coppie collegate', { exact: true }).fill('ab');
  await expect(typed(page)).toHaveText('Ancora nessuna lettera.');
});

test('un link condivisibile riapre configurazione e messaggio', async ({ page }) => {
  // Barbarossa, parte 1: UKW-B, rotori II IV V, anelli BUL, posizione BLA.
  const message =
    'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLTTDEISMDICAGYKUACTCDOMOHWXMUUIAUBSTSLRNBZSZWNRFXWFYSSXJZVIJHIDISHPRKLKAYUPADTXQSPINQMATLPIFSVKDASCTACDPBOPVHJK';
  await open(page, `?v=1&m=I&w=II-IV-V&r=BUL&p=BLA&u=B&s=AV.BS.CG.DL.FU.HZ.IN.KM.OW.RX&t=${message}`);
  await expect(lit(page)).toContainText('AUFKL XABTE ILUNG');
  await expect(page.getByLabel('Coppie collegate', { exact: true })).toHaveValue('AV BS CG DL FU HZ IN KM OW RX');

  await page.getByLabel('Rotore destro', { exact: true }).selectOption('III');
  await expect(page).toHaveURL(/w=II-IV-III/);
  await page.reload();
  await expect(page.getByLabel('Rotore destro', { exact: true })).toHaveValue('III');
  await expect(typed(page)).toHaveText('Ancora nessuna lettera.');
});

test('un link non valido carica la configurazione di base e lo dice', async ({ page }) => {
  await open(page, '?v=1&m=I&w=I-I-II&r=AAA&p=AAA&u=B');
  await expect(page.getByText('Il link aperto non è valido')).toBeVisible();
  await expect(page.getByLabel('Rotore sinistro', { exact: true })).toHaveValue('I');
});

test('la tastiera resta bloccata finché l’Uhr non ha 10 cavi', async ({ page }) => {
  await open(page);
  await page.getByLabel('Collega l’Uhr al posto dei cavi').check();
  await expect(page.getByText('L’Uhr richiede esattamente 10 cavi sul pannello')).toBeVisible();
  await expect(screenKey(page, 'Q')).toBeDisabled();
  await page.getByLabel('Coppie collegate', { exact: true }).fill('AB CD EF GH IJ KL MN OP QR ST');
  await expect(screenKey(page, 'Q')).toBeEnabled();
});

test('sulla M4 l’UKW-D toglie il rotore sottile', async ({ page }) => {
  await open(page);
  await page.getByLabel('Modello', { exact: true }).selectOption('M4');
  await expect(page.getByLabel('Rotore sottile', { exact: true })).toHaveValue('Beta');
  await page.getByLabel('Riflettore (UKW)', { exact: true }).selectOption('D');
  await expect(page.getByLabel('Rotore sottile', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Coppie del riflettore')).toHaveValue(/^(\w\w ){11}\w\w$/);
});

test('il simulatore in uso è accessibile, anche in tema scuro', async ({ page }) => {
  await open(page);
  await screenKey(page, 'A').click();
  await page.getByLabel('Mostra tutti i collegamenti').check();
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('la traccia passo-passo segue il segnale dell’ultimo tasto', async ({ page }) => {
  await open(page);
  const trace = page.getByRole('region', { name: 'Traccia passo-passo' });
  await expect(trace).toContainText('Premi un tasto per seguirne il percorso');
  await screenKey(page, 'A').click();
  await expect(trace).toContainText('Passo 13 di 13');
  await expect(trace).toContainText('Si accende la lampada B');

  await trace.getByRole('button', { name: 'Primo passo' }).click();
  await expect(trace).toContainText('Passo 1 di 13');
  await expect(trace).toContainText('AAA → AAB. Si muove il rotore destro.');
  await expect(page.locator('[data-lit]')).toHaveCount(0);

  for (let i = 0; i < 3; i++) await trace.getByRole('button', { name: 'Passo successivo' }).click();
  await expect(trace).toContainText('Rotore III (destro), andata, con B nella finestrella');
  await expect(
    trace.getByRole('region', { name: 'Sostituzione operata dal componente in questo momento' }),
  ).toBeVisible();
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }

  await trace.getByRole('button', { name: 'Avvia' }).click();
  await expect(trace).toContainText('Passo 5 di 13');
  await trace.getByRole('button', { name: 'Ferma' }).click();
  await trace.getByRole('button', { name: 'Ultimo passo' }).click();
  await expect(page.locator('[data-lit]')).toHaveText('B');

  // Un tasto nuovo riporta la traccia al percorso completo.
  await trace.getByRole('button', { name: 'Primo passo' }).click();
  await screenKey(page, 'A').click();
  await expect(trace).toContainText('Passo 13 di 13');
});
