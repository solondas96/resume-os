import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, waitForApp } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');
const JD = 'Required:\n- Experience mentoring engineers and leading teams\n';

test('tailor for a job: linked copy, reviewed changes, applied only on click', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

  const preview = page.locator('.a4-sheet');
  const before = await preview.innerText();
  expect(before.indexOf('Led migration')).toBeLessThan(before.indexOf('Mentored'));

  await page.getByRole('button', { name: 'Job Match' }).first().click();
  await page.getByPlaceholder(/Paste the posting/).fill(JD);
  await page.getByRole('button', { name: /Tailor for this job/ }).click();

  // A reviewed change, shown as a diff, not applied yet
  const list = page.getByRole('list', { name: 'Proposed changes' });
  await expect(list).toBeVisible();
  const mid = await preview.innerText();
  expect(mid.indexOf('Led migration')).toBeLessThan(mid.indexOf('Mentored'));

  await list.getByRole('button', { name: 'Accept' }).first().click();
  await page.getByRole('button', { name: /Apply 1 accepted change/ }).click();

  const after = await preview.innerText();
  expect(after.indexOf('Mentored')).toBeLessThan(after.indexOf('Led migration'));
  // Same sentences in the preview, only reordered
  expect(after.match(/Mentored 5 engineers/g)?.length).toBe(1);
});
