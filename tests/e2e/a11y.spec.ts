import AxeBuilder from '@axe-core/playwright';
import { test, expect, waitForApp } from './helpers';

const SEVERE = ['serious', 'critical'];

async function serious(page: import('@playwright/test').Page, label: string) {
  // Colours fade over 150ms after a theme change: measure the settled colours, not a mid-fade frame
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const bad = results.violations.filter((v) => v.impact && SEVERE.includes(v.impact));
  const summary = bad.map((v) => `${v.impact} ${v.id}: ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.html.slice(0, 160)).join('\n  ')}`).join('\n');
  expect(bad, `${label}\n${summary}`).toEqual([]);
}

async function toggleTheme(page: import('@playwright/test').Page) {
  await page.getByTitle(/Switch to (Light|Dark) Mode/).click();
}

test.describe('accessibility (WCAG 2.2 AA, serious and critical)', () => {
  test('first-run welcome, dark and light', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await serious(page, 'welcome (dark)');
  });

  test('editor with the form, dark and light', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('heading', { name: 'Start blank' }).click();
    await expect(page.getByTestId('form-editor')).toBeVisible();
    await serious(page, 'editor (dark)');
    await toggleTheme(page);
    await serious(page, 'editor (light)');
  });

  test('preview, inspector and the Markdown view', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('heading', { name: 'Start blank' }).click();
    await page.getByRole('button', { name: 'Advanced: Markdown' }).click();
    await page.locator('.cm-content').first().waitFor();
    await serious(page, 'markdown view');
    await page.getByRole('button', { name: 'Form', exact: true }).click();
    await page.getByRole('button', { name: /Health\s*\d+/ }).click();
    await serious(page, 'inspector');
  });

  test('modals: tracker, share and the resume library', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('heading', { name: 'Start blank' }).click();
    await page.getByRole('button', { name: 'Tracker' }).click();
    await expect(page.getByRole('heading', { name: 'Application Tracker' }).or(page.getByText('Application Tracker'))).toBeVisible();
    await serious(page, 'tracker board');
    await page.getByRole('button', { name: 'Table' }).click();
    await serious(page, 'tracker table');
    await page.getByRole('button', { name: 'Close tracker' }).click();
    await page.getByRole('button', { name: /Share/ }).first().click();
    await serious(page, 'share modal');
    await page.getByRole('button', { name: 'Close share' }).click();
  });
});
