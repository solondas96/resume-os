/**
 * DOCX structure from mammoth's HTML: list items become bullets, headings keep their level,
 * and paragraphs that are entirely bold are marked bold. Raw text export loses all of this.
 */

import { TextLine } from './layout';

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function decode(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m).replace(/\s+/g, ' ').trim();
}

/** Convert mammoth HTML into one TextLine per block element, in document order */
export function htmlToLines(html: string): TextLine[] {
  const lines: TextLine[] = [];
  const block = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  let y = 0;
  while ((m = block.exec(html)) !== null) {
    const tag = m[1];
    const inner = m[2];
    const plain = decode(inner.replace(/<[^>]+>/g, ''));
    if (!plain) continue;
    // Bold only when the bold runs make up the whole paragraph
    const boldRuns = [...inner.matchAll(/<(strong|b)>([\s\S]*?)<\/\1>/g)].map((x) => decode(x[2].replace(/<[^>]+>/g, ''))).join(' ');
    const allBold = boldRuns.length > 0 && boldRuns === plain;
    const isHeading = tag.startsWith('h');
    const text = tag === 'li' ? `• ${plain}` : plain;
    lines.push({
      text,
      x0: tag === 'li' ? 12 : 0,
      x1: 0,
      y: -(y++),
      size: isHeading ? 13 : 10,
      bold: isHeading || allBold,
      page: 1,
    });
  }
  return lines;
}
