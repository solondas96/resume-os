// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generatePdf, pageSizeForLocale } from './generate';
import { extractTextLines } from '../import/pdfText';
import { markdownToResume } from '../model/serialize';
import { TEMPLATE_IDS } from './styles';

const fromDisk = async (file: string) => new Uint8Array(readFileSync(join(process.cwd(), 'public', 'fonts', file)));

const MD = `# Jane Doe
jane@example.com · +1 (415) 555-0134

## Experience
### Acme Corp — Senior Engineer
*Jan 2019 – Present*
- Led migration of 40 services to Kubernetes, cutting deploy time by 60%
- Mentored 5 engineers across 3 teams

## Skills
- **Languages:** Go, TypeScript
`;

const resume = (template = 'modern') => ({
  ...markdownToResume(MD, 'Jane'),
  design: { template, accent: '#c96442', fontSize: 'medium', margin: 'normal', lineHeight: 'normal' },
});

describe('generated PDF', () => {
  it('is a real PDF with embedded fonts, and its text can be extracted', async () => {
    const bytes = await generatePdf(resume(), { pageSize: 'A4', loadFont: fromDisk });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('/FontFile2'); // a TrueType font is embedded
    expect(text).not.toMatch(/\/Helvetica\b/); // not a standard font

    const lines = await extractTextLines(bytes.slice());
    const all = lines.map((l) => l.text).join('\n');
    expect(all).toContain('Jane Doe');
    expect(all).toContain('Led migration of 40 services to Kubernetes, cutting deploy time by 60%');
    expect(all).toContain('Mentored 5 engineers across 3 teams');
    expect(all).toMatch(/experience/i); // the modern template sets headings in capitals
  }, 60_000);

  it('the page size is A4 or Letter as asked', async () => {
    const a4 = await generatePdf(resume(), { pageSize: 'A4', loadFont: fromDisk });
    const letter = await generatePdf(resume(), { pageSize: 'Letter', loadFont: fromDisk });
    const mediaBox = (b: Uint8Array) => new TextDecoder('latin1').decode(b).match(/MediaBox\s*\[([^\]]+)\]/)?.[1].trim();
    expect(mediaBox(a4)).toBe('0 0 595.28 841.89');
    expect(mediaBox(letter)).toBe('0 0 612 792');
  }, 60_000);

  it('every template renders to a PDF', async () => {
    for (const t of TEMPLATE_IDS) {
      const bytes = await generatePdf(resume(t), { pageSize: 'A4', loadFont: fromDisk });
      expect(bytes.byteLength, t).toBeGreaterThan(1000);
    }
  }, 120_000);

  it('a character the font lacks does not break the file', async () => {
    const md = `# Jane\n\n## Summary\nArrows → work in some fonts only.\n`;
    const bytes = await generatePdf({ ...markdownToResume(md, 'Jane') }, { pageSize: 'A4', loadFont: fromDisk });
    expect(bytes.byteLength).toBeGreaterThan(1000);
  }, 60_000);

  it('the default page size follows the locale: Letter for US and Canada, A4 elsewhere', () => {
    expect(pageSizeForLocale('en-US')).toBe('Letter');
    expect(pageSizeForLocale('en-CA')).toBe('Letter');
    expect(pageSizeForLocale('en-GB')).toBe('A4');
    expect(pageSizeForLocale('de-DE')).toBe('A4');
    expect(pageSizeForLocale(undefined)).toBe('A4');
  });
});
