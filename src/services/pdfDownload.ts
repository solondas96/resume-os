/**
 * Build and download the resume as a PDF (and the cover letter, for the bundle).
 * The PDF is generated in the browser from the model. Nothing is uploaded.
 */

import { Resume } from '../model/resume';
import { markdownToResume } from '../model/serialize';
import { generatePdf, FontLoader } from '../pdf/generate';
import { PageSize } from '../pdf/layout';

export function safeFileName(title: string, fallback = 'resume'): string {
  const base = title.trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').toLowerCase();
  return `${base || fallback}.pdf`;
}

export async function resumePdf(resume: Resume, pageSize: PageSize): Promise<Uint8Array> {
  return generatePdf(resume, { pageSize });
}

/** The cover letter, laid out with the same engine (its Markdown becomes a plain document) */
export async function coverLetterPdf(markdown: string, pageSize: PageSize, title = 'Cover letter', loadFont?: FontLoader): Promise<Uint8Array> {
  return generatePdf({ ...markdownToResume(markdown, title), design: { template: 'minimal', accent: '#111111', fontSize: 'medium', margin: 'normal', lineHeight: 'normal' } }, { pageSize, loadFont });
}

export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadResumePdf(resume: Resume, pageSize: PageSize): Promise<void> {
  downloadBytes(await resumePdf(resume, pageSize), safeFileName(resume.meta.title));
}
