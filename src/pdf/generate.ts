/**
 * Generate a text-based PDF from the resume model. Loads pdf-lib, fontkit and the fonts on demand.
 * Works in the browser (fonts fetched from the app's own /fonts) and in Node (fonts read from disk).
 */

import { Resume } from '../model/resume';
import { layoutResume, PageSize, Layout } from './layout';
import { FontFace } from './styles';
import type { Measure } from './layout';

export interface FontLoader {
  (file: string): Promise<Uint8Array>;
}

/** Fetch the font files from the app's own static folder */
export const fetchFont: FontLoader = async (file) => {
  const res = await fetch(`./fonts/${file}`);
  if (!res.ok) throw new Error(`Font ${file} could not be loaded (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
};

export async function generatePdf(resume: Resume, opts: { pageSize: PageSize; loadFont?: FontLoader }): Promise<Uint8Array> {
  // The renderer (pdf-lib, fontkit) is loaded only when a PDF is made, so it stays out of the first load.
  const { FONT_FILES, makeMeasure, renderLayout } = await import('./render');
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  const load = opts.loadFont ?? fetchFont;
  const faces = Object.keys(FONT_FILES) as FontFace[];
  const bytes = {} as Record<FontFace, Uint8Array>;
  const fonts = {} as Record<FontFace, { font: unknown }>;
  for (const face of faces) {
    bytes[face] = await load(FONT_FILES[face]);
    fonts[face] = { font: fontkit.create(bytes[face] as never) };
  }
  const measure = makeMeasure(fonts);
  const layout = fitLayout(resume, opts.pageSize, measure, layoutResume);
  return renderLayout(layout, bytes);
}

/**
 * Letter is about 6% shorter than A4. A resume that fits one A4 page must still fit one Letter page,
 * so when the A4 layout is one page and the Letter layout is not, the spacing is tightened in steps.
 * Resumes that are longer than one A4 page keep the design's own spacing.
 */
const FIT_STEPS = [0.95, 0.9, 0.85, 0.8];
export function fitLayout(
  resume: Resume,
  size: PageSize,
  measure: Measure,
  layout: (r: Resume, o: { pageSize: PageSize; measure: Measure; spacing?: number }) => Layout
): Layout {
  const normal = layout(resume, { pageSize: size, measure });
  if (size !== 'Letter' || normal.pages <= 1) return normal;
  const a4 = layout(resume, { pageSize: 'A4', measure });
  if (a4.pages !== 1) return normal;
  for (const spacing of FIT_STEPS) {
    const tighter = layout(resume, { pageSize: size, measure, spacing });
    if (tighter.pages === 1) return tighter;
  }
  return normal;
}

/** Preferred page size for a locale: US and Canada use Letter, everyone else A4 */
export function pageSizeForLocale(locale: string | undefined): PageSize {
  return /^en-(US|CA)$/i.test(locale ?? '') ? 'Letter' : 'A4';
}
