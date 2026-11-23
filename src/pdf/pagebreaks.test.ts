// @vitest-environment node
/**
 * Page breaks in the real PDF, on every page: for each template, both page sizes, and three resume
 * shapes (one page, two pages, very sparse). Checks:
 *  A. No page ends with a section heading or a role line.
 *  B. A section heading is followed on the same page by its content.
 *  C. A role line with bullets is followed on the same page by its first bullet (or location).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generatePdf } from './generate';
import { TEMPLATE_IDS } from './styles';
import { PageSize } from './layout';
import { extractTextLines } from '../import/pdfText';
import type { TextLine } from '../import/layout';
import { markdownToResume } from '../model/serialize';
import type { Resume } from '../model/resume';

const loadFont = async (file: string) => new Uint8Array(readFileSync(join(process.cwd(), 'public', 'fonts', file)));

function entriesMd(count: number, bullets: number): string {
  let md = '## Experience\n';
  for (let i = 1; i <= count; i++) {
    md += `### Company ${i} — Role ${i}\n*City | Jan 20${String(10 + (i % 10)).padStart(2, '0')} – Present*\n`;
    for (let b = 1; b <= bullets; b++) md += `- Delivered result ${i}.${b} for the team and the customer\n`;
  }
  return md;
}


interface Expect {
  titles: string[];
  heads: string[];
}

/** The section titles and role lines the resume prints, to find them in the extracted text */
function expected(resume: Resume): Expect {
  const titles = resume.sections.map((s) => s.title);
  const heads: string[] = [];
  for (const s of resume.sections) {
    if (s.kind !== 'experience' && s.kind !== 'education') continue;
    for (const item of s.items) {
      const it = item as { role?: string; company?: string; school?: string; degree?: string };
      heads.push(s.kind === 'experience' ? `${it.company ?? ''} — ${it.role ?? ''}` : `${it.school ?? ''} — ${it.degree ?? ''}`);
    }
  }
  return { titles, heads };
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** The violations in one PDF, as readable strings */
export function pageBreakViolations(lines: TextLine[], e: Expect): string[] {
  const out: string[] = [];
  const titleSet = new Set(e.titles.map(norm));
  const headSet = new Set(e.heads.map(norm));
  const isTitle = (l: TextLine) => titleSet.has(norm(l.text));
  const isHead = (l: TextLine) => headSet.has(norm(l.text));
  const ordered = [...lines].sort((a, b) => a.page - b.page);

  // A: the last line of each page
  const pages = [...new Set(ordered.map((l) => l.page))];
  for (const p of pages) {
    const onPage = ordered.filter((l) => l.page === p);
    const last = onPage[onPage.length - 1];
    if (isTitle(last)) out.push(`page ${p} ends with the section heading "${last.text}"`);
    if (isHead(last)) out.push(`page ${p} ends with the role line "${last.text}"`);
  }

  // B and C: what follows a heading or a role line
  ordered.forEach((l, i) => {
    const next = ordered[i + 1];
    if (!next) return;
    if (isTitle(l) && next.page !== l.page) out.push(`section "${l.text}" is split from its content (next line is on page ${next.page})`);
    if (isHead(l) && next.page !== l.page) out.push(`role "${l.text}" is split from its first line (next line is on page ${next.page})`);
  });
  return out;
}

/**
 * A page break can fall anywhere, so the content above the roles is varied: k filler summary lines move
 * the break down the page, step by step. Each k is a different resume, and every page of each is checked.
 */
function resumeWithFiller(k: number): string {
  const filler = Array.from({ length: k }, (_, i) => `Summary line ${i + 1} about the work and the people.`).join('\n');
  return `# Sam Carter\nsam@example.com | +44 20 5550 0199\n\n## Summary\n${filler}\n\n${entriesMd(5, 3)}\n## Education\n### University — BA\n*2014 – 2018*\n`;
}

const CASES = TEMPLATE_IDS.flatMap((template) =>
  (['A4', 'Letter'] as PageSize[]).map((size) => ({ template, size }))
);
const FILLER_STEPS = Array.from({ length: 22 }, (_, i) => i * 3); // 0, 3, ..., 63 lines

describe('page breaks, checked in the real PDF on every page', () => {
  for (const c of CASES) {
    it(`${c.template}, ${c.size}: no split headings or roles on any page, for every break position`, async () => {
      const failures: string[] = [];
      let pagesSeen = 0;
      for (const k of FILLER_STEPS) {
        const base = markdownToResume(resumeWithFiller(k), 'Test');
        const resume: Resume = { ...base, design: { ...base.design, template: c.template } };
        const bytes = await generatePdf(resume, { pageSize: c.size, loadFont });
        const lines = await extractTextLines(bytes);
        pagesSeen = Math.max(pagesSeen, new Set(lines.map((l) => l.page)).size);
        for (const v of pageBreakViolations(lines, expected(resume))) failures.push(`filler ${k}: ${v}`);
      }
      expect(pagesSeen).toBeGreaterThanOrEqual(2);
      expect(failures, failures.join('\n')).toEqual([]);
    }, 240_000);
  }
});

/**
 * Pictures of every page, for the CI artifact: RENDER_PAGES=1 writes test-results/page-breaks/<template>-<size>-p<n>.png
 * for a two-page resume in every template and both sizes. Off by default, so the normal run stays fast.
 */
describe.skipIf(process.env.RENDER_PAGES !== '1')('every page, as pictures (RENDER_PAGES=1)', () => {
  for (const c of CASES) {
    it(`${c.template}, ${c.size}: each page is rendered`, async () => {
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const { createCanvas } = await import('@napi-rs/canvas');
      const { mkdirSync, writeFileSync } = await import('node:fs');
      const base = markdownToResume(resumeWithFiller(30), 'Test');
      const resume: Resume = { ...base, design: { ...base.design, template: c.template } };
      const bytes = await generatePdf(resume, { pageSize: c.size, loadFont });
      const doc = await getDocument({ data: bytes, useSystemFonts: false }).promise;
      const dir = join(process.cwd(), 'test-results', 'page-breaks');
      mkdirSync(dir, { recursive: true });
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const base1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 800 / base1.width });
        const canvas = createCanvas(800, Math.round(vp.height));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx as never, viewport: vp, canvas: canvas as never }).promise;
        writeFileSync(join(dir, `${c.template}-${c.size}-p${n}.png`), canvas.toBuffer('image/png'));
      }
      expect(doc.numPages).toBeGreaterThanOrEqual(2);
    }, 120_000);
  }
});
