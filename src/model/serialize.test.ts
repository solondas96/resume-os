import { describe, it, expect } from 'vitest';
import { markdownToResume, resumeToMarkdown, parseDateRange } from './serialize';
import { Resume, sectionItems } from './resume';
import { ROLE_PRESETS } from '../data/rolePresets';
import { SAMPLE_RESUME } from '../data/sampleResume';

/** The model without ids, metadata and design: what must survive a round trip */
function shape(r: Resume) {
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter(([k, val]) => k !== 'id' && k !== 'hidden' && val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0 && k !== 'sections' && k !== 'items' && k !== 'groups' && k !== 'lines' && k !== 'paragraphs'))
          .map(([k, val]) => [k, strip(val)])
      );
    }
    return v;
  };
  return strip({ basics: r.basics, sections: r.sections });
}

const FIXTURE_TEXT = `# Maya Chen
maya.chen@example.com · +1 (415) 555-0134 · Lisbon, Portugal

## Summary
Software engineer with 8 years building reliable backend platforms.

## Experience
### Acme Corp — Senior Software Engineer
*2019 – Present*
- Led migration of 40 services to Kubernetes, cutting deploy time by 60%
- Mentored 5 engineers across 3 teams

### Globex — Software Engineer
*2016 – 2019*
- Built a billing pipeline processing 2M events per day

## Education
### State University
*BSc Computer Science* | *2012 – 2016*

## Skills
- TypeScript, React, Kubernetes, PostgreSQL, Terraform
`;

const corpora: [string, string][] = [
  ['sample resume', SAMPLE_RESUME],
  ['import fixture (Maya Chen)', FIXTURE_TEXT],
  ...ROLE_PRESETS.map((p): [string, string] => [`preset: ${p.roleName}`, p.markdown]),
];

describe('round trip: markdown -> model -> markdown -> model', () => {
  it.each(corpora)('%s keeps the same model, and the Markdown is stable after one pass', (_name, md) => {
    const model1 = markdownToResume(md, 'Doc');
    const md2 = resumeToMarkdown(model1);
    const model2 = markdownToResume(md2, 'Doc');

    expect(shape(model2)).toEqual(shape(model1));
    expect(resumeToMarkdown(model2)).toBe(md2);
  });

  it.each(corpora)('%s loses no content: every bullet and text line shows up in the rendered model', (_name, md) => {
    const rendered = resumeToMarkdown(markdownToResume(md, 'Doc'));
    const model = markdownToResume(md, 'Doc');
    const lines = md.split('\n').map((l) => l.trim()).filter(Boolean).filter((l) => !/^:{3,}/.test(l));
    for (const line of lines) {
      // Contact lines are regenerated from the model; check each value lands in its field
      const icon = line.match(/^\[icon:(email|phone|location)\s+([^\]]+)\]/);
      if (icon) {
        expect(model.basics[icon[1] as 'email' | 'phone' | 'location'], line).toBe(icon[2]);
        continue;
      }
      if (line.includes(' · ')) {
        const values = line.split(/\s*·\s*/);
        const fields = [model.basics.email, model.basics.phone, model.basics.location];
        for (const v of values) expect(fields, `missing contact: ${v}`).toContain(v);
        continue;
      }
      expect(rendered, `missing line: ${line}`).toContain(line);
    }
  });
});

describe('parsing the dialect', () => {
  it('reads dates into year and month, and open ranges as present', () => {
    expect(parseDateRange('2021 – Present')).toEqual({ start: { year: 2021 }, end: 'present' });
    expect(parseDateRange('May 2024')).toEqual({ start: { year: 2024, month: 5 } });
    expect(parseDateRange('2016 - 2019')).toEqual({ start: { year: 2016 }, end: { year: 2019 } });
  });

  it('reads a season as a date and keeps its name', () => {
    expect(parseDateRange('Summer 2018')).toEqual({ start: { year: 2018, season: 'Summer' } });
  });

  it('negative: free text is not a date range', () => {
    expect(parseDateRange('Summer internship')).toBeNull();
    expect(parseDateRange('Remote')).toBeNull();
  });

  it('reads experience header, meta line and tags', () => {
    const r = markdownToResume('# A\n\n## Experience\n### Acme — Engineer\n*Remote* | *2019 – 2021*\n`Go` `Kafka`\n- Built things\n', 'A');
    const item = sectionItems(r.sections[0])[0] as any;
    expect(item.company).toBe('Acme');
    expect(item.role).toBe('Engineer');
    expect(item.location).toBe('Remote');
    expect(item.start).toEqual({ year: 2019 });
    expect(item.end).toEqual({ year: 2021 });
    expect(item.tags).toEqual(['Go', 'Kafka']);
    expect(item.bullets[0].text).toBe('Built things');
  });

  it('keeps two degrees under one school as two education entries', () => {
    const r = markdownToResume('# A\n\n## Education\n### Columbia\n*MBA* | *2016 – 2018*\n*BSc* | *2010 – 2014*\n', 'A');
    const items = sectionItems(r.sections[0]) as any[];
    expect(items.map((i) => i.degree)).toEqual(['MBA', 'BSc']);
    expect(items.every((i) => i.school === 'Columbia')).toBe(true);
  });

  it('reads project subtitle and link', () => {
    const r = markdownToResume('# A\n\n## Projects\n### HyperCache\n*Open source* | [icon:github github.com/a/hc](https://github.com/a/hc)\n', 'A');
    const item = sectionItems(r.sections[0])[0] as any;
    expect(item.subtitle).toBe('Open source');
    expect(item.link).toEqual({ label: 'github.com/a/hc', url: 'https://github.com/a/hc', icon: 'github' });
  });

  it('reads skill groups with their column, and an ungrouped list', () => {
    const r = markdownToResume('# A\n\n## Skills\n::: left\n- **Languages:** TypeScript, Go\n:::\n::: right\n- **Cloud:** AWS\n:::\n- Plain, list\n', 'A');
    const groups = (r.sections[0] as any).groups;
    expect(groups[0]).toMatchObject({ label: 'Languages', skills: ['TypeScript', 'Go'], column: 'left' });
    expect(groups[1]).toMatchObject({ label: 'Cloud', column: 'right' });
    expect(groups[2]).toMatchObject({ label: '', skills: ['Plain', 'list'] });
  });

  it('header contact: icon links set fields; the two-column layout is remembered', () => {
    const r = markdownToResume('# Jane\n::: left\n[icon:email j@x.io](mailto:j@x.io)\n:::\n::: right\n[icon:github gh/jane](https://github.com/jane)\n:::\n', 'J');
    expect(r.basics.email).toBe('j@x.io');
    expect(r.basics.headerColumns).toBe(true);
    expect(r.basics.links[0]).toMatchObject({ icon: 'github', column: 'right' });
  });
});

