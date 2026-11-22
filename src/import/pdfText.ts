/**
 * Reads positioned text from a PDF with pdf.js and reconstructs its lines and reading order.
 * Works in the browser (with the bundled worker) and in Node (tests), where workerSrc is omitted.
 */

import { layoutItems, readingOrder, TextLine } from './layout';


export async function extractTextLines(data: ArrayBuffer | Uint8Array, workerSrc?: string): Promise<TextLine[]> {
  // The legacy build runs in browsers and in Node (the tests)
  const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (workerSrc) pdf.GlobalWorkerOptions.workerSrc = workerSrc;

  const doc = await pdf.getDocument({ data: data instanceof Uint8Array ? data : new Uint8Array(data), verbosity: 0 }).promise;

  // Pass 1: read every page's items. Font family names are generic in many PDFs (all "sans-serif"),
  // so emphasis is inferred from the font face: any face other than the document's body face.
  const pages: { pageNo: number; items: { str: string; x: number; y: number; width: number; size: number; font: string }[] }[] = [];
  const chars = new Map<string, number>();
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    const items = (content.items as any[])
      .filter((it) => typeof it.str === 'string' && it.str.trim().length > 0)
      .map((it) => {
        const font: string = it.fontName ?? '';
        chars.set(font, (chars.get(font) ?? 0) + it.str.length);
        return {
          str: it.str,
          x: it.transform[4],
          y: it.transform[5],
          width: it.width ?? 0,
          size: Math.abs(it.transform[3]) || it.height || 10,
          font,
        };
      });
    pages.push({ pageNo, items });
  }

  // Body face: the font that carries the most text
  let bodyFont = '';
  let most = -1;
  for (const [font, n] of chars) {
    if (n > most) {
      bodyFont = font;
      most = n;
    }
  }

  // Pass 2: lay out each page; a face other than the body face is emphasis (bold)
  const lines: TextLine[] = [];
  for (const { pageNo, items } of pages) {
    lines.push(
      ...layoutItems(
        items.map(({ font, ...item }) => ({ ...item, bold: font !== bodyFont })),
        pageNo
      )
    );
  }

  return readingOrder(lines);
}
