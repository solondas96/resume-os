/**
 * Data safety, end to end: create a resume, download a backup, delete everything, then restore
 * from the downloaded file (with the preview) and find the resume again.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { test, expect, waitForApp, skipTour } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');

test('create, back up, delete everything, then restore from the backup file', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();
  await skipTour(page);
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

  // 1. Download a backup from the inspector's History tab
  await page.getByRole('button', { name: 'Inspector' }).click();
  await page.getByRole('tab', { name: 'History' }).click();
  const download = page.waitForEvent('download');
  // The reminder banner has a button with the same name, so scope to the inspector
  await page.getByRole('complementary', { name: 'Inspector' }).getByRole('button', { name: 'Download a backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^resumelabs-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = test.info().outputPath(file.suggestedFilename());
  await file.saveAs(backupPath);
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  expect(backup.app).toBe('ResumeLabs');
  expect(JSON.stringify(backup.resumes)).toContain('Maya Chen');

  // Sentinel caches with the app's prefixes: deleting everything must remove them
  await page.evaluate(async () => {
    await caches.open('resumelabs-marker');
    await caches.open('workbox-marker');
  });

  // 2. Delete everything: the typed word is required
  const deleteButton = page.getByRole('button', { name: 'Delete all my data' });
  await expect(deleteButton).toBeDisabled();
  await page.getByLabel('Type DELETE to confirm deleting everything').fill('DELETE');
  await deleteButton.click();
  await expect(page.getByRole('heading', { name: 'Welcome to ResumeLabs' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.a4-sheet')).toHaveCount(0);
  // The page was reloaded: the old app caches are gone (the app recreates its own offline cache on load)
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames).not.toContain('resumelabs-marker');
  expect(cacheNames).not.toContain('workbox-marker');

  // 3. Restore from the file: a preview first, then the resume is back
  await page.getByLabel('Choose a backup file to restore').setInputFiles(backupPath);
  await expect(page.getByRole('heading', { name: 'Restore from this backup?' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Restore preview' })).toContainText('Maya Chen');
  await page.getByRole('button', { name: 'Restore these' }).click();
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen', { timeout: 20_000 });
});
