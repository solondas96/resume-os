import { defineConfig, devices } from '@playwright/test';

// Timing of the first screen on the production build, on a slow phone-like connection.
// Run `npm run build` first. CI runs this after the build.
export default defineConfig({
  testDir: 'tests/perf',
  timeout: 120_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4175/' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4175 --strictPort',
    url: 'http://localhost:4175/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
