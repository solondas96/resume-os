/**
 * Visual check: page 1 of the downloaded PDF (rendered by pdf.js) next to page 1 of the
 * preview (screenshot). Both are scaled to one width and compared pixel by pixel.
 * The PDF and the preview are laid out by different code, so the score is a measure of how
 * close they look, not a claim that they match exactly. Pairs are saved as CI artifacts.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas, loadImage, Canvas } from '@napi-rs/canvas';
import { test, expect, waitForApp, skipTour } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');
const RESULTS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'test-results');
const OUT = path.join(RESULTS, 'visual');
const WIDTH = 800;
// Page proportions at 96 DPI: A4 794 × 1123, Letter 816 × 1056
const RATIO = { A4: 1123 / 794, Letter: 1056 / 816 } as const;

async function renderPdfPageOne(bytes: Uint8Array, ratio: number): Promise<Canvas> {
  const doc = await getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: WIDTH / base.width });
  const canvas = createCanvas(WIDTH, Math.round(WIDTH * ratio));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx as never, viewport: vp, canvas: canvas as never }).promise;
  return canvas;
}

/** Grey values of a canvas, one per pixel */
function grey(c: Canvas): Uint8ClampedArray {
  const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  const out = new Uint8ClampedArray(c.width * c.height);
  for (let i = 0; i < out.length; i++) {
    out[i] = (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000;
  }
  return out;
}

function compare(a: Canvas, b: Canvas) {
  const ga = grey(a);
  const gb = grey(b);
  let diff = 0;
  let inkA = 0;
  let inkB = 0;
  for (let i = 0; i < ga.length; i++) {
    diff += Math.abs(ga[i] - gb[i]);
    if (ga[i] < 200) inkA++;
    if (gb[i] < 200) inkB++;
  }
  return {
    meanAbsDiff: +(diff / ga.length).toFixed(2),
    similarity: +(1 - diff / ga.length / 255).toFixed(4),
    inkCoverageAuthor: +(inkA / ga.length).toFixed(4),
    inkCoveragePdf: +(inkB / ga.length).toFixed(4),
  };
}

for (const size of ['A4', 'Letter'] as const) {
  test(`visual: page 1 of the ${size} PDF next to the preview`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await waitForApp(page);
    await page.locator('input[type=file]').first().setInputFiles(DOCX);
    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Create resume' }).click();
    await skipTour(page);
    await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

    if (size === 'Letter') {
      await page.getByRole('button', { name: 'Inspector' }).click();
      await page.getByRole('tab', { name: 'Design' }).click();
      await page.getByLabel('Paper size').selectOption('Letter');
      await page.getByRole('button', { name: 'Close inspector' }).click();
      await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeHidden({ timeout: 10_000 });
      await expect(page.locator('.a4-sheet.page-letter')).toBeVisible();
    }

    // Preview page 1: element screenshot, cropped to the first page's height
    // Print layout hides the app chrome, so the element is the page alone
    await page.emulateMedia({ media: 'print' });
    const sheet = page.locator('.a4-sheet');
    const sheetPng = await sheet.screenshot();
    await page.emulateMedia({ media: 'screen' });
    const sheetImg = await loadImage(sheetPng);
    const pageH = Math.round(sheetImg.width * RATIO[size]);
    const previewCanvas = createCanvas(WIDTH, Math.round(WIDTH * RATIO[size]));
    previewCanvas.getContext('2d').drawImage(sheetImg as never, 0, 0, sheetImg.width, Math.min(pageH, sheetImg.height), 0, 0, WIDTH, Math.round(WIDTH * RATIO[size]));

    // The PDF, as the download button makes it
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    const file = await download;
    const pdfPath = test.info().outputPath(file.suggestedFilename());
    await file.saveAs(pdfPath);
    const bytes = new Uint8Array(readFileSync(pdfPath));
    const pdfCanvas = await renderPdfPageOne(bytes, RATIO[size]);

    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, `${size}-preview-page1.png`), previewCanvas.toBuffer('image/png'));
    writeFileSync(path.join(OUT, `${size}-pdf-page1.png`), pdfCanvas.toBuffer('image/png'));

    const result = compare(previewCanvas, pdfCanvas);
    writeFileSync(path.join(OUT, `${size}-report.json`), JSON.stringify(result, null, 2));
    console.log(`visual ${size}:`, JSON.stringify(result));
    // The renders must be real, non-blank pages with some ink; the score is reported, not gated.
    expect(result.inkCoveragePdf).toBeGreaterThan(0.01);
    expect(result.inkCoverageAuthor).toBeGreaterThan(0.01);
  });
}
