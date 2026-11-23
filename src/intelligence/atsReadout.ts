/**
 * Print-layout readout: the text a parser would read from the resume's print HTML,
 * in DOM reading order. This is an estimate from the layout, not a read of a PDF file;
 * the PDF check (atsCompare.ts) reads a file the user exported.
 */

import { parseResumeMarkdown } from '../parser/markdown';
import { Resume } from '../model/resume';
import { resumeToMarkdown } from '../model/serialize';
import { forOutput } from '../model/edit';

export interface Readout {
  /** One entry per visual block, in reading order */
  lines: string[];
  /** Heading texts in reading order */
  headings: string[];
  /** The first heading's name, from the top-level heading */
  name: string;
  hasTwoColumns: boolean;
  contactLines: number[];
  firstHeadingLine: number;
  email?: string;
  phone?: string;
  /** Skill pills whose text runs into the next text with no space between */
  adjacentPills: string[];
  symbolGlyphs: boolean;
}

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE = /\+?\d[\d\s().-]{7,}\d/;
const SYMBOLS = /[☀-➿\u{1F300}-\u{1FAFF}]/u;
const BLOCK = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'DIV', 'SECTION', 'UL', 'OL', 'HEADER']);

/** The print HTML for a resume (sanitised, the same as the preview) */
export function printHtml(resume: Resume): string {
  return parseResumeMarkdown(resumeToMarkdown(forOutput(resume)));
}

export function readoutFromHtml(html: string): Readout {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const all = Array.from(doc.body.querySelectorAll('*'));

  // Leaf blocks: block elements with no block elements inside them, in document order
  const leaves = all.filter(
    (el) => BLOCK.has(el.tagName) && !Array.from(el.querySelectorAll('*')).some((d) => BLOCK.has(d.tagName))
  );
  const lines = leaves.map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);

  const headings = Array.from(doc.body.querySelectorAll('h2')).map((h) => (h.textContent ?? '').trim()).filter(Boolean);
  const name = (doc.body.querySelector('h1')?.textContent ?? '').trim();

  const firstHeadingLine = lines.findIndex((l) => headings.includes(l));
  const contactLines: number[] = [];
  lines.forEach((l, i) => {
    if (EMAIL.test(l) || PHONE.test(l)) contactLines.push(i);
  });

  const adjacentPills: string[] = [];
  doc.body.querySelectorAll('.skill-pill').forEach((pill) => {
    const next = pill.nextSibling;
    const prev = pill.previousSibling;
    const runsIntoNext = !!next && next.nodeType === 3 && /^\S/.test(next.textContent ?? '');
    const glued =
      (!!next && next.nodeType === 1 && (next as Element).classList.contains('skill-pill')) ||
      (!!prev && prev.nodeType === 1 && (prev as Element).classList.contains('skill-pill'));
    const runsIntoPrev = !!prev && prev.nodeType === 3 && /\S$/.test(prev.textContent ?? '');
    if (runsIntoNext || glued || runsIntoPrev) adjacentPills.push((pill.textContent ?? '').trim());
  });

  const text = lines.join('\n');
  return {
    lines,
    headings,
    name,
    hasTwoColumns: !!doc.body.querySelector('.resume-columns, .resume-col'),
    contactLines,
    firstHeadingLine,
    email: text.match(EMAIL)?.[0],
    phone: lines.map((l) => l.match(PHONE)?.[0]).find(Boolean),
    adjacentPills,
    symbolGlyphs: SYMBOLS.test(text),
  };
}
