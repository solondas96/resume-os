/** Prints sample-resume.html to ../sample-resume.pdf with Chromium (node docs/usability-kit/src/print.mjs) */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(here, 'sample-resume.html')).href);
await page.pdf({ path: path.join(here, '..', 'sample-resume.pdf'), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log('wrote docs/usability-kit/sample-resume.pdf');
