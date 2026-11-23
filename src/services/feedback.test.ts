import { describe, it, expect } from 'vitest';
import { feedbackUrl, FEEDBACK_REPO } from './feedback';

const ctx = { version: '2.1.0', userAgent: 'Test Browser 1.0', pageSize: 'A4', template: 'modern' };

describe('feedbackUrl: a prefilled issue, without resume content', () => {
  const url = new URL(feedbackUrl(ctx));

  it('positive: opens a new GitHub issue in this repository, with the version, page size and template', () => {
    expect(url.origin + url.pathname).toBe(`${FEEDBACK_REPO}/issues/new`);
    const body = url.searchParams.get('body') ?? '';
    expect(body).toContain('ResumeLabs: 2.1.0');
    expect(body).toContain('Page size: A4');
    expect(body).toContain('Template: modern');
    expect(body).toContain('Browser: Test Browser 1.0');
    expect(url.searchParams.get('title')).toBe('Feedback on ResumeLabs 2.1.0');
  });

  it('negative: the body asks people not to paste a resume, and holds no resume text', () => {
    const body = url.searchParams.get('body') ?? '';
    expect(body).toContain('Please do not paste your resume here');
    expect(body).not.toMatch(/@|\+\d/);
  });

  it('the function takes only the four values; a missing template is shown as none', () => {
    const none = new URL(feedbackUrl({ ...ctx, template: 'none' }));
    expect(none.searchParams.get('body')).toContain('Template: none');
  });
});
