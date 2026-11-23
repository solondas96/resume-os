/**
 * Draws a Layout with pdf-lib. Fonts are embedded (subset), so the text is selectable and
 * extractable. Loaded on demand; not part of the startup bundle.
 */

import { PDFDocument, PDFFont, rgb, RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Layout, PAGE, Measure, PageSize } from './layout';
import { FontFace } from './styles';

/** Font files for each face. They are the app's own static fonts (public/fonts). */
export const FONT_FILES: Record<FontFace, string> = {
  sans: 'geist-400.ttf',
  'sans-bold': 'geist-700.ttf',
  serif: 'newsreader-400.ttf',
  'serif-bold': 'newsreader-600.ttf',
};

/** A measure function and the font objects for a set of font bytes */
export interface FontSet {
  fonts: Record<FontFace, { bytes: Uint8Array; font: unknown }>;
  measure: Measure;
}

export function makeMeasure(fonts: Record<FontFace, { font: unknown }>): Measure {
  return (text, face, size) => {
    const f = fonts[face].font as { layout: (s: string) => { advanceWidth: number }; unitsPerEm: number };
    return (f.layout(text).advanceWidth * size) / f.unitsPerEm;
  };
}

/** Replace characters the font has no glyph for, so embedding never fails */
function safeText(text: string, font: { hasGlyphForCodePoint: (cp: number) => boolean }): string {
  let out = '';
  for (const ch of text) out += font.hasGlyphForCodePoint(ch.codePointAt(0)!) ? ch : '-';
  return out;
}

function hex(color: string): RGB {
  const n = parseInt(color.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function renderLayout(layout: Layout, fontBytes: Record<FontFace, Uint8Array>): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle('Resume');
  doc.setCreator('ResumeLabs');
  doc.setProducer('ResumeLabs (pdf-lib)');

  const embedded: Record<string, PDFFont> = {};
  const raw: Record<FontFace, { hasGlyphForCodePoint: (cp: number) => boolean }> = {} as never;
  for (const face of Object.keys(fontBytes) as FontFace[]) {
    const parsed = fontkit.create(fontBytes[face] as never) as unknown as { hasGlyphForCodePoint: (cp: number) => boolean };
    raw[face] = parsed;
    embedded[face] = await doc.embedFont(fontBytes[face], { subset: true });
  }

  const size = PAGE[layout.pageSize];
  const pages = Array.from({ length: Math.max(1, layout.pages) }, () => doc.addPage([size.width, size.height]));

  for (const op of layout.ops) {
    const page = pages[op.page - 1];
    if (!page) continue;
    if (op.kind === 'text') {
      const text = safeText(op.text, raw[op.face]);
      page.drawText(text, { x: op.x, y: size.height - op.y, size: op.size, font: embedded[op.face], color: hex(op.color) });
    } else {
      page.drawLine({
        start: { x: op.x1, y: size.height - op.y },
        end: { x: op.x2, y: size.height - op.y },
        thickness: op.width,
        color: hex(op.color),
      });
    }
  }
  // Plain object dictionaries (not packed into object streams) keep the file inspectable; the
  // page content streams are still compressed
  return doc.save({ useObjectStreams: false });
}

export type { PageSize };
