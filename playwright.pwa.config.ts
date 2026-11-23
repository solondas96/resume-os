import { defineConfig, devices } from '@playwright/test';

// The service worker only runs on a production build: this config serves dist/ with vite preview.
// Run `npm run build` first.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /pwa\.spec\.ts/,
  timeout: 90_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4174/' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
