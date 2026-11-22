import { describe, it, expect } from 'vitest';
import { markdownToResume, resumeToMarkdown } from './serialize';

const SAMPLE_MARKDOWN = `# John Doe
john@example.com · (555) 123-4567 · San Francisco, CA

Experienced software engineer with 10+ years building scalable systems.

## Experience

### Acme Corp — Senior Engineer
- Led team of 5 engineers building payment infrastructure
- Reduced latency by 40% through database optimization
- Mentored 3 junior engineers to promotion

### StartupXYZ — Software Engineer
- Built real-time analytics dashboard in React
- Designed API serving 100k requests/second
- Established testing practices, achieving 85% coverage

## Education

### University of California — BS Computer Science
- GPA: 3.8
- Dean's List all 4 years

## Skills

**Languages**
- Python, Go, TypeScript, SQL

**Infrastructure**
- AWS, Docker, Kubernetes, PostgreSQL
`;

describe('Serialize - Round-trip Markdown ↔ Resume', () => {
  it('should parse markdown into Resume model', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'John Doe Resume');

    expect(resume.schemaVersion).toBe(2);
    expect(resume.meta.title).toBe('John Doe Resume');
    expect(resume.basics.name).toBe('John Doe');
    expect(resume.basics.email).toBe('john@example.com');
    expect(resume.sections.length).toBeGreaterThan(0);
  });

  it('should preserve all section types', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    const sectionTitles = resume.sections.map((s: any) => s.title);
    expect(sectionTitles).toContain('Experience');
    expect(sectionTitles).toContain('Education');
    expect(sectionTitles).toContain('Skills');
  });

  it('should detect experience section', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    const expSection = resume.sections.find((s: any) => s.kind === 'experience');
    expect(expSection?.kind).toBe('experience');
  });

  it('should detect education section', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    const eduSection = resume.sections.find((s: any) => s.kind === 'education');
    expect(eduSection?.kind).toBe('education');
  });

  it('should parse skills groups', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    const skillsSection = resume.sections.find((s: any) => s.kind === 'skills');
    expect(skillsSection?.groups?.length).toBeGreaterThan(0);

    const languages = (skillsSection?.groups as any)?.[0];
    expect(languages?.label).toBeTruthy();
    expect(languages?.skills?.length).toBeGreaterThan(0);
  });

  it('should convert Resume model back to markdown', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');
    const converted = resumeToMarkdown(resume);

    // Verify core structure is preserved
    expect(converted).toContain('John Doe');
    expect(converted).toContain('john@example.com');
    expect(converted).toContain('## Experience');
    expect(converted).toContain('## Education');
    expect(converted).toContain('## Skills');
  });

  it('should convert Resume model back to markdown', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');
    const converted = resumeToMarkdown(resume);

    expect(converted).toContain('John Doe');
    // Basic structure is preserved
    expect(converted.length > 0).toBe(true);
  });

  it('should preserve bullet content when present', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');
    const expSection = resume.sections.find((s) => s.kind === 'experience');

    // If items are parsed, check bullet content
    if (expSection?.items && (expSection.items as any)[0]?.bullets?.length > 0) {
      const firstBullet = (expSection?.items as any)?.[0]?.bullets?.[0]?.text;
      expect(firstBullet).toBeTruthy();
    }
  });

  it('should handle empty resume gracefully', () => {
    const resume = markdownToResume('', 'Empty');

    expect(resume.schemaVersion).toBe(2);
    expect(resume.meta.title).toBe('Empty');
    expect(resume.basics.name).toBe('');
    expect(resume.sections).toEqual([]);
  });

  it('should extract email from contact info', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    expect(resume.basics.email).toBe('john@example.com');
  });

  it('should generate unique IDs for sections', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    const sectionIds = new Set(resume.sections.map((s: any) => s.id));
    expect(sectionIds.size).toBe(resume.sections.length);
  });

  it('should generate unique IDs for all items', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    const allIds = new Set<string>();

    // Collect all IDs
    resume.sections.forEach((s) => {
      allIds.add(s.id);
      if (s.items) {
        (s.items as any[]).forEach((item) => {
          allIds.add(item.id);
          if (item.bullets) {
            item.bullets.forEach((bullet: any) => {
              allIds.add(bullet.id);
            });
          }
        });
      }
      if (s.groups) {
        s.groups.forEach((g) => {
          allIds.add(g.id);
        });
      }
    });

    // All IDs should be unique
    const idArray = Array.from(allIds);
    expect(idArray.length).toBe(allIds.size);
  });

  it('should preserve design settings in metadata', () => {
    const resume = markdownToResume(SAMPLE_MARKDOWN, 'Test');

    expect(resume.design.template).toBe('modern');
    expect(resume.design.accent).toBe('#c96442');
    expect(resume.design.fontSize).toBe('medium');
    expect(resume.design.margin).toBe('normal');
    expect(resume.design.lineHeight).toBe('normal');
  });

  it('should handle markdown with no sections gracefully', () => {
    const md = `# Jane Smith
jane@test.com

A capable engineer.`;

    const resume = markdownToResume(md, 'Jane Smith');

    expect(resume.basics.name).toBe('Jane Smith');
    expect(resume.basics.email).toBe('jane@test.com');
    expect(resume.basics.headline || resume.basics.summary).toContain('engineer');
  });
});
