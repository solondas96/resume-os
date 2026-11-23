import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the Vite dev server in Chromium only.
export default defineConfig({
  testDir: 'tests/e2e',
  // The offline test needs the production build and runs in its own config (npm run e2e:pwa)
  testIgnore: /pwa\.spec\.ts/,
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
