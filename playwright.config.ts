import { defineConfig, devices } from '@playwright/test';

const port = 4321;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}/enigma/`,
    trace: 'on-first-retry',
    // La pagina 3D (fase 5a) vuole WebGL 2. Il Chromium headless di Playwright 1.63 (Chromium 153) lo
    // ha già con SwiftShader su macOS; il flag lo garantisce dove Chromium non ripiega più da solo
    // sul rendering software, come le macchine Linux senza GPU della CI.
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm exec astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}/enigma/`,
    reuseExistingServer: !process.env['CI'],
  },
});
