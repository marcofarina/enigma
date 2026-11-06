/**
 * Budget di prestazioni e accessibilità sulla build (`pnpm build && pnpm test:lighthouse`).
 *
 * Avvia `astro preview`, apre Chromium (quello di Playwright, o `CHROME_PATH`) e misura ogni pagina
 * di `pagine.ts` a desktop e a 375 px. Esce con codice 1 se una pagina resta sotto il budget:
 * prestazioni ≥ 90, accessibilità = 100. Le prestazioni oscillano da una misura all’altra, perciò una
 * pagina sotto soglia si rimisura fino a tre volte e conta la migliore.
 */
import { spawn } from 'node:child_process';
import { launch } from 'chrome-launcher';
import lighthouse, { type Config } from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium } from '@playwright/test';
import { pagineLighthouse } from './pagine.ts';

const porta = 4322;
const base = `http://localhost:${porta}/`;
const budget = { performance: 90, accessibility: 100 };
const tentativi = 3;

const mobile375: Config = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 375, height: 812, deviceScaleFactor: 2, disabled: false },
  },
};
const profili = [
  { nome: 'desktop', config: desktopConfig },
  { nome: '375 px', config: mobile375 },
];

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
const chrome = { current: undefined as Awaited<ReturnType<typeof launch>> | undefined };

async function chiudi() {
  chrome.current?.kill();
  // `pnpm exec` lancia astro come processo figlio: si chiude l’intero gruppo.
  if (server.pid) process.kill(-server.pid);
}

let fallite = 0;
try {
  await attendiServer();
  chrome.current = await launch({
    chromePath: process.env['CHROME_PATH'] ?? chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox'],
  });
  for (const { nome, config } of profili) {
    for (const pagina of pagineLighthouse) {
      let migliore = { performance: -1, accessibility: -1 };
      let verificheFallite: string[] = [];
      for (let t = 0; t < tentativi; t++) {
        const risultato = await lighthouse(
          base + pagina,
          { port: chrome.current.port, output: 'json', logLevel: 'error', onlyCategories: Object.keys(budget) },
          config,
        );
        const lhr = risultato?.lhr;
        if (!lhr) throw new Error(`nessun risultato per ${pagina}`);
        const punteggio = {
          performance: Math.round((lhr.categories['performance']?.score ?? 0) * 100),
          accessibility: Math.round((lhr.categories['accessibility']?.score ?? 0) * 100),
        };
        if (punteggio.performance >= migliore.performance) {
          migliore = punteggio;
          verificheFallite = Object.values(lhr.audits)
            .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
            .map((a) => `${a.id} (${Math.round(a.score! * 100)})`);
        }
        if (migliore.performance >= budget.performance && punteggio.accessibility >= budget.accessibility) break;
        if (punteggio.accessibility < budget.accessibility) migliore.accessibility = punteggio.accessibility;
      }
      const ok = migliore.performance >= budget.performance && migliore.accessibility >= budget.accessibility;
      if (!ok) fallite++;
      console.log(
        `${ok ? 'ok  ' : 'KO  '} ${nome.padEnd(8)} /${pagina.padEnd(48)} prestazioni ${migliore.performance}, accessibilità ${migliore.accessibility}`,
      );
      if (!ok) console.log(`     da correggere: ${verificheFallite.join(', ')}`);
    }
  }
} finally {
  await chiudi();
}

if (fallite > 0) {
  console.error(
    `\n${fallite} misure sotto il budget (prestazioni ≥ ${budget.performance}, accessibilità = ${budget.accessibility}).`,
  );
  process.exit(1);
}
console.log('\nBudget rispettato su tutte le pagine.');
process.exit(0);
