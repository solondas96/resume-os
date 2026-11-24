/**
 * Resume import service: PDF/DOCX/text → structured Resume model
 * Text extraction, section detection, heuristic parsing
 */

import { Resume } from '../model/resume';
import { markdownToResume } from '../model/serialize';
import { extractTextLines } from '../import/pdfText';
import { structureFromLines, StructureResult } from '../import/structure';
import { importConfidence, ConfidenceReport } from '../import/confidence';
import { linkedinToMarkdown, isZipFile } from '../import/linkedin';
import { htmlToLines } from '../import/docxHtml';
// Bundled worker: served from our own origin, never from a CDN
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

/** Shown when a PDF has no text layer (for example, a scan). No OCR is attempted. */
export const NO_TEXT_MESSAGE =
  "This PDF is an image, so its text can't be read. Try exporting it again from Word or Google Docs, or paste the text.";

export interface ImportResult {
  success: boolean;
  /** Structure detection output (sections with confidence, unsorted lines), for the review */
  structure?: StructureResult;
  /** The original text in reading order, shown beside the detected structure */
  pageText?: string;
  /** The extracted text, so the caller can keep it as the editor source */
  text?: string;
  resume?: Resume;
  /** How much to trust the parse, in plain reasons (see import/confidence.ts) */
  confidence?: ConfidenceReport;
  detectedSections: { title: string; content: string; confidence: 'high' | 'medium' | 'low' }[];
  warnings: string[];
  errors: string[];
}


/**
 * Group PDF text items into lines by their vertical position (top to bottom),
 * and join each line's items left to right.
 */
export function itemsToLines(items: { str: string; transform: number[] }[]): string {
  const rows: { y: number; parts: { x: number; str: string }[] }[] = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform[5];
    const x = item.transform[4];
    const row = rows.find((r) => Math.abs(r.y - y) < 3);
    if (row) row.parts.push({ x, str: item.str });
    else rows.push({ y, parts: [{ x, str: item.str }] });
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

const HEADING_CANONICAL: Record<string, string> = {
  summary: 'Summary',
  profile: 'Summary',
  'professional summary': 'Summary',
  experience: 'Experience',
  'work experience': 'Experience',
  'professional experience': 'Experience',
  employment: 'Experience',
  'work history': 'Experience',
  education: 'Education',
  skills: 'Skills',
  'technical skills': 'Skills',
  'core competencies': 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  licenses: 'Certifications',
};

/**
 * Turn plain section headings ("Experience", "EDUCATION:") into Markdown "## " headings,
 * and the first line into the "# " name line, so the structured parser can read them.
 */
export function normalizeHeadings(text: string): string {
  const lines = text.split('\n');
  let sawName = false;
  return lines
    .map((raw) => {
      const line = raw.trim();
      if (!line) return raw;
      if (line.startsWith('#')) {
        sawName = true;
        return raw;
      }
      const key = line.replace(/:$/, '').toLowerCase();
      if (HEADING_CANONICAL[key]) return `## ${HEADING_CANONICAL[key]}`;
      if (!sawName) {
        sawName = true;
        return `# ${line}`;
      }
      return raw;
    })
    .join('\n');
}


/**
 * Extract DOCX as HTML using mammoth (lists and headings are kept)
 */
export async function extractDocxHtml(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (e) {
    console.error('DOCX extraction error:', e);
    throw new Error(`Failed to extract DOCX: ${e}`);
  }
}

/**
 * Extract plain text (for already-formatted text files)
 */
export async function extractPlainText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Main import function: handles all file types.
 * PDF and DOCX go through structure detection; plain text and Markdown keep their headings.
 */
export async function importResume(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    detectedSections: [],
    warnings: [],
    errors: [],
  };

  try {
    const title = file.name.replace(/\.[^.]+$/, '') || 'Imported resume';
    let markdown = '';
    let pageText = '';

    if (isZipFile(file)) {
      // LinkedIn's "Get a copy of your data" export: converted to the same Markdown the review reads
      const linked = linkedinToMarkdown(new Uint8Array(await file.arrayBuffer()));
      if (!linked.ok) {
        result.errors.push(linked.error);
        return result;
      }
      markdown = linked.markdown;
      pageText = `LinkedIn export. Found: ${linked.found.filter((f) => !linked.missing.includes(f)).length} of ${linked.found.length + linked.missing.length} files.`;
      result.warnings.push(...linked.warnings);
      result.pageText = pageText;
      result.text = markdown;
      result.resume = markdownToResume(markdown, title);
      result.detectedSections = result.resume.sections.map((s) => ({ title: s.title, content: '', confidence: 'high' as const }));
      result.success = true;
      return result;
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // In the browser, use the bundled worker. In Node (tests), pdf.js uses its own.
      const lines = await extractTextLines(await file.arrayBuffer(), typeof window !== 'undefined' ? pdfWorkerUrl : undefined);
      if (lines.length === 0) {
        result.errors.push(NO_TEXT_MESSAGE);
        return result;
      }
      const structure = structureFromLines(lines);
      markdown = structure.markdown;
      pageText = lines.map((l) => l.text).join('\n');
      result.structure = structure;
      result.pageText = pageText;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      // HTML keeps list items and heading levels, which the raw text export loses
      const html = await extractDocxHtml(file);
      const lines = htmlToLines(html);
      if (lines.length === 0) {
        result.errors.push('File appears to be empty or unreadable');
        return result;
      }
      const structure = structureFromLines(lines);
      markdown = structure.markdown;
      pageText = lines.map((l) => l.text).join('\n');
      result.structure = structure;
      result.pageText = pageText;
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await extractPlainText(file);
      if (!text.trim()) {
        result.errors.push('File appears to be empty or unreadable');
        return result;
      }
      markdown = normalizeHeadings(text);
      pageText = text;
      result.pageText = pageText;
    } else {
      result.errors.push(`Unsupported file type: ${file.type || file.name}`);
      return result;
    }

    const resume = markdownToResume(markdown, title);
    result.text = markdown;
    result.resume = resume;
    result.detectedSections = (result.structure?.sections ?? resume.sections).map((s) => ({
      title: s.title,
      content: '',
      confidence: 'confidence' in s ? (s as { confidence: 'high' | 'medium' | 'low' }).confidence : 'high',
    }));

    if (!resume.basics.name) result.warnings.push('Could not detect candidate name. You can add it manually.');
    if (resume.sections.length === 0) result.warnings.push('No structured sections detected. You may need to reorganize content.');
    result.warnings.push(...(result.structure?.notes ?? []));
    result.confidence = importConfidence(resume, {
      unsorted: result.structure?.unsorted.length ?? 0,
      lines: result.structure?.lineCount ?? markdown.split('\n').filter((l) => l.trim()).length,
    });

    result.success = true;
    return result;
  } catch (e) {
    result.errors.push(`Import failed: ${e}`);
    return result;
  }
}

/**
 * Heuristic date range parser
 */
export function parseDate(text: string): { year: number; month?: number } | null {
  const text_lower = text.toLowerCase().trim();

  // Try "MMM YYYY" format
  const monthYearMatch = text_lower.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthMap: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    return { year: parseInt(monthYearMatch[2]), month: monthMap[monthYearMatch[1]] };
  }

  // Try just year
  const yearMatch = text_lower.match(/(\d{4})/);
  if (yearMatch) {
    return { year: parseInt(yearMatch[1]) };
  }

  return null;
}
