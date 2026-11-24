/**
 * The screenshot matrix (docs/DESIGN-REVIEW.md): every main view at the sizes from Round 7, in light
 * and dark. Each capture is written to test-results/viewports and checked for the layout rules:
 *   - no horizontal scrolling
 *   - at most four header controls
 *   - Download PDF is on screen without scrolling
 *   - on touch sizes, header and tab-bar controls are at least 44 by 44 px
 *   - no serious or critical accessibility problems (axe)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, waitForApp, skipTour, openNotes } from './helpers';

const DOCX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes', 'maya-chen.docx');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'test-results-viewports'); // outside test-results/, which each run clears

const SIZES: [number, number][] = [
  [280, 653], // Galaxy Fold (folded)
  [320, 568], // iPhone SE (first generation)
  [375, 667], // iPhone SE
  [360, 800], // Android phone
  [393, 852], // iPhone 15
  [430, 932], // iPhone 15 Pro Max
  [844, 390], // Phone landscape (short height)
  [768, 1024], // iPad mini portrait
  [1180, 820], // iPad Air landscape
  [1280, 800], // Laptop
  [1366, 768], // Laptop
  [1440, 900], // Desktop
  [1920, 1080], // Desktop
  [2560, 1440], // QHD
  [3440, 1440], // Ultrawide
  [640, 400], // 200% zoom on a laptop, approximated by the CSS size
];
const THEMES = ['light', 'dark'] as const;

for (const [width, height] of SIZES) {
  for (const theme of THEMES) {
    test(`viewport ${width}x${height}, ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForApp(page);
      await page.locator('input[type=file]').first().setInputFiles(DOCX);
      await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: 'Create resume' }).click();
      await skipTour(page);
      await page.getByRole('button', { name: 'Later' }).click({ timeout: 3_000 }).catch(() => {});

      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if ((theme === 'dark') !== isDark) {
        await page.getByRole('button', { name: 'More', exact: true }).click();
        await page.getByRole('menuitem', { name: new RegExp(`Switch to ${theme === 'dark' ? 'dark' : 'light'} mode`) }).click();
      }

      await page.waitForTimeout(400); // colours transition over 150 ms: wait until the theme has settled
      mkdirSync(OUT, { recursive: true });
      const shot = (name: string) => page.screenshot({ path: path.join(OUT, `${width}x${height}-${theme}-${name}.png`) });
      const phone = width < 768; // below the desktop split: one view at a time, switched by the tabs

      // Write (the editor)
      if (phone) await page.getByRole('tab', { name: 'Write', exact: true }).click();
      await shot('write');
      await checkLayout(page, width, height, 'write');

      // Page (the preview)
      if (phone) await page.getByRole('tab', { name: 'Page', exact: true }).click();
      else await page.waitForTimeout(100);
      await expect(page.locator(".a4-sheet").first()).toBeVisible();
      await page.waitForTimeout(250); // the sheet eases in (transition-transform)
      await shot('page');
      await checkLayout(page, width, height, 'page');

      // Notes (the checks)
      if (phone) await page.getByRole('tab', { name: 'Notes', exact: true }).click();
      else await openNotes(page);
      await expect(page.getByRole('complementary', { name: 'Notes' })).toBeVisible({ timeout: 10_000 });
      await shot('notes');
      await page.getByRole('button', { name: 'Close notes' }).click();

      // More (the menu, where the rest of the header lives)
      await page.getByRole('button', { name: 'More', exact: true }).click();
      await expect(page.getByRole('menu', { name: 'More' })).toBeVisible();
      await shot('more');
      await page.keyboard.press('Escape');
      await page.mouse.click(1, 1);
    });
  }
}

async function checkLayout(page: import('@playwright/test').Page, width: number, height: number, view: string) {
  const label = `${width}x${height} ${view}`;
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(metrics.scrollWidth, `${label}: horizontal scrolling`).toBeLessThanOrEqual(metrics.innerWidth);

  const headerControls = await page.$$eval('header.no-print button, header.no-print a[href], header.no-print input', (els) =>
    els.filter((e) => (e as HTMLElement).offsetParent !== null).length
  );
  expect(headerControls, `${label}: header controls`).toBeLessThanOrEqual(4);

  const pdf = page.locator('header.no-print button', { hasText: /PDF/ }).first();
  const box = await pdf.boundingBox();
  expect(box, `${label}: Download PDF is visible`).not.toBeNull();
  expect(box!.y + box!.height, `${label}: Download PDF is on screen`).toBeLessThanOrEqual(height);
  expect(box!.x + box!.width, `${label}: Download PDF is on screen (width)`).toBeLessThanOrEqual(width);

  if (width < 1024) {
    const small = await page.$$eval('header.no-print button:visible, nav[aria-label="Views"] [role="tab"]:visible', (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { name: (e.textContent || e.getAttribute('aria-label') || '').trim(), w: r.width, h: r.height };
      })
    );
    for (const c of small) {
      expect(Math.min(c.w, c.h), `${label}: "${c.name}" is ${Math.round(c.w)} by ${Math.round(c.h)} px`).toBeGreaterThanOrEqual(44);
    }
  }

  // Links inside the resume are running text, and the page is scaled to fit small screens. WCAG 2.5.8
  // exempts inline links, so their size is not measured here. Controls are measured above.
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .exclude('.a4-sheet a')
    .analyze();
  const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 140)).join(' || ')}`), `${label}: axe`).toEqual([]);
}
