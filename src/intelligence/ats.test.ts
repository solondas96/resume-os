// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readoutFromHtml, printHtml } from './atsReadout';
import { layoutProblems, pdfProblems } from './atsCompare';
import { markdownToResume } from '../model/serialize';
import { ROLE_PRESETS } from '../data/rolePresets';

const ids = (list: { rule: string }[]) => list.map((p) => p.rule);

const GOOD = `# Jane Doe
jane@example.com · +1 (415) 555-0134

## Experience
### Acme — Engineer
- Led migration of services

## Skills
- Go, Kafka, Terraform
`;

describe('print-layout readout', () => {
  it('positive: reads lines in order, the headings, the name and the contact details', () => {
    const r = readoutFromHtml(printHtml(markdownToResume(GOOD, 'J')));
    expect(r.name).toBe('Jane Doe');
    expect(r.headings).toEqual(['Experience', 'Skills']);
    expect(r.email).toBe('jane@example.com');
    expect(r.phone).toBe('+1 (415) 555-0134');
    expect(r.lines.indexOf('Led migration of services')).toBeGreaterThan(r.lines.indexOf('Experience'));
  });

  it('negative: a single-column resume is not flagged as two columns', () => {
    expect(readoutFromHtml(printHtml(markdownToResume(GOOD, 'J'))).hasTwoColumns).toBe(false);
  });

  it('the sample preset (two-column header) is flagged as two columns', () => {
    const sample = ROLE_PRESETS[0];
    expect(readoutFromHtml(printHtml(markdownToResume(sample.markdown, 'S'))).hasTwoColumns).toBe(true);
  });

  it('positive: tags with no space between them are reported', () => {
    const r = readoutFromHtml('<h1>A</h1><p><span class="skill-pill">Go</span><span class="skill-pill">Kafka</span></p>');
    expect(r.adjacentPills).toEqual(['Go', 'Kafka']);
  });

  it('negative: tags separated by a space are not reported', () => {
    const r = readoutFromHtml('<h1>A</h1><p><span class="skill-pill">Go</span> <span class="skill-pill">Kafka</span></p>');
    expect(r.adjacentPills).toEqual([]);
  });

  it('positive: contact details below a heading are detected as such', () => {
    const r = readoutFromHtml('<h1>A</h1><h2>Experience</h2><p>jane@example.com</p>');
    expect(r.firstHeadingLine).toBeLessThan(r.contactLines[0]);
    expect(ids(layoutProblems(markdownToResume('# A\n\n## Experience\n- x\n', 'A'), r))).toContain('ats.contact-after-heading');
  });

  it('positive: a symbol glyph in the text is flagged; plain text is not', () => {
    expect(readoutFromHtml('<p>Fast ⚡ delivery</p>').symbolGlyphs).toBe(true);
    expect(readoutFromHtml('<p>Fast delivery</p>').symbolGlyphs).toBe(false);
  });
});

describe('layout problems against the model', () => {
  it('positive: no email in the model or the layout is flagged', () => {
    const resume = markdownToResume('# A\n\n## Experience\n### Acme — Engineer\n- x\n', 'A');
    const problems = layoutProblems(resume, readoutFromHtml(printHtml(resume)));
    expect(ids(problems)).toContain('ats.no-email');
  });

  it('negative: a resume with contact details and standard headings has no warnings', () => {
    const resume = markdownToResume(GOOD, 'J');
    const problems = layoutProblems(resume, readoutFromHtml(printHtml(resume)));
    expect(ids(problems)).not.toContain('ats.no-email');
    expect(ids(problems)).not.toContain('ats.nonstandard-heading');
  });

  it('positive: an unrecognised heading is reported', () => {
    const resume = markdownToResume(`${GOOD}\n## Volunteering\n- Coached a team\n`, 'J');
    expect(ids(layoutProblems(resume, readoutFromHtml(printHtml(resume))))).toContain('ats.nonstandard-heading');
  });

  it('positive: an empty section is reported', () => {
    const resume = markdownToResume(`${GOOD}\n## Projects\n`, 'J');
    expect(ids(layoutProblems(resume, readoutFromHtml(printHtml(resume))))).toContain('ats.empty-section');
  });
});

describe('exported PDF read back with pdf.js, compared with the model', () => {
  const resume = markdownToResume(GOOD, 'J');
  const pdfText = 'Jane Doe\njane@example.com +1 (415) 555-0134\nExperience\nLed migration of services\nSkills\nGo, Kafka, Terraform';

  it('negative: a faithful read has no content or order problems', () => {
    const problems = pdfProblems(resume, { text: pdfText, detectedHeadings: ['Experience', 'Skills'], email: 'jane@example.com', phone: '+1 (415) 555-0134' });
    expect(ids(problems)).toEqual([]);
  });

  it('positive: a bullet missing from the PDF text is reported', () => {
    const problems = pdfProblems(resume, { text: pdfText.replace('Led migration of services', ''), detectedHeadings: ['Experience', 'Skills'], email: 'jane@example.com', phone: '+1 (415) 555-0134' });
    expect(ids(problems)).toContain('pdf.text-missing');
  });

  it('positive: a heading the reader did not find is reported', () => {
    const problems = pdfProblems(resume, { text: pdfText, detectedHeadings: ['Experience'], email: 'jane@example.com', phone: '+1 (415) 555-0134' });
    expect(ids(problems)).toContain('pdf.heading-missing');
  });

  it('positive: bullets read in a different order from the model are reported', () => {
    const two = markdownToResume('# J\n\n## Experience\n### Acme — Engineer\n- First bullet here\n- Second bullet here\n', 'J');
    const problems = pdfProblems(two, { text: 'Second bullet here\nFirst bullet here', detectedHeadings: ['Experience'] });
    expect(ids(problems)).toContain('pdf.order');
  });

  it('positive: a missing email in the PDF text is reported', () => {
    const problems = pdfProblems(resume, { text: pdfText.replace('jane@example.com', ''), detectedHeadings: ['Experience', 'Skills'] });
    expect(ids(problems)).toContain('pdf.email-missing');
  });
});
