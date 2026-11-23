/**
 * The first screen must be usable within 2 seconds on Fast 3G with a 4x slower CPU.
 * "Usable" means the first welcome choice is visible and can be clicked (Playwright's
 * actionability check: visible, stable, enabled, and not covered by another element).
 * The time is measured from the start of navigation, with the cache off, as a first visit.
 */
import { test, expect } from '@playwright/test';

// Chrome DevTools "Fast 3G" preset
const FAST_3G = {
  offline: false,
  latency: 562.5, // ms round trip
  downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps in bytes per second
  uploadThroughput: (750 * 1024) / 8,
};
const CPU_SLOWDOWN = 4;
const BUDGET_MS = 2000;

test('first screen is interactive within 2 s on Fast 3G with 4x CPU slowdown', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', FAST_3G);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });

  const start = Date.now();
  await page.goto('/', { waitUntil: 'commit' });
  const choice = page.getByRole('heading', { name: 'Start blank' });
  await choice.click({ trial: true });
  const ms = Date.now() - start;

  const report = { ms, budgetMs: BUDGET_MS, profile: 'Fast 3G, 562.5 ms RTT, 1.6 Mbps down, 4x CPU' };
  console.log('FIRST_SCREEN', JSON.stringify(report));
  expect(ms, `first screen took ${ms} ms`).toBeLessThan(BUDGET_MS);
});
