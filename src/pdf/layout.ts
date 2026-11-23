/**
 * Layout for the PDF: turns the resume model into positioned text and rules, page by page.
 * Pure: text widths come from an injected `measure` function, so this runs and is tested
 * without a PDF library or fonts. The renderer (render.ts) draws the result with pdf-lib.
 */

import { Resume, Section, sectionItems, Line } from '../model/resume';
import { forOutput } from '../model/edit';
import { styleFor, FontFace } from './styles';

export type PageSize = 'A4' | 'Letter';

/** Page size in points (1 pt = 1/72 inch) */
export const PAGE: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
};

/** Margins in points, from the design margin setting */
const MARGIN: Record<string, number> = { narrow: 40, normal: 51, relaxed: 68 };

export type Measure = (text: string, face: FontFace, size: number) => number;

export interface TextOp {
  kind: 'text';
  page: number;
  x: number;
  /** Baseline, measured from the top of the page */
  y: number;
  text: string;
  face: FontFace;
  size: number;
  color: string;
}

export interface RuleOp {
  kind: 'rule';
  page: number;
  x1: number;
  x2: number;
  y: number;
  color: string;
  width: number;
}

export type Op = TextOp | RuleOp;

export interface Layout {
  pageSize: PageSize;
  pages: number;
  ops: Op[];
  /** Plain text in reading order, for the PDF check */
  text: string;
}

export interface LayoutOptions {
  pageSize: PageSize;
  measure: Measure;
  /** Scales line leading and section gaps (1 = the design's own spacing). Used to fit a page. */
  spacing?: number;
}

const BODY: Record<string, number> = { small: 9.5, medium: 10.5, large: 11.5 };
const LEADING: Record<string, number> = { tight: 1.22, normal: 1.4, relaxed: 1.6 };

