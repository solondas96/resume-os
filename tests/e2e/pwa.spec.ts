import { test, expect, waitForApp } from './helpers';

/** What the service worker and the page look like, for a failure message */
async function diagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
    const keys = await caches.keys().catch(() => [] as string[]);
    return {
      controller: !!navigator.serviceWorker.controller,
      registration: reg ? { active: reg.active?.state ?? null, waiting: !!reg.waiting, installing: !!reg.installing } : null,
      caches: keys,
      heading: document.querySelector('h1')?.textContent ?? null,
      text: (document.body.innerText || '').slice(0, 300),
    };
  }).catch((e) => ({ evaluateFailed: String(e) }));
}

test('installable and works offline after the first load', async ({ page, context }) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`${m.type()}: ${m.text()}`.slice(0, 200));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`.slice(0, 200)));

  await page.goto('/');
  await waitForApp(page);

  // Manifest is linked, and the service worker is installed
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Reload so the worker controls the page, then cut the network
  await page.reload();
  await waitForApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await waitForApp(page);
  await context.setOffline(true);

  await page.reload();
  const shown = await page
    .getByRole('heading', { name: 'Start blank' })
    .waitFor({ state: 'visible', timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  if (!shown) {
    const diag = await diagnostics(page);
    throw new Error(`Offline start screen not shown. ${JSON.stringify({ diag, consoleErrors: consoleErrors.slice(0, 8) })}`);
  }
  await expect(page.getByRole('heading', { name: 'Start blank' })).toBeVisible();
});
