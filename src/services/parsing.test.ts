import { describe, it, expect } from 'vitest';
import { parseResume } from './parsing';
import { parseResumeMarkdown } from '../parser/markdown';
import { ROLE_PRESETS } from '../data/rolePresets';

describe('Resume Parser Service', () => {
  it('renders Jordan Lee markdown without literal colons or broken layout', () => {
    const jordan = ROLE_PRESETS.find((p) => p.id === 'product-designer')!;
    const html = parseResumeMarkdown(jordan.markdown);
    expect(html).not.toContain(':::');
    expect(html).toContain('class="resume-columns"');
    expect(html).toContain('class="resume-col resume-col-left"');
    expect(html).toContain('class="resume-col resume-col-right"');
    // Ensure both columns are nested inside .resume-columns
    const matches = html.match(/<div class="resume-columns">[\s\S]*?<\/div>\s*<\/div>/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2); // Header links + Skills columns
  });

  it('renders all role presets without leaking container markers or breaking columns', () => {
    for (const preset of ROLE_PRESETS) {
      const html = parseResumeMarkdown(preset.markdown);
      expect(html, `Preset ${preset.id} contains leaked colons`).not.toContain(':::');
      if (preset.markdown.includes('::: left')) {
        expect(html, `Preset ${preset.id} should wrap columns`).toContain('class="resume-columns"');
        expect(html, `Preset ${preset.id} should have left column`).toContain('class="resume-col resume-col-left"');
        expect(html, `Preset ${preset.id} should have right column`).toContain('class="resume-col resume-col-right"');
      }
    }
  });

  it('handles explicit ::: cols and standalone columns safely', () => {
    const markdownWithCols = `
# Jane Doe
::: cols
::: left
Left info
:::
::: right
Right info
:::
:::
`;
    const html = parseResumeMarkdown(markdownWithCols);
    expect(html).not.toContain(':::');
    expect(html).toContain('class="resume-columns"');
    expect(html).toContain('Left info');
    expect(html).toContain('Right info');

    const markdownStandalone = `
# Only Left
::: left
Only left column
:::
`;
    const standaloneHtml = parseResumeMarkdown(markdownStandalone);
    expect(standaloneHtml).not.toContain(':::');
    expect(standaloneHtml).toContain('class="resume-col resume-col-left"');
    expect(standaloneHtml).toContain('Only left column');
  });

  it('transforms manual page breaks into .manual-page-break elements', () => {
    const content = `
Page 1
::: page-break :::
Page 2
---page-break---
Page 3
<!-- pagebreak -->
Page 4
`;
    const html = parseResumeMarkdown(content);
    expect(html).not.toContain(':::');
    expect(html).not.toContain('---page-break---');
    expect(html).not.toContain('<!-- pagebreak -->');
    const pageBreakMatches = html.match(/class="manual-page-break"/g);
    expect(pageBreakMatches?.length).toBe(3);
  });
  it('handles empty input without throwing', () => {
    const emptyResult = parseResume('');
    expect(emptyResult.summary).toBe('Resume content parsed successfully.');
    expect(emptyResult.skills).toEqual([]);
    expect(emptyResult.sections).toEqual([]);
    expect(emptyResult.experienceYears).toBeUndefined();

    const whitespaceResult = parseResume('   \n  \t  ');
    expect(whitespaceResult.summary).toBe('Resume content parsed successfully.');
    expect(whitespaceResult.skills).toEqual([]);
  });

  it('keeps bullets separate and preserves lines', () => {
    const text = `
John Doe
Senior Data Engineer with 7 years of experience in distributed systems.

Work Experience:
- Led the migration of data pipelines to Apache Spark.
- Optimized query execution across Snowflake clusters.
• Decreased pipeline latency by 45%.
`;
    const result = parseResume(text);
    const expSection = result.sections.find((s) => s.name === 'Experience');
    expect(expSection).toBeDefined();
    expect(expSection?.content).toEqual([
      'Led the migration of data pipelines to Apache Spark.',
      'Optimized query execution across Snowflake clusters.',
      'Decreased pipeline latency by 45%.',
    ]);
  });

  it('supports heading aliases and merges duplicate sections', () => {
    const text = `
John Doe
Software professional with passion for reliable infrastructure.

Work Experience:
- Built scalable REST APIs in TypeScript and Node.js.

Technical Skills:
- TypeScript, Python, Docker

Professional Experience:
- Mentored junior engineers and led sprint planning.
`;
    const result = parseResume(text);
    const expSections = result.sections.filter((s) => s.name === 'Experience');
    expect(expSections.length).toBe(1);
    expect(expSections[0].content).toContain('Built scalable REST APIs in TypeScript and Node.js.');
    expect(expSections[0].content).toContain('Mentored junior engineers and led sprint planning.');

    const skillsSection = result.sections.find((s) => s.name === 'Skills');
    expect(skillsSection).toBeDefined();
    expect(skillsSection?.content).toContain('TypeScript');
    expect(skillsSection?.content).toContain('Python');
    expect(skillsSection?.content).toContain('Docker');
  });

  it('matches multi-word skills and prevents partial token matches', () => {
    const text = `
Experience with PySpark, Delta Lake, Palantir Foundry, and Snowflake.
Also familiar with Airflow, dbt, RAG, and LLM architecture.
Do not match subwords like ragtag or delta or lake separately if not appropriate.
`;
    const result = parseResume(text);
    expect(result.skills).toContain('PySpark');
    expect(result.skills).toContain('Delta Lake');
    expect(result.skills).toContain('Palantir Foundry');
    expect(result.skills).toContain('Snowflake');
    expect(result.skills).toContain('Airflow');
    expect(result.skills).toContain('dbt');
    expect(result.skills).toContain('RAG');
    expect(result.skills).toContain('LLM');
  });

  it('extracts experience years from explicit phrases taking the maximum', () => {
    const text = `
Jane Doe
Staff Engineer with 6 years of experience in distributed data architecture.
Previously had 4 years of experience as backend lead, and now possesses 10+ years of total experience across the industry.
`;
    const result = parseResume(text);
    expect(result.experienceYears).toBe(10);
  });

  it('extracts summary using the first sentence before headings with at least 4 words', () => {
    const text = `
Jane Doe
Senior Architect
Innovative technologist with a proven history of designing enterprise platforms.
Contact: jane@example.com

Skills:
- Go, Kubernetes
`;
    const result = parseResume(text);
    expect(result.summary).toBe(
      'Innovative technologist with a proven history of designing enterprise platforms.'
    );
  });
});
