import { describe, it, expect } from 'vitest';
import { parseResumeMarkdown } from './markdown';

describe('parseResumeMarkdown - XSS Prevention', () => {
  it('should strip <script> tags and inline event handlers', () => {
    const malicious = `# Resume
<script>alert('XSS')</script>
Normal content`;
    const result = parseResumeMarkdown(malicious);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('should strip img onerror attributes', () => {
    const malicious = '<img src="x" onerror="alert(1)">';
    const result = parseResumeMarkdown(malicious);
    expect(result).not.toContain('onerror');
  });

  it('should strip onclick and other event handlers', () => {
    const malicious = '<div onclick="alert(1)">Click me</div>';
    const result = parseResumeMarkdown(malicious);
    expect(result).not.toContain('onclick');
  });

  it('should strip data: and javascript: protocol URIs in HTML', () => {
    // Test actual HTML with dangerous protocols
    const malicious = '<a href="javascript:alert(1)">Click</a>';
    const result = parseResumeMarkdown(malicious);
    // DOMPurify should sanitize dangerous protocols
    expect(result).not.toContain('javascript:');
  });

  it('should preserve safe resume content', () => {
    const safe = `# John Doe
[LinkedIn](https://linkedin.com)

## Experience
- Built \`React\` application
`;
    const result = parseResumeMarkdown(safe);
    expect(result).toContain('John Doe');
    expect(result).toContain('Experience');
    expect(result).toContain('React');
    expect(result).toContain('linkedin.com');
  });

  it('should preserve skill pills from inline code', () => {
    const content = 'Skills: `React` `TypeScript` `Node.js`';
    const result = parseResumeMarkdown(content);
    expect(result).toContain('skill-pill');
    expect(result).toContain('React');
    expect(result).toContain('TypeScript');
  });

  it('should preserve icon links', () => {
    // The [icon:name label](url) pattern should be preserved
    const content = '[icon:github GitHub](https://github.com)';
    const result = parseResumeMarkdown(content);
    // Should contain github.com and SVG icon (inline-icon-badge is used)
    expect(result).toContain('github.com');
    expect(result).toContain('svg');
  });

  it('should handle two-column layouts safely', () => {
    const content = `
::: left
Left column
:::

::: right
Right column
:::
`;
    const result = parseResumeMarkdown(content);
    expect(result).toContain('resume-col');
    expect(result).toContain('resume-col-left');
    expect(result).toContain('resume-col-right');
  });

  it('should strip unsafe attributes from divs', () => {
    const unsafe = '<div class="resume-col" onclick="alert(1)">Content</div>';
    const result = parseResumeMarkdown(unsafe);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('resume-col');
  });

  it('should preserve SVG icons for skill pills and contact links', () => {
    const content = `[icon:github GitHub](https://github.com/user)`;
    const result = parseResumeMarkdown(content);
    // SVG should be preserved inline
    expect(result).toContain('svg');
    expect(result).toContain('github.com/user');
  });
});

describe('parseResumeMarkdown - Content Preservation', () => {
  it('should preserve sections', () => {
    const markdown = `# John Doe
## Experience
- Worked at Company
## Education
- BS in CS`;
    const result = parseResumeMarkdown(markdown);
    expect(result).toContain('Experience');
    expect(result).toContain('Education');
    expect(result).toContain('Company');
  });

  it('should handle page breaks', () => {
    const markdown = `Content before

::: page-break :::

Content after`;
    const result = parseResumeMarkdown(markdown);
    expect(result).toContain('manual-page-break');
  });

  it('should preserve bold and italic formatting', () => {
    const markdown = '**Bold** and *italic* text';
    const result = parseResumeMarkdown(markdown);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('should preserve bullet lists', () => {
    const markdown = `## Skills
- React
- TypeScript
- Node.js`;
    const result = parseResumeMarkdown(markdown);
    expect(result).toContain('<li>');
    expect(result).toContain('React');
  });

  it('should handle empty input gracefully', () => {
    expect(parseResumeMarkdown('')).toBe('');
    expect(parseResumeMarkdown(null as any)).toBe('');
  });
});
