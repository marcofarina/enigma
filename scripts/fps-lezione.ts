/**
 * I fotogrammi al secondo della lezione animata (fase 5d di docs/piano/fase-5d.md, passo 8), sulla
 * build (`pnpm build && node scripts/fps-lezione.ts`).
 *
 * Avvia `astro preview`, apre `/macchina/` a 375 × 812 (densità 2) con il Chromium di Playwright, rallenta
 * la CPU quattro volte (`Emulation.setCPUThrottlingRate` via CDP), avvia la lezione «A passi, senza
 * voce» e per ogni passo conta i fotogrammi per tre secondi, mentre la sua animazione gira. Scrive il
 * renderer WebGL, perché il numero dipende da lui: senza GPU Chromium disegna con SwiftShader, sulla
 * CPU, e misura un caso molto peggiore di un telefono.
 *
 * Opzioni: `--gpu` lascia a Chromium la GPU (headless con ANGLE su Metal, sul Mac); `--larghezza=1280`
 * misura a desktop.
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const porta = 4323;
const base = `http://localhost:${porta}/`;
const gpu = process.argv.includes('--gpu');
const larghezza = Number(process.argv.find((a) => a.startsWith('--larghezza='))?.split('=')[1] ?? 375);
const altezza = larghezza === 375 ? 812 : Math.round((larghezza * 9) / 16);
const SECONDI = 3;

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

const server = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(porta), '--ignore-lock'], {
  stdio: 'ignore',
  detached: true,
});

try {
  await attendiServer();
  const browser = await chromium.launch({
    args: gpu ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({
    viewport: { width: larghezza, height: altezza },
    deviceScaleFactor: 2,
    isMobile: larghezza < 768,
    hasTouch: larghezza < 768,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(`${base}macchina/`);
  await page.getByRole('button', { name: 'Guarda come funziona' }).click();
  await page.getByRole('checkbox', { name: 'A passi, senza voce' }).check();
  await page.locator('[data-fase="pronta"]').waitFor({ timeout: 90_000 });
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    return info && gl ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'sconosciuto';
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  console.log(`${larghezza} × ${altezza}, densità 2, CPU rallentata 4 volte; renderer: ${renderer}`);

  const misure: { id: string; fps: number }[] = [];
  const passi = await page.locator('.macchina-trascrizione li').count();
  for (let i = 0; i < passi; i++) {
    if (i > 0) await page.getByRole('button', { name: 'Passo successivo' }).click();
    const id = (await page.locator('[data-lezione]').getAttribute('data-lezione')) ?? String(i);
    // Il primo mezzo secondo di un passo cambia camera e materiali: si misura dopo.
    await page.waitForTimeout(500);
    const fps = await page.evaluate(
      (secondi) =>
        new Promise<number>((risolvi) => {
          let fotogrammi = 0;
          const inizio = performance.now();
          const conta = (ora: number) => {
            fotogrammi++;
            if (ora - inizio < secondi * 1000) requestAnimationFrame(conta);
            else risolvi((fotogrammi * 1000) / (ora - inizio));
          };
          requestAnimationFrame(conta);
        }),
      SECONDI,
    );
    misure.push({ id, fps });
    console.log(`${id.padEnd(16)} ${fps.toFixed(1)} fps`);
  }
  const minimo = Math.min(...misure.map((m) => m.fps));
  const media = misure.reduce((s, m) => s + m.fps, 0) / misure.length;
  console.log(`minimo ${minimo.toFixed(1)} fps, media ${media.toFixed(1)} fps`);
  await browser.close();
} finally {
  // `pnpm exec` lancia astro come processo figlio: si chiude l’intero gruppo.
  if (server.pid) process.kill(-server.pid);
}
