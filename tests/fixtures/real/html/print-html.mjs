/**
 * Print each hand-written HTML resume to PDF with Playwright's Chromium, the way a user would
 * print it. Output: tests/fixtures/real/pdf/html-<name>.pdf.
 *   node tests/fixtures/real/html/print-html.mjs
 */
import { chromium } from '@playwright/test';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(here, 'src');
const outDir = path.join(here, '..', 'pdf');

const browser = await chromium.launch();
const page = await browser.newPage();
for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort()) {
  await page.goto(pathToFileURL(path.join(srcDir, file)).href);
  const out = path.join(outDir, file.replace(/\.html$/, '.pdf'));
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  console.log('printed', path.relative(process.cwd(), out));
}
await browser.close();
