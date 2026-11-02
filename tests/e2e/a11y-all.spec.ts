import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Tutte le pagine della build: la revisione di accessibilità non dipende da un elenco a mano. */
function builtPages(dir = join(import.meta.dirname, '..', '..', 'dist')): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith('_') ? [] : builtPages(path);
    if (entry.name !== 'index.html') return [];
    const page = relative(join(import.meta.dirname, '..', '..', 'dist'), dir);
    return [page ? `${page}/` : ''];
  });
}

test.describe.configure({ mode: 'parallel' });

for (const path of builtPages()) {
  test(`/${path} è accessibile in tema chiaro e scuro`, async ({ page }) => {
    await page.goto(path);
    // Le isole interattive devono essere pronte, altrimenti axe controlla solo il segnaposto: quelle
    // `client:visible` si idratano quando entrano nello schermo, quindi si scorre fino in fondo.
    for (const island of await page.locator('astro-island').all()) await island.scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
    for (const scheme of ['light', 'dark'] as const) {
      // Con il movimento ridotto le transizioni di colore sono istantanee: axe non misura i colori
      // a metà del passaggio da un tema all’altro.
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations, `${scheme}: ${results.violations.map((v) => v.id).join(', ')}`).toEqual([]);
    }
  });
}
