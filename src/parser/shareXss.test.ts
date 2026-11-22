import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';
import { parseResumeMarkdown } from './markdown';
import { encodeResumeForShare, decodeSharedResume } from '../utils/shareResume';

describe('#view= share link XSS', () => {
  it('neutralises an <img onerror> payload delivered through a share link', () => {
    const payload = '# Jane\n\n<img src="x" onerror="alert(document.cookie)">\n\n<a href="javascript:alert(2)">x</a>';
    const code = encodeResumeForShare({
      title: 'Jane',
      markdown: payload,
      theme: 'modern',
      accentColor: '#c96442',
      fontSize: 'medium',
      marginSize: 'normal',
      lineHeight: 'normal',
    });

    // Mirror the App's #view= code path
    const decoded = decodeSharedResume(code);
    expect(decoded).not.toBeNull();
    const html = parseResumeMarkdown(decoded!.markdown);

    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('Jane');
  });

  it('uses the bundled DOMPurify (no no-op fallback)', () => {
    expect(typeof DOMPurify.sanitize).toBe('function');
    const out = DOMPurify.sanitize('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('onerror');
  });
});
