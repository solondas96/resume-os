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