describe('nothing is dropped', () => {
  it('an unknown heading becomes a custom section with its own title', () => {
    const r = markdownToResume('# A\n\n## Volunteering\n- Mentored at school\nSome note\n', 'A');
    const s = r.sections.find((x) => x.title === 'Volunteering')!;
    expect(s.kind).toBe('custom');
    expect(s.kind === 'custom' && s.lines.map((l) => l.text)).toEqual(['Mentored at school', 'Some note']);
  });

  it('text under a known heading that fits no entry goes to an "Other" section', () => {
    const r = markdownToResume('# A\n\n## Experience\nA stray line before any role\n### Acme — Engineer\n- Did it\n', 'A');
    const other = r.sections.find((s) => s.title === 'Other')!;
    expect(other.kind === 'custom' && other.lines[0].text).toBe('A stray line before any role');
    expect(sectionItems(r.sections[0])).toHaveLength(1);
  });

  it('extra header text beyond the headline goes to an "Other" section', () => {
    const r = markdownToResume('# A\nHeadline here\nA second header paragraph that is not contact info.\n\n## Skills\n- x\n', 'A');
    expect(r.basics.headline).toBe('Headline here');
    expect(r.sections[0].title).toBe('Other');
  });

  it('a page break inside a custom section is kept', () => {
    const md = '# A\n\n## Notes\n- one\n::: page-break\n- two\n';
    const r = markdownToResume(md, 'A');
    const again = resumeToMarkdown(r);
    expect(again).toContain('::: page-break');
    expect(markdownToResume(again, 'A').sections[0]).toMatchObject({ kind: 'custom' });
  });

  it('numbered publication lines are kept as text', () => {
    const r = markdownToResume('# A\n\n## Publications\n1. **Lee, A.** (2024). A paper.\n', 'A');
    const s = r.sections[0] as any;
    expect(s.lines[0]).toMatchObject({ kind: 'text', text: '1. **Lee, A.** (2024). A paper.' });
  });
});

describe('rendering', () => {
  it('writes entries in the dialect the preview expects', () => {
    const md = resumeToMarkdown(markdownToResume('# A\n\n## Experience\n### Acme — Engineer\n*2019 – Present*\n`Go`\n- Built it\n', 'A'));
    expect(md).toContain('### Acme — Engineer');
    expect(md).toContain('*2019 – Present*');
    expect(md).toContain('`Go`');
    expect(md).toContain('- Built it');
  });

  it('empty input gives an empty resume with no sections', () => {
    const r = markdownToResume('   ', 'Blank');
    expect(r.sections).toEqual([]);
    expect(r.basics.name).toBe('');
  });
});

describe('hidden sections', () => {
  it('are still written by resumeToMarkdown (the caller decides what to show)', () => {
    const r = markdownToResume('# A\n\n## Skills\n- x\n', 'A');
    r.sections[0].hidden = true;
    expect(resumeToMarkdown(r)).toContain('## Skills');
  });
});

describe('numeric dates', () => {
  it('reads MM/YYYY as month and year', () => {
    expect(parseDateRange('03/2020 - now')).toEqual({ start: { year: 2020, month: 3 }, end: 'present' });
  });
  it('negative: a bad month is not a date', () => {
    expect(parseDateRange('13/2020')).toBeNull();
  });
});

describe('"to date" ranges', () => {
  it('"2020 to date" is a start that runs to the present', () => {
    expect(parseDateRange('2020 to date')).toEqual({ start: { year: 2020 }, end: 'present' });
  });
});

describe('day-first dates (UK, EU, India)', () => {
  it('DD/MM/YYYY reads the month from the second part', () => {
    expect(parseDateRange('01/03/2019 – 15/08/2022')).toEqual({ start: { year: 2019, month: 3 }, end: { year: 2022, month: 8 } });
  });
  it('DD.MM.YYYY (German style) reads the same way', () => {
    expect(parseDateRange('22.03.2019')).toEqual({ start: { year: 2019, month: 3 } });
  });
  it('when one part cannot be a month, the other is the month (US-style MM/DD/YYYY is still read)', () => {
    expect(parseDateRange('03/25/2020')).toEqual({ start: { year: 2020, month: 3 } });
  });
  it('negative: a day-first date with an impossible month is not a date', () => {
    expect(parseDateRange('13/13/2020')).toBeNull(); // neither part can be a month
    expect(parseDateRange('32/13/2020')).toBeNull(); // day out of range
  });
});
