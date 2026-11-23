/**
 * Export bundle: one .zip with the resume in several forms, the cover letter, and a full backup.
 * Everything is built in the browser; nothing is uploaded.
 *
 * Note: a browser cannot save a PDF without the print dialog. The bundle therefore contains
 * print-ready HTML files: open one and choose Print > Save as PDF to get a text-based PDF.
 */

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { Resume } from '../model/resume';
import { resumeToMarkdown } from '../model/serialize';
import { forOutput } from '../model/edit';
import { JobApplication } from '../model/tracker';
import { parseResumeMarkdown } from '../parser/markdown';
import { markdownToPlainText } from '../utils/exportHelpers';
import { generatePdf, FontLoader } from '../pdf/generate';
import { PageSize } from '../pdf/layout';
import { coverLetterPdf } from './pdfDownload';

export const BACKUP_VERSION = 1;

export interface BundleInput {
  /** The resume to export (hidden sections and bullets are left out of the copies) */
  resume: Resume;
  /** Every resume, for the full backup */
  allResumes?: Resume[];
  coverLetterMarkdown?: string;
  applications?: JobApplication[];
  /** Exported time, so the backup can be dated (tests pass a fixed value) */
  exportedAt?: string;
}

const PRINT_CSS = `
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Georgia, serif; }
.a4-sheet { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm 18mm; box-sizing: border-box; }
h1 { font-size: 22pt; margin: 0 0 2mm; } h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid #999; margin: 5mm 0 2mm; }
h3 { font-size: 11pt; margin: 3mm 0 1mm; } p, li { font-size: 10pt; line-height: 1.4; margin: 0 0 1mm; } ul { margin: 1mm 0 2mm 5mm; padding: 0; }
.skill-pill { font-family: sans-serif; font-size: 9pt; } .resume-columns { display: flex; gap: 8mm; } .resume-col { flex: 1; }
.no-print { display: none !important; }
`;

/** A standalone HTML page for one resume or letter. The body is the sanitised preview HTML. */
export function printPage(title: string, bodyHtml: string): string {
  const safeTitle = title.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' } as Record<string, string>)[c]);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title><style>${PRINT_CSS}</style></head>
<body><div class="a4-sheet">${bodyHtml}</div></body></html>
`;
}

const README = (exportedAt: string) => `ResumeLabs export (${exportedAt})

Files in this bundle:
  resume.pdf           The resume as a PDF, text-based (selectable, readable by applicant tracking systems)
  resume.md            The resume as Markdown (hidden sections and bullets left out)
  resume.txt           The same resume as plain text, for pasting into application forms
  resume-print.html    The resume as a web page, for printing with your own settings
  cover-letter.pdf     The cover letter as a PDF (only if you wrote one)
  cover-letter.md      The cover letter as Markdown (only if you wrote one)
  cover-letter-print.html  The cover letter as a web page (only if you wrote one)
  backup.json          Everything in ResumeLabs: all resumes (including hidden content),
                       applications and the cover letter. Import it to restore; the file
                       is versioned (version ${BACKUP_VERSION}).

The PDFs are generated in the browser with the fonts embedded, so their text is selectable.
Nothing in this bundle was uploaded.
`;

/** The files of the bundle, keyed by name */
export function buildBundleFiles(input: BundleInput): Record<string, Uint8Array> {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const output = forOutput(input.resume);
  const md = resumeToMarkdown(output);
  const files: Record<string, string> = {
    'README.txt': README(exportedAt),
    'resume.md': md,
    'resume.txt': markdownToPlainText(md),
    'resume-print.html': printPage(input.resume.meta.title, parseResumeMarkdown(md)),
    'backup.json': JSON.stringify(
      {
        app: 'ResumeLabs',
        version: BACKUP_VERSION,
        exportedAt,
        resumes: input.allResumes ?? [input.resume],
        applications: input.applications ?? [],
        coverLetterMarkdown: input.coverLetterMarkdown ?? '',
      },
      null,
      2
    ),
  };
  if (input.coverLetterMarkdown?.trim()) {
    files['cover-letter.md'] = input.coverLetterMarkdown;
    files['cover-letter-print.html'] = printPage('Cover letter', parseResumeMarkdown(input.coverLetterMarkdown));
  }
  return Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)]));
}

export function zipBundle(files: Record<string, Uint8Array>): Uint8Array {
  return zipSync(files, { level: 6 });
}

/** Read a bundle back into text files (used to check a bundle, and by tests) */
export function readBundle(zip: Uint8Array): Record<string, string> {
  return Object.fromEntries(Object.entries(unzipSync(zip)).map(([name, bytes]) => [name, strFromU8(bytes)]));
}

/** Parse a backup and check its shape and version */
export function parseBackup(text: string): { ok: true; resumes: Resume[]; applications: JobApplication[]; coverLetterMarkdown: string } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  const b = data as { app?: string; version?: number; resumes?: Resume[]; applications?: JobApplication[]; coverLetterMarkdown?: string };
  if (b.app !== 'ResumeLabs') return { ok: false, error: 'This is not a ResumeLabs backup.' };
  if (b.version !== BACKUP_VERSION) return { ok: false, error: `Unsupported backup version ${b.version}.` };
  if (!Array.isArray(b.resumes)) return { ok: false, error: 'The backup has no resumes.' };
  return { ok: true, resumes: b.resumes, applications: b.applications ?? [], coverLetterMarkdown: b.coverLetterMarkdown ?? '' };
}

/** The bundle with the real PDFs added (resume.pdf and, if there is one, cover-letter.pdf) */
export async function buildBundleWithPdfs(input: BundleInput, pageSize: PageSize, loadFont?: FontLoader): Promise<Record<string, Uint8Array>> {
  const files = buildBundleFiles(input);
  files['resume.pdf'] = await generatePdf(input.resume, { pageSize, loadFont });
  if (input.coverLetterMarkdown?.trim()) {
    files['cover-letter.pdf'] = await coverLetterPdf(input.coverLetterMarkdown, pageSize, 'Cover letter', loadFont);
  }
  return files;
}

/** Build, zip and download the bundle */
export async function downloadBundle(input: BundleInput, pageSize: PageSize, filename = 'resumelabs-export.zip'): Promise<void> {
  const bytes = zipBundle(await buildBundleWithPdfs(input, pageSize));
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
