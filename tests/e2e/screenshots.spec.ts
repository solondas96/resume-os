/**
 * Screenshots of the main screen at 360, 768 and 1440 pixels wide, in light and dark themes.
 * They are written to test-results/screenshots and uploaded as a CI artifact, so a layout
 * change can be seen at a glance.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { test, expect, waitForApp, skipTour } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');
const RESULTS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'test-results');
const OUT = path.join(RESULTS, 'screenshots');
const WIDTHS = [360, 768, 1440] as const;
const THEMES = ['light', 'dark'] as const;

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    test(`screenshot: ${width} px, ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 360 ? 780 : 900 });
      await page.goto('/');
      await waitForApp(page);

      await page.locator('input[type=file]').first().setInputFiles(DOCX);
      await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: 'Create resume' }).click();
      await skipTour(page);
      // On a phone the editor and the preview are separate tabs
      if (width === 360) await page.getByRole('button', { name: 'Preview', exact: true }).click();
      await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

      // The theme is set from the More menu, which appears once a resume exists
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if ((theme === 'dark') !== isDark) {
        await page.getByRole('button', { name: 'More' }).click();
        await page.getByRole('menuitem', { name: new RegExp(`Switch to ${theme === 'dark' ? 'dark' : 'light'} mode`) }).click();
      }

      mkdirSync(OUT, { recursive: true });
      await page.screenshot({ path: path.join(OUT, `${width}-${theme}.png`), fullPage: false });
    });
  }
}
