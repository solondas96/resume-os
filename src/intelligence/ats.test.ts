import { describe, it, expect } from 'vitest';
import { buildAtsPreview } from './ats';
import { markdownToResume } from '../model/serialize';

const GOOD = `# Jane Doe
jane@example.com · +1 (415) 555-0182 · Lisbon

## Experience
### Acme — Engineer
- Led migration, cutting build time 40%

## Skills
- TypeScript, Kubernetes
`;

describe('ATS preview', () => {
  it('positive: reads contact fields and sections in reading order', () => {
    const p = buildAtsPreview(markdownToResume(GOOD, 'Jane'));
    expect(p.lines[0]).toBe('Jane Doe');
    expect(p.contact.email).toBe('jane@example.com');
    expect(p.contact.phone).toBe('+1 (415) 555-0182');
    expect(p.detectedSections).toEqual(['Experience', 'Skills']);
    expect(p.text.indexOf('EXPERIENCE')).toBeLessThan(p.text.indexOf('SKILLS'));
    expect(p.problems).toEqual([]);
  });

  it('negative: missing email and phone are flagged', () => {
    const p = buildAtsPreview(markdownToResume('# Jane Doe\n\n## Experience\n### Acme — Engineer\n- Did a thing\n', 'Jane'));
    const rules = p.problems.map((x) => x.rule);
    expect(rules).toContain('ats.no-email');
    expect(rules).toContain('ats.no-phone');
  });

  it('negative: hidden sections are left out of the preview', () => {
    const r = markdownToResume(GOOD, 'Jane');
    r.sections[1].hidden = true;
    const p = buildAtsPreview(r);
    expect(p.detectedSections).toEqual(['Experience']);
    expect(p.text).not.toContain('SKILLS');
  });

  it('negative: an empty section is flagged', () => {
    const p = buildAtsPreview(markdownToResume(GOOD + '\n## Projects\n', 'Jane'));
    expect(p.problems.some((x) => x.rule === 'ats.empty-section')).toBe(true);
  });
});
