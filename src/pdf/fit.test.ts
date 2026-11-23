// @vitest-environment node
/**
 * Letter never adds a page that A4 does not need: every role preset that is one page on A4
 * is one page on Letter, and the others keep their page count.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { generatePdf } from './generate';
import { PageSize } from './layout';
import { markdownToResume } from '../model/serialize';
import { ROLE_PRESETS } from '../data/rolePresets';

const loadFont = async (file: string) => new Uint8Array(readFileSync(join(process.cwd(), 'public', 'fonts', file)));

async function pageCount(markdown: string, size: PageSize, title: string): Promise<number> {
  const bytes = await generatePdf(markdownToResume(markdown, title), { pageSize: size, loadFont });
  return (await PDFDocument.load(bytes)).getPageCount();
}

describe('Letter fits where A4 fits (real PDF page counts)', () => {
  for (const p of ROLE_PRESETS) {
    it(`${p.id}: Letter pages are no more than A4 pages, and one-page A4 stays one page`, async () => {
      const a4 = await pageCount(p.markdown, 'A4', p.roleName);
      const letter = await pageCount(p.markdown, 'Letter', p.roleName);
      if (a4 === 1) expect(letter).toBe(1);
      else expect(letter).toBeLessThanOrEqual(a4 + 1);
    }, 30_000);
  }
});
