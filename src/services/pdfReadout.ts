/**
 * Read a PDF the way the importer does (pdf.js text, layout, structure), so the ATS check sees
 * what a parser sees in the real file, not a guess from the layout.
 */

import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { extractTextLines } from '../import/pdfText';
import { structureFromLines } from '../import/structure';
import { markdownToResume } from '../model/serialize';
import { Resume } from '../model/resume';
import { generatePdf } from '../pdf/generate';
import { PageSize } from '../pdf/layout';
import { pdfProblems, AtsProblem } from '../intelligence/atsCompare';

export interface PdfReadout {
  /** Plain text in reading order, as the reader found it */
  text: string;
  headings: string[];
  email?: string;
  phone?: string;
  problems: AtsProblem[];
  pages: number;
}

/** Read PDF bytes and compare them with the resume */
export async function readPdfBytes(bytes: Uint8Array, resume: Resume): Promise<PdfReadout> {
  const workerSrc = typeof window !== 'undefined' ? pdfWorkerUrl : undefined;
  const lines = await extractTextLines(bytes.slice(), workerSrc);
  const structure = structureFromLines(lines);
  const read = markdownToResume(structure.markdown, resume.meta.title);
  const text = lines.map((l) => l.text).join('\n');
  const headings = structure.sections.map((s) => s.title);
  const email = read.basics.email || undefined;
  const phone = read.basics.phone || undefined;
  return {
    text,
    headings,
    email,
    phone,
    pages: new Set(lines.map((l) => l.page)).size,
    problems: pdfProblems(resume, { text, detectedHeadings: headings, email, phone }),
  };
}

/** Generate the resume's real PDF and read it back */
export async function readGeneratedPdf(resume: Resume, pageSize: PageSize): Promise<PdfReadout> {
  const bytes = await generatePdf(resume, { pageSize });
  return readPdfBytes(bytes, resume);
}
