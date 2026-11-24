import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { test, expect, waitForApp } from './helpers';

const CORPUS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'corpus', 'pdf');

test('a PDF with no section headings is rated low, in plain words, and can be pasted instead', async ({ page }) => {
  // A made-up note with no section headings: the review must not call it a resume it could read
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const sheet = doc.addPage([595, 842]);
  ['Kitchen notes', 'Bread: flour, water, salt', 'Oven at 230 degrees for 30 minutes'].forEach((line, i) =>
    sheet.drawText(line, { x: 72, y: 760 - i * 24, size: 11, font })
  );
  const bytes = await doc.save();

  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'notes.pdf', mimeType: 'application/pdf', buffer: Buffer.from(bytes) });

  const banner = page.getByRole('status', { name: 'How well we read this file' });
  await expect(banner).toContainText('We could not read this layout reliably', { timeout: 20_000 });
  await expect(banner).toContainText('We could not find an email address or phone number.');

  await page.getByRole('button', { name: 'Paste text instead' }).click();
  await expect(page.getByPlaceholder('Paste your resume text here...')).toHaveValue(/Kitchen notes/);
});

test('a corpus PDF with its sections found is not rated low', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles({
    name: 'swe-single.pdf',
    mimeType: 'application/pdf',
    buffer: readFileSync(path.join(CORPUS, 'swe-single.pdf')),
  });
  const banner = page.getByRole('status', { name: 'How well we read this file' });
  await expect(banner).toContainText(/We read (this resume with confidence|most of this resume)/, { timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Paste text instead' })).toHaveCount(0);
});
