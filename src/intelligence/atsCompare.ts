/**
 * ATS checks. Two sources of evidence:
 *  - the print-layout readout (what the layout gives a parser), compared with the model;
 *  - a PDF the user exported and that was read with pdf.js, compared with the model.
 * Every problem says what was seen and why it matters.
 */

import { Resume, allBullets, sectionItems } from '../model/resume';
import { Readout } from './atsReadout';

export interface AtsProblem {
  rule: string;
  severity: 'warning' | 'info';
  message: string;
  why: string;
}

const STANDARD = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

/** Problems found in the layout and the model (no PDF needed) */
export function layoutProblems(resume: Resume, readout: Readout): AtsProblem[] {
  const out: AtsProblem[] = [];
  const visible = resume.sections.filter((s) => !s.hidden);

  if (!resume.basics.email && !readout.email) {
    out.push({ rule: 'ats.no-email', severity: 'warning', message: 'No email address found', why: 'Recruiters and parsers use the email to identify and contact the candidate.' });
  }
  if (!resume.basics.phone && !readout.phone) {
    out.push({ rule: 'ats.no-phone', severity: 'info', message: 'No phone number found', why: 'Many parsers read the phone from the header as a contact field.' });
  }
  if (readout.contactLines.length > 0 && readout.firstHeadingLine >= 0 && readout.contactLines[0] > readout.firstHeadingLine) {
    out.push({ rule: 'ats.contact-after-heading', severity: 'warning', message: 'Contact details come after a section heading', why: 'Parsers expect contact details in the header, before the first section.' });
  }
  if (readout.hasTwoColumns) {
    out.push({ rule: 'ats.two-columns', severity: 'warning', message: 'Two-column layout', why: 'Some parsers read columns across the page instead of down each column. A single column is the safest choice.' });
  }
  for (const s of visible) {
    if (s.kind === 'custom' && !STANDARD.includes(s.title.toLowerCase())) {
      out.push({ rule: 'ats.nonstandard-heading', severity: 'info', message: `"${s.title}" may not be recognised as a section`, why: 'Standard headings (Experience, Education, Skills) are the ones parsers map reliably.' });
    }
  }
  for (const s of visible) {
    const empty = s.kind === 'skills' ? s.groups.length === 0 : s.kind === 'summary' ? s.paragraphs.length === 0 : s.kind === 'custom' || s.kind === 'certifications' ? s.lines.length === 0 : sectionItems(s).length === 0;
    if (empty) out.push({ rule: 'ats.empty-section', severity: 'info', message: `"${s.title}" has no content`, why: 'An empty heading adds nothing for the parser or the reader.' });
  }
  if (readout.adjacentPills.length > 0) {
    out.push({
      rule: 'ats.pills-adjacent',
      severity: 'warning',
      message: `Skill tags run together: ${readout.adjacentPills.slice(0, 3).join(', ')}`,
      why: 'Tags with no space between them extract as one word, such as "GoKafka". Keep a space or comma between tags.',
    });
  }
  if (readout.symbolGlyphs) {
    out.push({ rule: 'ats.symbol-glyphs', severity: 'info', message: 'Icons or symbols in the text', why: 'Symbol characters are often dropped or garbled by parsers.' });
  }
  if (visible.length === 0) {
    out.push({ rule: 'ats.no-sections', severity: 'warning', message: 'No visible sections', why: 'With no headings the parser cannot tell where experience and skills begin.' });
  }
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Compare an exported PDF's text (read with pdf.js) with the model.
 * `pdfText` is the text in reading order; `detectedHeadings` are the section titles the reader found.
 */
export function pdfProblems(
  resume: Resume,
  pdf: { text: string; detectedHeadings: string[]; email?: string; phone?: string }
): AtsProblem[] {
  const out: AtsProblem[] = [];
  const text = norm(pdf.text);

  if (resume.basics.email && !text.includes(norm(resume.basics.email))) {
    out.push({ rule: 'pdf.email-missing', severity: 'warning', message: 'The email address is not in the PDF text', why: 'If it is in an image or a header the parser cannot read, applicants cannot be contacted from the file.' });
  }
  if (resume.basics.phone && !pdf.phone) {
    out.push({ rule: 'pdf.phone-missing', severity: 'info', message: 'No phone number found in the PDF text', why: 'The phone number may be in an image, or formatted in a way the parser does not read.' });
  }

  const headings = pdf.detectedHeadings.map((h) => norm(h));
  for (const s of resume.sections) {
    if (s.hidden) continue;
    if (!headings.includes(norm(s.title))) {
      out.push({ rule: 'pdf.heading-missing', severity: 'warning', message: `The heading "${s.title}" was not found in the PDF`, why: 'Parsers sort content under headings. A heading they do not read leaves its content unsorted.' });
    }
  }

  // Bullets: present, and in the same order as the model
  const bullets = allBullets(resume).filter((b) => !b.bullet.hidden).map((b) => norm(b.bullet.text));
  const found: { text: string; at: number }[] = [];
  let missing = 0;
  for (const b of bullets) {
    const at = text.indexOf(b.slice(0, Math.min(b.length, 60)));
    if (at < 0) missing++;
    else found.push({ text: b, at });
  }
  if (missing > 0) {
    out.push({ rule: 'pdf.text-missing', severity: 'warning', message: `${missing} bullet${missing === 1 ? ' is' : 's are'} not in the PDF text`, why: 'Text that does not extract cannot be searched. It may be in an image, or cut off by the layout.' });
  }
  const outOfOrder = found.some((f, i) => i > 0 && f.at < found[i - 1].at);
  if (outOfOrder) {
    out.push({ rule: 'pdf.order', severity: 'warning', message: 'The PDF text is read out of order', why: 'Columns or positioned text can come out of order, so a parser reads a job\'s bullets in the wrong place.' });
  }
  return out;
}
