/**
 * Renders public/og-image.png (1200 x 630, the social preview) from a small HTML card, with Playwright's
 * Chromium. Run after a brand change:  node scripts/make-og-image.mjs
 */
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'public', 'og-image.png');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; width: 1200px; height: 630px; background: #faf9f5; color: #141413; font-family: Arial, Helvetica, sans-serif; display: flex; align-items: center; justify-content: center; }
  .card { width: 1040px; }
  .brand { font-size: 30px; color: #a64c2d; font-weight: bold; letter-spacing: .02em; }
  h1 { font-size: 60px; line-height: 1.1; margin: 22px 0 18px; }
  p { font-size: 26px; color: #6b6a64; margin: 0; line-height: 1.4; }
  .pill { display: inline-block; margin-top: 36px; padding: 12px 22px; border-radius: 999px; background: #f5e9e2; color: #7a3a22; font-size: 22px; }
</style></head><body><div class="card">
  <div class="brand">ResumeLabs</div>
  <h1>Build a clear resume.<br>Keep it private.</h1>
  <p>Check how it reads to software, and download a PDF. Everything stays in your browser.</p>
  <span class="pill">No account · No upload · Works offline</span>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('wrote', path.relative(process.cwd(), out));
