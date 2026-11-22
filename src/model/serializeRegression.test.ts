import { describe, it, expect } from 'vitest';
import { markdownToResume } from './serialize';

describe('markdownToResume: ### entries inside a ## section', () => {
  it('keeps every experience entry and its bullets', () => {
    const md = `# Jane Doe

## Experience
### Acme — Staff Engineer
- Led migration, cutting build time 40%
- Mentored 4 engineers

### Globex — Engineer
- Built the billing pipeline
`;
    const resume = markdownToResume(md, 'Jane');
    const exp = resume.sections.find((s) => s.kind === 'experience');
    const items = (exp?.items ?? []) as { company: string; role: string; bullets: unknown[] }[];
    expect(items.map((i) => i.company)).toEqual(['Acme', 'Globex']);
    expect(items[0].role).toBe('Staff Engineer');
    expect(items[0].bullets.length).toBe(2);
    expect(items[1].bullets.length).toBe(1);
  });

  it('keeps the sections after an experience block', () => {
    const md = `# Jane

## Experience
### Acme — Engineer
- Did things

## Skills
- TypeScript, React
`;
    const resume = markdownToResume(md, 'Jane');
    expect(resume.sections.map((s) => s.kind)).toEqual(['experience', 'skills']);
  });
});
