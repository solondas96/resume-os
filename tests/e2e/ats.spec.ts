import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, waitForApp, skipTour } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');

test.setTimeout(150_000);

test('ATS: the print-layout readout renders, and an exported PDF is read back and compared', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();
  await skipTour(page);
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

  // Open the inspector and read the print-layout estimate
  await page.getByRole('button', { name: /Checks\s*\d+/ }).click();
  await expect(page.getByText('What applicant tracking software sees')).toBeVisible();
  await expect(page.getByText(/Read from this resume's PDF/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Text from the generated PDF')).toContainText('Maya Chen', { timeout: 20_000 });

  // Export the resume as a PDF exactly as the print route does, then read it back
  const pdfPath = test.info().outputPath('exported-resume.pdf');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });

  await page.locator('input[aria-label="Choose an exported PDF to check"]').setInputFiles(pdfPath);
  await expect(page.getByText(/Headings the PDF reader found:/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Headings the PDF reader found:.*Experience/)).toBeVisible();
  // Two such summaries exist (generated and uploaded); the uploaded PDF's is the last one
  await page.locator('summary', { hasText: 'Text the PDF reader found' }).last().click();
  await expect(page.getByLabel('Text the PDF reader found')).toContainText('Acme Corp');
});

test('Download PDF makes a real, text-based PDF file', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles(DOCX);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();
  await skipTour(page);
  await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  const pdfPath = test.info().outputPath(file.suggestedFilename());
  await file.saveAs(pdfPath);
  const { readFileSync } = await import('node:fs');
  const bytes = readFileSync(pdfPath);
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(5_000);
});
