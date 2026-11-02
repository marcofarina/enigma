import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

/** Percorre il sito a partire dalla home e controlla che ogni link interno porti a una pagina esistente. */
test('nessun link interno è rotto', async ({ page, request, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'basta un progetto');
  test.setTimeout(120_000);
  const root = new URL(baseURL ?? 'http://localhost:4321/enigma/');
  const queue = [root.href];
  const seen = new Set(queue);
  const broken: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const response = await request.get(current);
    if (!response.ok()) {
      broken.push(`${current} → ${response.status()}`);
      continue;
    }
    if (!response.headers()['content-type']?.includes('text/html')) continue;
    await page.goto(current);
    const hrefs = await page.$$eval('a[href]', (links) => links.map((link) => (link as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const target = new URL(href);
      target.hash = '';
      target.search = '';
      if (target.origin !== root.origin || !target.pathname.startsWith(root.pathname)) continue;
      if (!seen.has(target.href)) {
        seen.add(target.href);
        queue.push(target.href);
      }
    }
  }
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThan(30);
});
