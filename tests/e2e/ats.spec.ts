import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, waitForApp } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');

test.setTimeout(150_000);

test('ATS: the print-layout readout renders, and an exported PDF is read back and compared', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

  // Open the inspector and read the print-layout estimate
  await page.getByRole('button', { name: /Health\s*\d+/ }).click();
  await expect(page.getByText('What applicant tracking software sees')).toBeVisible();
  await expect(page.getByText(/Estimated from the print layout/)).toBeVisible();

  // Export the resume as a PDF exactly as the print route does, then read it back
  const pdfPath = test.info().outputPath('exported-resume.pdf');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });

  await page.locator('input[aria-label="Choose an exported PDF to check"]').setInputFiles(pdfPath);
  await expect(page.getByText(/Headings the PDF reader found:/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Headings the PDF reader found:.*Experience/)).toBeVisible();
  await page.locator('summary', { hasText: 'Text the PDF reader found' }).click();
  await expect(page.getByLabel('Text the PDF reader found')).toContainText('Acme Corp');
});
