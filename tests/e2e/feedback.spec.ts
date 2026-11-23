import { test, expect, waitForApp } from './helpers';

test('Send feedback opens a prefilled GitHub issue in a new tab', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('heading', { name: 'Start blank' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: 'Keyboard shortcuts and help' }).click();
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  const tab = await popup;
  await tab.waitForLoadState('domcontentloaded').catch(() => {});
  // Signed out, GitHub goes to its login page with the issue address in return_to
  const first = new URL(tab.url());
  const url = first.pathname === '/login' ? new URL(first.searchParams.get('return_to') ?? '') : first;
  expect(url.pathname).toBe('/solondas96/resume-os/issues/new');
  expect(url.searchParams.get('title')).toContain('Feedback on ResumeLabs');
  expect(url.searchParams.get('body')).toMatch(/Page size: (A4|Letter)/);
});
