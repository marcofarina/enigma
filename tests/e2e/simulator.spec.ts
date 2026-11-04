import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { defaultConfig, encipherWith, groupLetters } from '../../src/engine/index.ts';

// Il simulatore completo è per lo schermo del computer; i test della versione ridotta (sotto
// 1024×576) portano l'etichetta @compact e girano anche sul progetto mobile.
test.beforeEach(({ isMobile }, testInfo) => {
  test.skip(isMobile && !testInfo.tags.includes('@compact'), 'Il simulatore completo è per lo schermo del computer.');
});

const typed = (page: Page) => page.locator('[data-tape="input"]');
const lit = (page: Page) => page.locator('[data-tape="output"]');
const wheel = (page: Page, slot: string) => page.getByRole('spinbutton', { name: `Posizione del rotore ${slot}` });
const screenKey = (page: Page, letter: string) =>
  page.getByRole('group', { name: 'Tastiera' }).getByRole('button', { name: letter, exact: true });
const panel = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });

async function open(page: Page, query = '') {
  await page.goto(query);
  await expect(page.getByRole('heading', { name: 'Messaggio' })).toBeVisible();
  // Il simulatore registra la tastiera fisica in un effetto, dopo il primo disegno: due fotogrammi
  // bastano perché sia pronto, anche quando la pagina carica in fretta e i test girano in parallelo.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

async function expectAccessible(page: Page) {
  // Panelli e menu compaiono con una dissolvenza: axe misura il contrasto a movimento finito.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
}

for (const [width, height] of [
  [1280, 720],
  [1440, 900],
  [1920, 1080],
] as const) {
  test(`a ${width}×${height} il simulatore sta tutto nella finestra`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    await screenKey(page, 'A').click();
    const size = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));
    expect(size.height).toBeLessThanOrEqual(height);
    expect(size.width).toBeLessThanOrEqual(width);
    // Ogni pezzo dell’inventario di docs/design.md si vede senza scorrere.
    for (const locator of [
      page.getByRole('combobox', { name: 'Modello' }),
      page.getByRole('button', { name: /^Spine:/ }),
      page.getByRole('button', { name: 'Condividi' }),
      page.getByRole('button', { name: 'Modalità LIM' }),
      screenKey(page, 'L'),
      page.locator('[data-lamp="L"]'),
      wheel(page, 'sinistro'),
      page.getByRole('button', { name: 'Anello del rotore destro: avanti' }),
      page.getByRole('combobox', { name: 'Segnale' }),
      page.getByRole('textbox', { name: 'Testo da cifrare o decifrare' }),
      page.getByRole('button', { name: 'Digita' }),
    ])
      await expect(locator).toBeInViewport({ ratio: 1 });
  });
}

test('50 lettere battute in fretta danno il testo cifrato atteso', async ({ page }) => {
  await open(page);
  const text = 'ENIGMAXCIFRAXOGNIXLETTERAXCONXUNAXSOSTITUZIONEXNUOVA'.slice(0, 50);
  await page.keyboard.type(text, { delay: 0 });
  await expect(lit(page)).toHaveText(groupLetters(encipherWith(defaultConfig('I'), text)));
  await expect(typed(page)).toHaveText(groupLetters(text));
});