/** Lay out the resume. Hidden sections and bullets are left out, as in every output. */
export function layoutResume(resume: Resume, opts: LayoutOptions): Layout {
  const r = forOutput(resume);
  const style = styleFor(r.design.template);
  const page = PAGE[opts.pageSize];
  const margin = MARGIN[r.design.margin] ?? MARGIN.normal;
  const body = BODY[r.design.fontSize] ?? BODY.medium;
  const spacing = opts.spacing ?? 1;
  const leading = (LEADING[r.design.lineHeight] ?? LEADING.normal) * spacing;
  const accent = /^#[0-9a-fA-F]{6}$/.test(r.design.accent) ? r.design.accent : style.accent;
  const contentWidth = page.width - margin * 2;
  const bottom = page.height - margin;

  const ops: Op[] = [];
  const textLines: string[] = [];
  let pageNo = 1;
  let y = margin;

  const newPage = () => {
    pageNo += 1;
    y = margin;
  };
  const ensure = (height: number) => {
    if (y + height > bottom) newPage();
  };

  /** Draw one line of text at the current y (top of the line box) */
  const line = (text: string, o: { x?: number; face?: FontFace; size?: number; color?: string; align?: 'left' | 'right'; x2?: number }) => {
    const face = o.face ?? style.body;
    const size = o.size ?? body;
    const color = o.color ?? style.ink;
    const width = opts.measure(text, face, size);
    const x = o.align === 'right' ? (o.x2 ?? margin + contentWidth) - width : (o.x ?? margin);
    const baseline = y + size * 0.86;
    ops.push({ kind: 'text', page: pageNo, x, y: baseline, text, face, size, color });
    return width;
  };

  /** Wrap a paragraph into lines of at most `width` points */
  const wrap = (text: string, face: FontFace, size: number, width: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let current = '';
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      if (opts.measure(candidate, face, size) <= width || !current) current = candidate;
      else {
        out.push(current);
        current = w;
      }
    }
    if (current) out.push(current);
    return out;
  };

  const paragraph = (text: string, o: { face?: FontFace; size?: number; color?: string; x?: number; width?: number; gap?: number }) => {
    const size = o.size ?? body;
    const lh = size * leading;
    const x = o.x ?? margin;
    const width = o.width ?? contentWidth;
    for (const l of wrap(text, o.face ?? style.body, size, width)) {
      ensure(lh);
      line(l, { x, face: o.face, size, color: o.color });
      textLines.push(l);
      y += lh;
    }
    y += o.gap ?? 0;
  };

  // --- Header ---------------------------------------------------------------
  const nameSize = body * style.nameScale;
  ensure(nameSize * 1.3);
  if (r.basics.name) {
    line(r.basics.name, { face: style.heading, size: nameSize, color: style.ink });
    textLines.push(r.basics.name);
    y += nameSize * 1.25;
  }
  if (r.basics.headline) {
    paragraph(r.basics.headline, { size: body + 1, color: style.muted, gap: 2 });
  }
  const contact = [r.basics.email, r.basics.phone, r.basics.location, ...r.basics.links.map((l) => l.label || l.url)]
    .filter((x): x is string => !!x)
    .join('  ·  ');
  if (contact) paragraph(contact, { size: body - 0.5, color: style.muted, gap: 6 });

  // --- Sections -------------------------------------------------------------
  for (const section of r.sections) {
    sectionBlock(section);
  }

  function sectionBlock(section: Section) {
    const title = style.headingCase === 'caps' ? section.title.toUpperCase() : section.title;
    ensure(body * 3);
    y += style.sectionGap * spacing;
    line(title, { face: style.heading, size: body + 1, color: style.headingColor === 'accent' ? accent : style.ink });
    textLines.push(section.title);
    y += (body + 1) * 1.3;
    if (style.rule !== 'none') {
      ops.push({ kind: 'rule', page: pageNo, x1: margin, x2: margin + contentWidth, y: y - 2, color: style.rule === 'accent' ? accent : style.ink, width: style.rule === 'thick' ? 1.4 : 0.6 });
      y += 4;
    }
    y += 2;

    if (section.kind === 'summary') {
      for (const p of section.paragraphs.filter((x) => x.trim())) paragraph(p, { gap: 3 });
      return;
    }
    if (section.kind === 'skills') {
      for (const g of section.groups) {
        const text = g.label ? `${g.label}: ${g.skills.join(', ')}` : g.skills.join(', ');
        paragraph(text, { gap: 2 });
      }
      return;
    }
    if (section.kind === 'custom' || section.kind === 'certifications') {
      for (const l of section.lines) lineItem(l);
      return;
    }

    for (const item of sectionItems(section)) {
      entry(section, item);
    }
  }

  function lineItem(l: Line) {
    if (l.kind === 'pagebreak') {
      newPage();
      return;
    }
    if (l.kind === 'bullet') bullet(l.text);
    else paragraph(l.text, { gap: 2 });
  }

  function bullet(text: string) {
    const size = body;
    const indent = 12;
    const lh = size * leading;
    const lines = wrap(text, style.body, size, contentWidth - indent);
    lines.forEach((l, i) => {
      ensure(lh);
      if (i === 0) line('•', { x: margin + 2, face: style.body, size, color: accent });
      line(l, { x: margin + indent, size });
      textLines.push(l);
      y += lh;
    });
    y += 2;
  }

  function entry(section: Section, item: unknown) {
    const it = item as Record<string, unknown>;
    const dates = dateText(it);
    let head = '';
    let sub = '';
    if (section.kind === 'experience') {
      head = String(it.role ?? '');
      sub = String(it.company ?? '');
    } else if (section.kind === 'education') {
      head = String(it.school ?? '');
      sub = String(it.degree ?? '');
    } else {
      head = String(it.title ?? '');
      sub = String(it.subtitle ?? '');
    }
    ensure(body * 2.6);
    const headText = [head, sub].filter(Boolean).join(' — ') || '(untitled)';
    const dateWidth = dates ? opts.measure(dates, style.body, body - 0.5) : 0;
    const available = contentWidth - dateWidth - 8;
    const headLines = wrap(headText, style.heading, body + 0.5, available);
    headLines.forEach((h, i) => {
      ensure(body * leading);
      line(h, { face: style.heading, size: body + 0.5, color: style.ink });
      if (i === 0 && dates) line(dates, { face: style.body, size: body - 0.5, color: style.muted, align: 'right' });
      textLines.push(h);
      y += (body + 0.5) * leading;
    });
    if (dates && headLines.length === 0) y += body * leading;
    if (it.location) paragraph(String(it.location), { size: body - 0.5, color: style.muted });
    if (Array.isArray(it.tags) && it.tags.length) paragraph((it.tags as string[]).join(' · '), { size: body - 1, color: style.muted });
    for (const b of (it.bullets as { text: string }[]) ?? []) bullet(b.text);
    for (const n of (it.notes as string[]) ?? []) paragraph(n, { size: body - 0.5, color: style.muted, gap: 2 });
    y += 4;
  }

  return { pageSize: opts.pageSize, pages: pageNo, ops, text: textLines.join('\n') };
}

/** "Jan 2019 – Present" from the model's start and end dates */
export function dateText(it: Record<string, unknown>): string {
  const fmt = (d: { year: number; month?: number; season?: string } | undefined) => {
    if (!d) return '';
    if (d.season) return `${d.season} ${d.year}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.month ? `${months[d.month - 1]} ${d.year}` : `${d.year}`;
  };
  const start = fmt(it.start as never);
  const end = it.end === 'present' ? 'Present' : fmt(it.end as never);
  if (!start && !end) return '';
  return end ? `${start} – ${end}` : start;
}
