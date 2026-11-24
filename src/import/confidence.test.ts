import { describe, it, expect } from 'vitest';
import { importConfidence } from './confidence';
import { markdownToResume } from '../model/serialize';

const COMPLETE = `# Ada Lovelace
ada@example.com · +44 20 5550 0100

## Summary

Analytical engineer.

## Experience

### Engine Works — Engineer
*2019 – Present*
- Built the analytical engine's test rig
- Wrote the first published algorithm

### Mill Co — Assistant
*2016 – 2019*
- Kept the ledgers in order

## Education

### University of London
*MSc Mathematics | 2014 – 2016*
`;

describe('importConfidence', () => {
  it('positive: a complete resume with every part placed is high, with no reasons', () => {
    const report = importConfidence(markdownToResume(COMPLETE, 'Ada'), { unsorted: 0, lines: 20 });
    expect(report.level).toBe('high');
    expect(report.reasons).toEqual([]);
  });

  it('a job with no dates makes the result medium, and says so in plain words', () => {
    const md = COMPLETE.replace('*2016 – 2019*', '');
    const report = importConfidence(markdownToResume(md, 'Ada'), { unsorted: 0, lines: 20 });
    expect(report.level).toBe('medium');
    expect(report.reasons).toContain('1 of 2 jobs have no dates.');
  });

  it('a few unplaced lines (5% or less) still allow high; more makes it medium', () => {
    const resume = markdownToResume(COMPLETE, 'Ada');
    expect(importConfidence(resume, { unsorted: 1, lines: 40 }).level).toBe('high');
    const report = importConfidence(resume, { unsorted: 4, lines: 40 });
    expect(report.level).toBe('medium');
    expect(report.reasons).toContain('4 lines are not in a section yet.');
  });

  it('negative: no name at the top is low', () => {
    const md = COMPLETE.replace('# Ada Lovelace\n', '');
    const report = importConfidence(markdownToResume(md, 'Ada'), { unsorted: 0, lines: 20 });
    expect(report.level).toBe('low');
    expect(report.reasons[0]).toBe('We could not find a name at the top.');
  });

  it('negative: no section headings at all is low', () => {
    const report = importConfidence(markdownToResume('# Ada Lovelace\nada@example.com\n\nJust some text.\n', 'Ada'), { unsorted: 0, lines: 3 });
    expect(report.level).toBe('low');
    expect(report.reasons).toContain('We could not find any section headings.');
  });

  it('negative: more than 30% of lines unplaced is low', () => {
    const report = importConfidence(markdownToResume(COMPLETE, 'Ada'), { unsorted: 12, lines: 30 });
    expect(report.level).toBe('low');
  });

  it('negative: most jobs with no dates is low', () => {
    const md = COMPLETE.replace('*2019 – Present*', '').replace('*2016 – 2019*', '').replace('### Mill Co — Assistant', '### Mill Co — Assistant\n### Third — Role');
    const report = importConfidence(markdownToResume(md, 'Ada'), { unsorted: 0, lines: 20 });
    expect(report.level).toBe('low');
    expect(report.facts.rolesWithoutDates).toBeGreaterThan(report.facts.roles / 2);
  });

  it('counts the facts it used, so the review can show them', () => {
    const report = importConfidence(markdownToResume(COMPLETE, 'Ada'), { unsorted: 0, lines: 20 });
    expect(report.facts).toMatchObject({ name: true, contact: true, sections: 3, roles: 2, rolesWithoutDates: 0, rolesWithoutBullets: 0 });
  });
});
