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
  'come-funziona/che-cos-e-enigma',
  'come-funziona/dalla-sostituzione-al-rotore',
  'come-funziona/tastiera-lampade-e-circuito',
  'come-funziona/i-rotori',
  'come-funziona/il-passo-e-il-doppio-passo',
  'come-funziona/il-riflettore',
  'come-funziona/il-pannello-a-spine',
  'come-funziona/l-uhr',
  'come-funziona/la-matematica-di-enigma',
  'come-funziona/quante-chiavi',
  'storia/scherbius-e-le-macchine-commerciali',
  'storia/l-adozione-militare',
  'storia/fogli-chiave-e-procedure',
  'storia/enigma-e-l-italia',
  'crittoanalisi/rejewski-e-la-teoria-dei-cicli',
  'crittoanalisi/il-ciclometro-e-il-catalogo',
  'crittoanalisi/la-bomba-e-i-fogli-di-zygalski',
  'crittoanalisi/il-crib-e-la-bombe',
  'crittoanalisi/la-m4-e-shark',
  'crittoanalisi/quanto-conto-ultra',
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

test('la lezione apre con citazione, prerequisiti e obiettivi e chiude con il riepilogo', async ({ page }) => {
  await page.goto('come-funziona/il-passo-e-il-doppio-passo/');
  const quote = page.locator('figure', { has: page.locator('blockquote') }).first();
  await expect(quote.locator('figcaption')).toContainText('Crypto Museum');
  await expect(quote.locator('figcaption')).toContainText('traduzione nostra');
  for (const name of ['Prerequisiti', 'Obiettivi', 'Riepilogo']) {
    await expect(page.getByRole('region', { name })).toBeVisible();
  }
  await expect(
    page.getByRole('region', { name: 'Prerequisiti' }).getByRole('link', { name: 'I rotori' }),
  ).toBeVisible();
});

test('la previsione libera confronta la risposta scritta con l’esito', async ({ page }) => {
  await page.goto('come-funziona/il-passo-e-il-doppio-passo/');
  const prediction = page.getByRole('group', { name: 'Previsione' }).first().locator('xpath=..');
  const check = prediction.getByRole('button', { name: 'Confronta con l’esito' });
  await check.click();
  await expect(prediction.locator('[data-verdetto]')).toHaveText(
    'Scrivi una previsione prima di confrontarla con l’esito.',
  );

  // Maiuscole e spazi non contano: «a e x» è la risposta prevista AEX, con il suo commento.
  await prediction.getByRole('textbox', { name: 'La tua previsione' }).fill('a e x');
  await check.click();
  await expect(prediction.locator('[data-verdetto]')).toHaveText(
    'Previsione sbagliata. La tua previsione: a e x. Esito: BFX.',
  );
  await expect(prediction.getByText('È la risposta del contachilometri')).toBeVisible();
  await expect(prediction.getByText('Verificalo nell’animazione')).toBeVisible();
  const restart = prediction.getByRole('button', { name: 'Ricomincia' });
  await expect(restart).toBeFocused();

  await restart.click();
  await expect(prediction.getByText('È la risposta del contachilometri')).toBeHidden();
  await prediction.getByRole('textbox', { name: 'La tua previsione' }).fill('BFX');
  await check.click();
  await expect(prediction.locator('[data-verdetto]')).toHaveText('Previsione giusta. La tua previsione: BFX.');
});

test('la previsione a scelta segna la risposta data e l’esito, anche in tema scuro', async ({ page }) => {
  await page.goto('come-funziona/il-passo-e-il-doppio-passo/');
  const prediction = page.getByRole('group', { name: 'Previsione' }).nth(1).locator('xpath=..');
  await prediction.getByRole('radio', { name: 'uguale' }).check();
  await prediction.getByRole('button', { name: 'Confronta con l’esito' }).click();
  await expect(prediction.locator('[data-verdetto]')).toHaveText(
    'Previsione sbagliata. La tua previsione: uguale. Esito: più corto.',
  );
  await expect(prediction.getByText('Sarebbe così con un contachilometri')).toBeVisible();
  await expect(prediction.getByRole('radio', { name: /più corto/ })).toBeDisabled();
  await expect(prediction.locator('[data-corretta] [data-segno]')).toHaveText('esito');
  // Lo stato rivelato (scelte bloccate, segni, commento) deve restare accessibile. Verdetto ed esito
  // compaiono con una dissolvenza: axe misura il contrasto a movimento finito.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
  );
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const results = await new AxeBuilder({ page })
      .include('form[data-previsione]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
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
  const board = await island(page, 'come-funziona/il-pannello-a-spine/', 1);
  await expect(board.locator('p[aria-live]').last()).toContainText('3 cavi');
  await board.getByRole('textbox').fill('AZ BN GI KL PC ED QT HV MF JR');
  await expect(board.locator('p[aria-live]').last()).toContainText('150\u00a0738\u00a0274\u00a0937\u00a0250');
});

test('l’Uhr è reciproca solo nelle posizioni multiple di quattro', async ({ page }) => {
  const uhr = await island(page, 'come-funziona/l-uhr/');
  const status = uhr.locator('p[aria-live]');
  await expect(status).toContainText('Posizione 00: la sostituzione è reciproca');
  await uhr.getByRole('combobox', { name: 'Posizione del selettore' }).selectOption('3');
  await expect(status).toContainText('La A va in C, ma la C non torna in A: va in K.');
  await uhr.getByRole('button', { name: 'Posizione successiva' }).click();
  await expect(status).toContainText('Posizione 04: la sostituzione è reciproca');
});

test('con l’Uhr in posizione 03 la macchina resta reciproca', async ({ page }) => {
  const mini = await island(page, 'come-funziona/l-uhr/', 1);
  const keyboard = mini.getByRole('region', { name: 'Tastiera' });
  const output = mini.locator('[data-tape="output"]');
  const type = async (text: string) => {
    for (const letter of text) await keyboard.getByRole('button', { name: letter, exact: true }).click();
  };
  await type('WETTER');
  await expect(output).toHaveText(/^C\s*L\s*S\s*X\s*Q\s*B$/);
  await mini.getByRole('button', { name: 'Ricomincia' }).click();
  await type('CLSXQB');
  await expect(output).toHaveText(/^W\s*E\s*T\s*T\s*E\s*R$/);
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
  const calculator = await island(page, 'come-funziona/quante-chiavi/');
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
