/**
 * Resume import service: PDF/DOCX/text → structured Resume model
 * Text extraction, section detection, heuristic parsing
 */

import { Resume } from '../model/resume';
import { markdownToResume } from '../model/serialize';
// Bundled worker: served from our own origin, never from a CDN
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface ImportResult {
  success: boolean;
  /** The extracted text, so the caller can keep it as the editor source */
  text?: string;
  resume?: Resume;
  detectedSections: { title: string; content: string; confidence: 'high' | 'medium' | 'low' }[];
  warnings: string[];
  errors: string[];
}

/**
 * Detect sections using heuristic aliases
 */
function detectSections(text: string): { title: string; content: string; confidence: 'high' | 'medium' | 'low' }[] {
  const sectionAliases: Record<string, string[]> = {
    experience: ['work experience', 'professional experience', 'employment', 'work history'],
    education: ['education', 'academic', 'degree', 'university', 'college'],
    skills: ['skills', 'technical skills', 'core competencies', 'expertise'],
    projects: ['projects', 'portfolio', 'work samples'],
    certifications: ['certifications', 'licenses', 'credentials'],
  };

  const sections: { title: string; content: string; confidence: 'high' | 'medium' | 'low' }[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // Check for section headers
    for (const [sectionType, aliases] of Object.entries(sectionAliases)) {
      for (const alias of aliases) {
        if (lowerLine.includes(alias) && lowerLine.length < 100) {
          // Collect content until next section
          let content = '';
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j];
            const nextLower = nextLine.toLowerCase();

            // Stop if we hit another section
            const isNewSection = Object.values(sectionAliases)
              .flat()
              .some((a) => nextLower.includes(a) && nextLine.trim().length < 100);

            if (isNewSection && j > i + 1) break;

            content += nextLine + '\n';
            j++;
          }

          sections.push({
            title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
            content: content.trim(),
            confidence: 'high',
          });

          i = j - 1;
          break;
        }
      }
    }
  }

  return sections;
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
 * Extract text from PDF using pdfjs
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically import pdfjs to avoid bundling it unnecessarily
    const pdf = await import('pdfjs-dist');

    pdf.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const pdfDoc = await pdf.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      text += itemsToLines(content.items as any[]) + '\n';
    }

    return text;
  } catch (e) {
    console.error('PDF extraction error:', e);
    throw new Error(`Failed to extract PDF: ${e}`);
  }
}

/**
 * Extract text from DOCX using mammoth
 */
export async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically import mammoth
    const mammoth = await import('mammoth');

    const result = await mammoth.extractRawText({ arrayBuffer });
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
 * Main import function: handles all file types
 */
export async function importResume(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    detectedSections: [],
    warnings: [],
    errors: [],
  };

  try {
    let text = '';

    // Extract text based on file type
    if (file.type === 'application/pdf') {
      text = await extractPdfText(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      text = await extractDocxText(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await extractPlainText(file);
    } else {
      result.errors.push(`Unsupported file type: ${file.type}`);
      return result;
    }

    if (!text || text.trim().length === 0) {
      result.errors.push('File appears to be empty or unreadable');
      return result;
    }

    // Detect sections
    result.detectedSections = detectSections(text);

    // Convert to Resume model (plain headings become Markdown headings first)
    const fileNameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    const normalized = normalizeHeadings(text);
    const resume = markdownToResume(normalized, fileNameWithoutExt);

    // Validate
    if (!resume.basics.name || resume.basics.name.trim().length === 0) {
      result.warnings.push('Could not detect candidate name. You can add it manually.');
    }

    if (resume.sections.length === 0) {
      result.warnings.push('No structured sections detected. You may need to manually reorganize content.');
    }

    result.text = normalized;
    result.resume = resume;
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
