/**
 * Le schermate della pagina 3D per confrontare la resa (fase 5f di docs/piano.md):
 * `node scripts/schermate-3d.ts <cartella> [query]` sulla build (`pnpm build` prima).
 *
 * Avvia `astro preview`, apre `/macchina/` a 1280 × 720 nel Chromium di Playwright (con SwiftShader,
 * come i test), batte una A a macchina chiusa perché una lampada sia accesa e salva la finestra alle
 * fasi 0, 2 e 4 dello smontaggio, in tema chiaro e scuro: `fase<n>-<tema>.png`. Prese tutte allo
 * stesso modo, le schermate di due momenti si confrontano.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const cartella = process.argv[2];
/** Una query da aggiungere all’indirizzo della pagina, facoltativa (per esempio una configurazione). */
const query = process.argv[3] ?? '';
if (!cartella) {
  console.error('Uso: node scripts/schermate-3d.ts <cartella> [query]');
  process.exit(1);
}

const porta = 4323;
const base = `http://localhost:${porta}/`;
const FASI = [
  { n: 0, nome: 'macchina chiusa' },
  { n: 2, nome: 'rotori estratti' },
  { n: 4, nome: 'meccanica sotto i tasti' },
];
const TEMI = ['chiaro', 'scuro'] as const;
const VALORE_TEMA = { chiaro: 'light', scuro: 'dark' } as const;

async function attendiServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      /* il server non è ancora pronto */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`astro preview non risponde su ${base}`);
}

/** La clip è ferma alla fase voluta quando il tempo sulla tela è quello della fase (4 s si ferma a 3,99…). */
async function attendiFase(page: Page, n: number) {
  await page.waitForFunction(
    (atteso) => {
      const tempo = Number(document.querySelector('canvas')?.dataset['tempoClip'] ?? NaN);
      return Math.abs(tempo - atteso) < 0.02;
    },
    n,
    { timeout: 30_000 },
  );
  // La camera finisce la sua transizione dopo i pezzi.
  await page.waitForTimeout(2500);
}

// `--ignore-lock` come in lighthouse.ts: astro preview si rifiuta se trova il lucchetto di un altro server.
const server = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(porta), '--ignore-lock'], {
  stdio: 'ignore',
  detached: true,
});
try {
  await attendiServer();
  mkdirSync(cartella, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  for (const tema of TEMI) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await context.addInitScript((valore) => localStorage.setItem('enigma-theme', valore), VALORE_TEMA[tema]);
    const page = await context.newPage();
    await page.goto(`${base}macchina/${query ? `?${query}` : ''}`);
    await page.getByRole('button', { name: 'Avvia la vista 3D' }).click();
    const scena = page.getByRole('application', { name: /Enigma I in 3D/ });
    await scena.waitFor();
    await page.waitForFunction(() => document.querySelector('[data-fase="pronta"]') !== null, null, {
      timeout: 60_000,
    });
    await scena.focus();
    await page.keyboard.press('a');
    for (const { n, nome } of FASI) {
      await page.getByRole('radio', { name: nome, exact: true }).check();
      await attendiFase(page, n);
      const file = join(cartella, `fase${n}-${tema}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    }
    await context.close();
  }
  await browser.close();
} finally {
  // `pnpm exec` lancia astro come processo figlio: si chiude l’intero gruppo.
  if (server.pid) process.kill(-server.pid);
}
