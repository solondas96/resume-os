import { test, expect, waitForApp } from './helpers';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

test('export bundle downloads a zip with the resume in several forms and a backup', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('heading', { name: 'Start blank' }).click();
  await page.getByLabel('Full name').fill('Bundle Person');
  await page.getByRole('button', { name: 'Add section' }).click();
  const section = page.getByRole('region', { name: 'Section Experience' });
  await section.getByRole('button', { name: 'Add role' }).click();
  await section.getByLabel('Company').fill('Acme');
  await section.getByRole('button', { name: 'Add bullet' }).click();
  await section.getByLabel('Bullet text').last().fill('Shipped the bundle export');

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  await page.getByPlaceholder(/Search|command/i).first().fill('bundle');
  const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
  const path = await download.path();
  const files = unzipSync(new Uint8Array(readFileSync(path!)));
  const names = Object.keys(files);
  expect(names).toEqual(expect.arrayContaining(['resume.md', 'resume.txt', 'resume-print.html', 'backup.json', 'README.txt']));
  expect(strFromU8(files['resume.md'])).toContain('Bundle Person');
  expect(strFromU8(files['resume.md'])).toContain('Shipped the bundle export');
  expect(JSON.parse(strFromU8(files['backup.json'])).app).toBe('ResumeLabs');
});
