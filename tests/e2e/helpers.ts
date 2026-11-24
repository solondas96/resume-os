import { test as base, expect, Page } from '@playwright/test';

/**
 * Fails a test on any console error, uncaught page error, or JS dialog.
 * Attach before navigating.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('dialog', (d) => {
        problems.push(`dialog: ${d.message()}`);
        void d.dismiss();
      });
      await use();
      expect(problems, problems.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Seed localStorage before the app loads (runs on every navigation) */
export async function seedLocalStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  }, entries);
}

/** Wait for the app to finish startup (welcome screen or editor visible) */
export async function waitForApp(page: Page) {
  await expect(page.getByText('Loading your resumes…')).toHaveCount(0, { timeout: 20_000 });
}

/**
 * The first-time tour opens after a resume is created, as a corner card that can cover controls.
 * A first-time user dismisses it; tests do the same. Skips quietly when the tour is not shown.
 */
export async function skipTour(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip tour' });
  await skip.waitFor({ state: 'visible', timeout: 5_000 }).then(() => skip.click()).catch(() => {});
}

/** Opens the Notes panel from More (the header keeps only four controls). */
export async function openNotes(page: Page) {
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('menuitem', { name: /^Notes/ }).click();
}
