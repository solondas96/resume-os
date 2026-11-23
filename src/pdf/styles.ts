/**
 * The six templates as PDF styles. Each names a font family (sans or serif, from the embedded
 * fonts), how headings look, and where the accent colour is used. Matched to the preview's
 * template names; the preview's exact pixels are not reproduced (see the visual check).
 */

export type FontFace = 'sans' | 'sans-bold' | 'serif' | 'serif-bold';

export interface TemplateStyle {
  body: FontFace;
  heading: FontFace;
  ink: string;
  muted: string;
  accent: string;
  headingColor: 'ink' | 'accent';
  headingCase: 'caps' | 'title';
  rule: 'none' | 'thin' | 'thick' | 'accent';
  nameScale: number;
  sectionGap: number;
}

const STYLES: Record<string, TemplateStyle> = {
  modern: { body: 'sans', heading: 'sans-bold', ink: '#141413', muted: '#5f5e58', accent: '#c96442', headingColor: 'accent', headingCase: 'caps', rule: 'thin', nameScale: 2.1, sectionGap: 10 },
  minimal: { body: 'sans', heading: 'sans-bold', ink: '#111111', muted: '#666666', accent: '#111111', headingColor: 'ink', headingCase: 'caps', rule: 'none', nameScale: 1.9, sectionGap: 14 },
  swiss: { body: 'sans', heading: 'sans-bold', ink: '#000000', muted: '#333333', accent: '#c96442', headingColor: 'ink', headingCase: 'title', rule: 'thick', nameScale: 2.4, sectionGap: 10 },
  classic: { body: 'serif', heading: 'serif-bold', ink: '#1a1a1a', muted: '#555555', accent: '#333333', headingColor: 'ink', headingCase: 'caps', rule: 'thin', nameScale: 2.0, sectionGap: 10 },
  executive: { body: 'serif', heading: 'serif-bold', ink: '#1c1c1c', muted: '#4a4a4a', accent: '#8a5a2b', headingColor: 'accent', headingCase: 'title', rule: 'accent', nameScale: 2.3, sectionGap: 12 },
  academic: { body: 'serif', heading: 'serif-bold', ink: '#101010', muted: '#444444', accent: '#1f3a5f', headingColor: 'ink', headingCase: 'title', rule: 'thin', nameScale: 1.8, sectionGap: 8 },
};

/** The style for a template id; unknown ids fall back to "modern" */
export function styleFor(template: string): TemplateStyle {
  return STYLES[template] ?? STYLES.modern;
}

export const TEMPLATE_IDS = Object.keys(STYLES);
