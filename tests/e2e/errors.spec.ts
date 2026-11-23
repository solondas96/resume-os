/**
 * A panel that fails shows its own message, and the rest of the screen keeps working.
 * The failure is injected in development (?fault=preview), so this runs against the dev server.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// The plain Playwright test, not the shared one: this test injects a failure, which the shared
// test would report as a page error.
import { test } from '@playwright/test';
import { expect, waitForApp, skipTour } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');

test('a panel that fails leaves the editor working, and says so', async ({ page }) => {
  await page.goto('/?fault=preview');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();
  await skipTour(page);

  await expect(page.getByText('The preview could not be shown. Your data is safe.')).toBeVisible({ timeout: 20_000 });
  // The editor, the header and the status bar still work
  const fullName = page.getByLabel('Full name');
  await fullName.fill('Edited Person');
  await expect(fullName).toHaveValue('Edited Person');
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeVisible();
  // The fault is only for the preview: the top-level message is not shown
  await expect(page.getByText('Something went wrong. Your data is safe.')).toHaveCount(0);
});