test('la tastiera fisica cifra, ignora i tasti speciali e Backspace annulla', async ({ page }) => {
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

test('i tasti a schermo cifrano e i campi dei pannelli non battono sulla macchina', async ({ page }) => {
  await open(page);
  for (const letter of 'HELLO') await screenKey(page, letter).click();
  await expect(lit(page)).toHaveText('ILBDA');
  await page.getByRole('button', { name: /^Spine:/ }).click();
  await panel(page, /Pannello a spine/)
    .getByLabel('Coppie collegate')
    .fill('ab');
  await expect(page.getByRole('button', { name: 'Spine: un cavo' })).toBeVisible();
  await expect(typed(page)).toHaveText('Ancora nessuna lettera.');
});

test('le prese collegano i cavi, Esc chiude il pannello e il fuoco torna al pulsante', async ({ page }) => {
  await open(page);
  const button = page.getByRole('button', { name: /^Spine:/ });
  await button.click();
  const plugs = panel(page, /Pannello a spine/);
  await plugs.getByRole('button', { name: 'Q: libera' }).click();
  await expect(plugs.getByRole('button', { name: 'Q: in attesa, scegli la seconda presa' })).toBeVisible();
  await plugs.getByRole('button', { name: 'W: libera' }).click();
  await expect(plugs.getByLabel('Coppie collegate')).toHaveValue('QW');
  await expect(page.getByRole('definition').filter({ hasText: 'QW' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(plugs).toHaveCount(0);
  await expect(button).toBeFocused();
  await expect(button).toHaveAccessibleName('Spine: un cavo');
});

test('un link condivisibile riapre configurazione e messaggio', async ({ page }) => {
  // Barbarossa, parte 1: UKW-B, rotori II IV V, anelli BUL, posizione BLA.
  const message =
    'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLTTDEISMDICAGYKUACTCDOMOHWXMUUIAUBSTSLRNBZSZWNRFXWFYSSXJZVIJHIDISHPRKLKAYUPADTXQSPINQMATLPIFSVKDASCTACDPBOPVHJK';
  await open(page, `?v=1&m=I&w=II-IV-V&r=BUL&p=BLA&u=B&s=AV.BS.CG.DL.FU.HZ.IN.KM.OW.RX&t=${message}`);
  await expect(lit(page)).toContainText('AUFKL XABTE ILUNG');
  await expect(page.getByRole('definition').filter({ hasText: 'AV BS CG DL FU HZ IN KM OW RX' })).toBeVisible();

  await page.getByRole('combobox', { name: 'Rotore destro' }).selectOption('III');
  await expect(page).toHaveURL(/w=II-IV-III/);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Rotore destro' })).toHaveValue('III');
  await expect(typed(page)).toHaveText('Ancora nessuna lettera.');
});

test('un vecchio link /simulatore/?… apre la stessa configurazione nella home', async ({ page }) => {
  await page.goto('simulatore/?v=1&m=I&w=II-IV-V&r=BUL&p=BLA&u=B&s=AV.BS.CG.DL.FU.HZ.IN.KM.OW.RX&t=EDPUD');
  await expect(page).toHaveURL(/\/enigma\/\?v=1&m=I&w=II-IV-V/);
  await expect(page.getByRole('heading', { name: 'Messaggio' })).toBeVisible();
  await expect(lit(page)).toHaveText('AUFKL');
  await expect(page.getByRole('combobox', { name: 'Rotore sinistro' })).toHaveValue('II');
});

test('il link condiviso porta alla home e si mostra anche come codice QR', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Condividi' }).click();
  const share = panel(page, 'Link condivisibile');
  await expect(share.getByLabel('Link alla configurazione')).toHaveValue(/\/enigma\/\?v=1&m=I/);
  await share.getByRole('button', { name: 'Mostra il codice QR' }).click();
  await expect(share.getByRole('img', { name: 'Codice QR del link condivisibile' })).toBeVisible();
  await expect(share.getByRole('button', { name: 'Nascondi il codice QR' })).toHaveAttribute('aria-expanded', 'true');
});

test('un link non valido carica la configurazione di base e lo dice', async ({ page }) => {
  await open(page, '?v=1&m=I&w=I-I-II&r=AAA&p=AAA&u=B');
  await expect(page.getByText('Il link aperto non è valido')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Rotore sinistro' })).toHaveValue('I');
});

test('la tastiera resta bloccata finché l’Uhr non ha 10 cavi', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /^Spine:/ }).click();
  const plugs = panel(page, /Pannello a spine/);
  await plugs.getByLabel('Collega l’Uhr al posto dei cavi').check();
  await expect(page.getByText('L’Uhr richiede esattamente 10 cavi sul pannello')).toBeVisible();
  await expect(screenKey(page, 'Q')).toBeDisabled();
  await plugs.getByLabel('Coppie collegate').fill('AB CD EF GH IJ KL MN OP QR ST');
  await expect(screenKey(page, 'Q')).toBeEnabled();
});

test('sulla M4 l’UKW-D toglie il rotore sottile e si ricabla dal suo pannello', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Modello' }).selectOption('M4');
  await expect(page.getByRole('combobox', { name: 'Rotore sottile' })).toHaveValue('Beta');
  await page.getByRole('combobox', { name: 'Riflettore (UKW)' }).selectOption('D');
  await expect(page.getByRole('combobox', { name: 'Rotore sottile' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cablaggio' }).click();
  await expect(panel(page, /Cablaggio dell’UKW-D/).getByLabel('Coppie del riflettore')).toHaveValue(
    /^(\w\w ){11}\w\w$/,
  );
});

test('il simulatore in uso è accessibile, anche in tema scuro', async ({ page }) => {
  await open(page);
  await screenKey(page, 'A').click();
  await expectAccessible(page);
  await page.getByRole('button', { name: /^Spine:/ }).click();
  await expectAccessible(page);
});

test('il passo passo segue il segnale dell’ultimo tasto', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Segnale' }).selectOption('step');
  await screenKey(page, 'A').click();
  const well = page.getByRole('region', { name: 'Dentro la macchina' });
  await expect(well).toContainText('Passo 1 di 13');
  await expect(well).toContainText('AAA → AAB. Si muove il rotore destro.');
  await expect(page.locator('[data-lit]')).toHaveCount(0);

  for (let i = 0; i < 3; i++) await well.getByRole('button', { name: 'Passo successivo' }).click();
  await expect(well).toContainText('Rotore III (destro), andata, con B nella finestrella');
  await expectAccessible(page);

  for (let i = 0; i < 9; i++) await well.getByRole('button', { name: 'Passo successivo' }).click();
  await expect(well).toContainText('Passo 13 di 13');
  await expect(page.locator('[data-lit]')).toHaveText('B');

  // Un tasto nuovo riparte dal primo passo; «Normale» torna al percorso completo.
  await screenKey(page, 'A').click();
  await expect(well).toContainText('Passo 1 di 13');
  await page.getByRole('combobox', { name: 'Segnale' }).selectOption('normal');
  await expect(page.locator('[data-lit]')).toHaveText('D');
});

test('«Digita» batte il testo una lettera alla volta e un tasto lo ferma', async ({ page }) => {
  await open(page);
  await page.getByRole('textbox', { name: 'Testo da cifrare o decifrare' }).fill('Hello');
  await page.getByRole('button', { name: 'Digita' }).click();
  await expect(lit(page)).toHaveText('ILBDA');

  await page.getByRole('button', { name: 'Ricomincia' }).click();
  await page.getByRole('textbox', { name: 'Testo da cifrare o decifrare' }).fill('A'.repeat(200));
  await page.getByRole('button', { name: 'Digita' }).click();
  await expect(page.getByRole('button', { name: 'Ferma' })).toBeVisible();
  await page.getByRole('button', { name: 'Ricomincia' }).click();
  await expect(page.getByRole('button', { name: 'Digita' })).toBeVisible();
  await expect(typed(page)).toHaveText('Ancora nessuna lettera.');
});

test('la modalità LIM alza il contrasto, tiene la griglia ed è accessibile', async ({ page }) => {
  await open(page);
  const lim = page.getByRole('button', { name: 'Modalità LIM' });
  await lim.click();
  await expect(page.locator('[data-lim]')).toHaveCount(1);
  await expect(lim).toHaveAttribute('aria-pressed', 'true');
  await screenKey(page, 'A').click();
  await expect(lit(page)).toHaveText('B');
  await expectAccessible(page);
  await lim.click();
  await expect(page.locator('[data-lim]')).toHaveCount(0);
});

// ── Versione ridotta (docs/design.md, «Versione ridotta»): 375 px e 768 px ─────────────────────

for (const [width, height] of [
  [375, 812],
  [768, 1024],
] as const) {
  test(
    `a ${width} px la home è la versione ridotta, senza scorrimento orizzontale`,
    { tag: '@compact' },
    async ({ page }) => {
      await page.setViewportSize({ width, height });
      await open(page);
      await screenKey(page, 'A').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      // Solo i pezzi della versione ridotta: niente schema, niente pannelli di configurazione.
      await expect(page.getByRole('region', { name: 'Dentro la macchina' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^Spine:/ })).toHaveCount(0);
      await expect(page.getByRole('combobox')).toHaveCount(0);
      await expect(page.getByRole('textbox')).toHaveCount(0);

      // L'avviso rimanda al computer e porta alle lezioni.
      const notice = page.getByText('Qui hai la macchina pronta a cifrare.');
      await expect(notice).toBeVisible();
      await expect(notice).toContainText('si configurano su un computer');
      await expect(page.getByRole('link', { name: 'Apri le lezioni' })).toHaveAttribute(
        'href',
        /\/enigma\/come-funziona\/$/,
      );
      const brand = await page.getByRole('link', { name: 'Enigma' }).boundingBox();
      const menu = await page.getByRole('button', { name: 'Menu' }).boundingBox();
      expect(brand && menu && Math.abs(brand.y + brand.height / 2 - (menu.y + menu.height / 2))).toBeLessThan(2);
    },
  );
}

test(
  'a 375 px i bersagli di tocco sono da 44 px e i quattro gruppi stanno su una riga',
  { tag: '@compact' },
  async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page);
    const targets = page.locator('.compact-rotors .arrow, .compact-menu, .compact-main .sbtn, .compact-notice a');
    for (const target of await targets.all()) {
      const box = await target.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    // Lampade da 31 e tasti da 34 × 46.
    const lamp = await page.locator('[data-lamp="Q"]').boundingBox();
    const key = await screenKey(page, 'Q').boundingBox();
    expect([lamp?.width, lamp?.height]).toEqual([31, 31]);
    expect([key?.width, key?.height]).toEqual([34, 46]);
    // Foglio: quattro gruppi per riga.
    const tops = await page
      .locator('.compact-sheet-message .group')
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(new Set(tops.slice(0, 4)).size).toBe(1);
    expect(tops[4]).toBeGreaterThan(tops[0] ?? 0);
  },
);

test('a 375 px i tasti cifrano senza aprire la tastiera del telefono', { tag: '@compact' }, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  // Nessun campo di testo: toccare un tasto non può far salire la tastiera del telefono.
  await expect(page.locator('input, textarea, [contenteditable]')).toHaveCount(0);
  const text = 'HELLO';
  for (const letter of text) await screenKey(page, letter).click();
  await expect(typed(page)).toHaveText('HELLO');
  await expect(lit(page)).toHaveText(groupLetters(encipherWith(defaultConfig('I'), text)));
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BUTTON');

  // Le frecce da 44 px girano la finestrella e fanno ricominciare il messaggio.
  await page.getByRole('button', { name: 'Posizione del rotore destro: Lettera successiva' }).click();
  await expect(wheel(page, 'destro')).toHaveAttribute('aria-valuetext', 'G');
  await expect(typed(page)).toHaveText('Ancora nessuna lettera.');
});

test('a 375 px il menu si apre, porta alle sezioni e si chiude con Esc', { tag: '@compact' }, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Simulatore' })).toBeFocused();
  for (const name of ['Come funziona', 'Storia', 'Esercizi', 'Glossario', 'Docenti'])
    await expect(page.getByRole('link', { name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tema chiaro o scuro' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('a 375 px la versione ridotta è accessibile, in chiaro e in scuro', { tag: '@compact' }, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await screenKey(page, 'A').click();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Menu' }).click();
  await expectAccessible(page);
});

test(
  'un link con quattro rotori a 375 px mostra quattro finestrelle senza uscire dallo schermo',
  { tag: '@compact' },
  async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '?v=1&m=M4&w=Beta-I-II-III&r=AAAA&p=AAAA&u=B-thin');
    await expect(page.getByRole('spinbutton')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  },
);

