import { defineConfig, devices } from '@playwright/test';

// The end-to-end suite against the production build (dist/), so the inlined entry script and
// the lazy chunks are tested as they ship. Run `npm run build` first.
export default defineConfig({
  testDir: 'tests/e2e',
  testIgnore: /pwa\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4176/', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4176 --strictPort',
    url: 'http://localhost:4176/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
