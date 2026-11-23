import { test, expect, waitForApp } from './helpers';

test('installable and works offline after the first load', async ({ page, context }) => {
  test.setTimeout(120_000);
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
  await expect(page.getByRole('heading', { name: 'Start blank' })).toBeVisible({ timeout: 30_000 });
});
