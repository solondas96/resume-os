import { describe, it, expect } from 'vitest';
import { layoutResume, dateText, PAGE, Measure } from './layout';
import { markdownToResume } from '../model/serialize';
import { setBulletHidden } from '../model/edit';
import { sectionItems } from '../model/resume';

// A stand-in for font metrics: roughly half an em per character, bold a little wider
const measure: Measure = (text, face, size) => text.length * size * (face.includes('bold') ? 0.56 : 0.5);

const MD = `# Jane Doe
Staff Engineer | Platforms
jane@example.com · +1 (415) 555-0134

## Summary
Builds reliable platforms for teams that ship every day.

## Experience
### Acme Corp — Senior Engineer
*Lisbon, Portugal* | *Jan 2019 – Present*
- Led migration of 40 services to Kubernetes
- Mentored 5 engineers

## Skills
- **Languages:** Go, TypeScript
`;

const layoutOf = (md = MD, opts: Partial<{ pageSize: 'A4' | 'Letter' }> = {}) =>
  layoutResume(markdownToResume(md, 'Jane'), { pageSize: opts.pageSize ?? 'A4', measure });

describe('PDF layout', () => {
  it('positive: the name, the sections and the bullets are all placed, in reading order', () => {
    const l = layoutOf();
    expect(l.text).toContain('Jane Doe');
    expect(l.text).toContain('Experience');
    expect(l.text).toContain('Led migration of 40 services to Kubernetes');
    expect(l.text.indexOf('Led migration')).toBeGreaterThan(l.text.indexOf('Experience'));
    expect(l.text.indexOf('Go, TypeScript')).toBeGreaterThan(l.text.indexOf('Mentored'));
  });

  it('positive: dates are right-aligned on the role line', () => {
    const l = layoutOf();
    const date = l.ops.find((o) => o.kind === 'text' && o.text === 'Jan 2019 – Present');
    expect(date).toBeDefined();
    if (date?.kind === 'text') expect(date.x).toBeGreaterThan(PAGE.A4.width / 2);
  });

  it('negative: hidden bullets are not placed at all', () => {
    const r = markdownToResume(MD, 'Jane');
    const exp = r.sections.find((s) => s.kind === 'experience')!;
    const item = sectionItems(exp)[0] as any;
    const hidden = setBulletHidden(r, exp.id, item.id, item.bullets[1].id, true);
    const l = layoutResume(hidden, { pageSize: 'A4', measure });
    expect(l.text).not.toContain('Mentored 5 engineers');
  });

  it('Letter and A4 change the page, and a long resume paginates', () => {
    const long = `# A\n\n## Experience\n### Co — Role\n${Array.from({ length: 120 }, (_, i) => `- Built feature number ${i} that the team used every week`).join('\n')}\n`;
    const a4 = layoutOf(long, { pageSize: 'A4' });
    const letter = layoutOf(long, { pageSize: 'Letter' });
    expect(a4.pages).toBeGreaterThan(1);
    expect(letter.pageSize).toBe('Letter');
    expect(letter.ops.every((o) => o.kind !== 'text' || o.y <= PAGE.Letter.height)).toBe(true);
  });

  it('no text is placed below the bottom margin of its page', () => {
    const long = `# A\n\n## Experience\n### Co — Role\n${Array.from({ length: 80 }, (_, i) => `- Item ${i}`).join('\n')}\n`;
    const l = layoutOf(long);
    for (const o of l.ops) if (o.kind === 'text') expect(o.y).toBeLessThanOrEqual(PAGE.A4.height - 30);
  });

  it('a page break in a custom section starts a new page', () => {
    const md = `# A\n\n## Notes\n- one\n::: page-break\n- two\n`;
    const l = layoutOf(md);
    expect(l.pages).toBe(2);
  });

  it('each template produces a layout with its own heading case', () => {
    const modern = layoutOf(MD);
    const swiss = layoutResume({ ...markdownToResume(MD, 'J'), design: { template: 'swiss', accent: '#c96442', fontSize: 'medium', margin: 'normal', lineHeight: 'normal' } }, { pageSize: 'A4', measure });
    expect(modern.text).toContain('Experience');
    expect(swiss.ops.some((o) => o.kind === 'text' && o.text === 'Experience')).toBe(true);
  });
});

describe('dateText', () => {
  it('formats ranges, a season, and an open end', () => {
    expect(dateText({ start: { year: 2019, month: 1 }, end: 'present' })).toBe('Jan 2019 – Present');
    expect(dateText({ start: { year: 2018, season: 'Summer' } })).toBe('Summer 2018');
    expect(dateText({})).toBe('');
  });
});