// Messaggi storici del menu «Carica una chiave» (src/content/missioni.yaml). Il testo in chiaro
// atteso è scritto qui, indipendente dai dati: viene dalle fonti, non dal motore.
const missions = [
  {
    id: 'barbarossa-1',
    title: 'Barbarossa, 7 luglio 1941, parte 1',
    plaintext:
      'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAFFLIEGERSTRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAXUMXEINSAQTDREINULLXUHRANGETRETENXANGRIFFXINFXRGTX',
  },
  {
    id: 'barbarossa-2',
    title: 'Barbarossa, 7 luglio 1941, parte 2',
    plaintext:
      'DREIGEHTLANGSAMABERSIQERVORWAERTSXEINSSIEBENNULLSEQSXUHRXROEMXEINSXINFRGTXDREIXAUFFLIEGERSTRASZEMITANFANGXEINSSEQSXKMXKMXOSTWXKAMENECXKAMENECXDIVXKDRX',
  },
  {
    id: 'u-264',
    title: 'U-264, 19 novembre 1942',
    plaintext:
      'VONVONJLOOKSJHFFTTTEINSEINSDREIZWOYYQNNSNEUNINHALTXXBEIANGRIFFUNTERWASSERGEDRUECKTYWABOSXLETZTERGEGNERSTANDNULACHTDREINULUHRMARQUANTONJOTANEUNACHTSEYHSDREIYZWOZWONULGRADYACHTSMYSTOSSENACHXEKNSVIERMBFAELLTYNNNNNNOOOVIERYSICHTEINSNULL',
  },
  {
    id: 'scharnhorst',
    title: 'Scharnhorst, 26 dicembre 1943',
    plaintext: 'STEUEREJTANAFJORDJANSTANDORTQUAAACCCVIERNEUNNEUNZWOFAHRTZWONULSMXXSCHARNHORSTHCO',
  },
];

