import { test, expect, waitForApp, skipTour } from './helpers';

/**
 * The header has at most four controls at 1440 px: the resume library, Download PDF, More, and
 * the phone title (hidden here). Everything else is under More. Round 7, Step 2.
 */
const BUDGET = 4;

test('the header holds at most four controls at 1440 px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('heading', { name: 'Start from a role' }).click();
  await page.getByRole('heading', { name: 'Staff Software Engineer' }).click();
  await expect(page.locator('.a4-sheet').first()).toBeVisible({ timeout: 15_000 });
  await skipTour(page);

  // The app header is the one marked no-print (section headers inside the editor are <header> too)
  const names = await page.$$eval('header.no-print button, header.no-print a[href], header.no-print input, header.no-print select', (els) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .map((e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').replace(/\s+/g, ' ').trim())
  );
  testInfo.annotations.push({ type: 'header-controls', description: `${names.length}: ${names.join(' | ')}` });
  expect(names.length, `header controls: ${names.join(' | ')}`).toBeLessThanOrEqual(BUDGET);
});
