// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { encodeResumeForShare, parseShareHash, encodeShareV2, getShareableUrlV2 } from './shareResume';
import { redactContact, forOutput } from '../model/edit';
import { markdownToResume, resumeToMarkdown } from '../model/serialize';

const base = {
  title: 'Jane',
  theme: 'modern' as const,
  accentColor: '#c96442',
  fontSize: 'medium' as const,
  marginSize: 'normal' as const,
  lineHeight: 'normal' as const,
};
const MD = '# Jane Doe\njane@example.com · +1 (415) 555-0134\n\n## Experience\n### Acme — Engineer\n- Built things\n';

describe('share links v2', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('positive: a v2 link round-trips the resume', () => {
    const hash = `#v2=${encodeShareV2({ ...base, markdown: MD })}`;
    const back = parseShareHash(hash);
    expect(back?.markdown).toBe(MD);
    expect(back?.title).toBe('Jane');
  });

  it('positive: the v2 link is shorter than the v1 link for the same resume', () => {
    const v1 = encodeResumeForShare({ ...base, markdown: MD.repeat(4) });
    const v2 = encodeShareV2({ ...base, markdown: MD.repeat(4) });
    expect(v2.length).toBeLessThan(v1.length);
  });

  it('positive: an old #view= (v1) link still opens', () => {
    const code = encodeResumeForShare({ ...base, markdown: MD });
    expect(parseShareHash(`#view=${code}`)?.markdown).toBe(MD);
  });

  it('negative: garbage and unknown hashes give null, without throwing', () => {
    expect(parseShareHash('#v2=not-a-real-payload!!')).toBeNull();
    expect(parseShareHash('#v2=')).toBeNull();
    expect(parseShareHash('#view=%%%')).toBeNull();
    expect(parseShareHash('#something-else')).toBeNull();
    expect(parseShareHash('')).toBeNull();
  });

  it('the link is built from the page address and carries the v2 fragment', () => {
    const url = getShareableUrlV2({ ...base, markdown: MD });
    expect(url).toContain('#v2=');
    expect(url.startsWith(window.location.origin)).toBe(true);
  });
});

describe('hide phone and email', () => {
  it('positive: the redacted copy has no phone or email in its Markdown', () => {
    const r = markdownToResume(MD, 'Jane');
    const shared = resumeToMarkdown(redactContact(forOutput(r), { phone: true, email: true }));
    expect(shared).not.toContain('jane@example.com');
    expect(shared).not.toContain('555-0134');
    expect(shared).toContain('Built things');
  });

  it('negative: hiding one field leaves the other', () => {
    const r = markdownToResume(MD, 'Jane');
    const shared = resumeToMarkdown(redactContact(forOutput(r), { phone: true }));
    expect(shared).toContain('jane@example.com');
    expect(shared).not.toContain('555-0134');
  });

  it('the redaction does not change the original resume', () => {
    const r = markdownToResume(MD, 'Jane');
    redactContact(r, { email: true, phone: true });
    expect(r.basics.email).toBe('jane@example.com');
  });
});
