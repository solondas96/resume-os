/**
 * Scripted first-time user: from the first screen to a downloaded PDF.
 * Clicks are counted in the page itself (a capture listener), not by the test, so the count
 * is what a person's pointer actually did. The file choice is counted as one step.
 * The report is written to test-results/walkthrough.json. The budget is 5 steps.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect, waitForApp, skipTour } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');
const BUDGET = 5;

test('first-time user: upload, create, skip the tour, download a PDF in at most 5 steps', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __clicks: number }).__clicks = 0;
    document.addEventListener('click', () => ((window as unknown as { __clicks: number }).__clicks += 1), true);
  });

  const steps: string[] = [];
  await page.goto('/');
  await waitForApp(page);

  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  steps.push('choose a file');
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Create resume' }).click();
  steps.push('create resume');
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

  await skipTour(page);
  steps.push('skip tour');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  steps.push('download PDF');
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);

  const clicks = await page.evaluate(() => (window as unknown as { __clicks: number }).__clicks);
  // Clicks counted in the page, plus the file choice (which is not a click)
  const total = clicks + 1;
  const report = { steps, clicks, total, budget: BUDGET, pass: total <= BUDGET };
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'test-results');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'walkthrough.json'), JSON.stringify(report, null, 2));
  console.log('WALKTHROUGH', JSON.stringify(report));
  expect(total).toBeLessThanOrEqual(BUDGET);
});
