import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildBundleWithPdfs } from './exportBundle';
import { zipBundle } from './exportBundle';
import { unzipSync } from 'fflate';
import { markdownToResume } from '../model/serialize';
import { PDFDocument } from 'pdf-lib';

const fromDisk = async (file: string) => new Uint8Array(readFileSync(join(process.cwd(), 'public', 'fonts', file)));
const loadFont = async (file: string) => fromDisk(file);

const MD = `# Jane Doe
jane@example.com

## Experience
### Acme — Engineer
- Led migration of services
`;

describe('export bundle with real PDFs', () => {
  it('positive: resume.pdf is a real PDF and cover-letter.pdf is added when there is a letter', async () => {
    const r = markdownToResume(MD, 'Jane');
    const files = await buildBundleWithPdfs({ resume: r, exportedAt: 'x', coverLetterMarkdown: 'Dear hiring team' }, 'A4', loadFont);
    const back = unzipSync(zipBundle(files));
    const dec = new TextDecoder();
    expect(dec.decode(back['resume.pdf'].slice(0, 5))).toBe('%PDF-');
    expect(dec.decode(back['cover-letter.pdf'].slice(0, 5))).toBe('%PDF-');
    expect(back['README.txt']).toBeDefined();
    const doc = await PDFDocument.load(back['resume.pdf']);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('negative: no cover letter means no cover-letter.pdf', async () => {
    const r = markdownToResume(MD, 'Jane');
    const files = await buildBundleWithPdfs({ resume: r, exportedAt: 'x' }, 'Letter', loadFont);
    expect(files['cover-letter.pdf']).toBeUndefined();
    expect(files['resume.pdf']).toBeDefined();
  });
});
