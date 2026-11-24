// Builds test-results-viewports/index.html: one contact sheet per view (write, page, notes, more),
// with every size and theme side by side. Run after the viewport matrix: npm run contact-sheet
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'test-results-viewports');
if (!existsSync(dir)) {
  console.error('No captures yet: run npx playwright test tests/e2e/viewports.spec.ts first.');
  process.exit(1);
}
const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const views = ['write', 'page', 'notes', 'more'];
const sections = views.map((view) => {
  const shots = files.filter((f) => f.endsWith(`-${view}.png`));
  const cells = shots
    .map((f) => `<figure><img src="${f}" loading="lazy" alt="${f}"><figcaption>${f.replace('.png', '')}</figcaption></figure>`)
    .join('\n');
  return `<section><h2>${view}</h2><div class="sheet">${cells}</div></section>`;
});
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Viewport contact sheets</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;background:#ecefea;color:#1a1f2b}
h2{text-transform:capitalize;margin:32px 0 12px}
.sheet{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
figure{margin:0;background:#fff;padding:8px;border-radius:8px}
img{display:block;max-height:420px;width:auto;border:1px solid #d5dad3}
figcaption{font-size:12px;color:#565e6c;margin-top:4px}
</style></head><body><h1>Viewport contact sheets</h1>${sections.join('\n')}</body></html>`;
writeFileSync(join(dir, 'index.html'), html);
console.log(`wrote ${join(dir, 'index.html')} with ${files.length} captures`);