for (const mission of missions) {
  test(`la missione ${mission.id} carica la chiave e il testo cifrato, e «Digita» lo decifra`, async ({ page }) => {
    await open(page);
    const menu = page.getByRole('combobox', { name: 'Carica una chiave' });
    await menu.selectOption(mission.id);
    await expect(menu.locator('option:checked')).toHaveText(mission.title);
    await expect(page.getByText('Messaggio storico', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Digita' }).click();
    // «Digita» batte una lettera ogni 45 ms: i messaggi lunghi chiedono una decina di secondi.
    await expect(lit(page)).toHaveText(groupLetters(mission.plaintext), { timeout: 20_000 });
  });
}

test('l’indicatore di Barbarossa dà la chiave del messaggio, e il contesto ha le fonti', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page);
  await page.getByRole('combobox', { name: 'Carica una chiave' }).selectOption('barbarossa-1');
  // Con la missione caricata il simulatore sta ancora nella finestra.
  const size = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(size).toBeLessThanOrEqual(720);

  // Procedura del 1940: rotori sulla posizione in chiaro WXC, si batte KCH, si accende BLA.
  for (const [slot, letter] of [
    ['sinistro', 'W'],
    ['centrale', 'X'],
    ['destro', 'C'],
  ] as const)
    await wheel(page, slot).press(letter);
  for (const letter of 'KCH') await screenKey(page, letter).click();
  await expect(lit(page)).toHaveText('BLA');

  // Scegliere di nuovo la parte riporta i rotori sulla chiave del messaggio.
  await page.getByRole('combobox', { name: 'Carica una chiave' }).selectOption('barbarossa-1');
  await expect(wheel(page, 'sinistro')).toHaveAttribute('aria-valuetext', 'B');

  await page.getByRole('button', { name: 'Contesto' }).click();
  const context = panel(page, 'Barbarossa, 7 luglio 1941');
  await expect(context).toContainText('SS-Totenkopf');
  await expect(context.getByRole('link', { name: 'Ciphertexts from Heeresgruppe Nord in July 1941' })).toHaveAttribute(
    'href',
    'https://cryptocellar.org/bgac/heeresgruppe-nord-july-1941.pdf',
  );
  await expect(context.getByRole('link', { name: 'Fogli chiave e procedure' })).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(context).toBeHidden();
  await expect(page.getByRole('button', { name: 'Contesto' })).toBeFocused();

  // Una chiave di prova toglie la missione.
  await page.getByRole('combobox', { name: 'Carica una chiave' }).selectOption('base');
  await expect(page.getByText('Messaggio storico', { exact: true })).toBeHidden();
});
