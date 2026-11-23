/**
 * "Send feedback" from Help: a GitHub issue form, prefilled with the app version, the browser, the page
 * size and the template. It never includes resume content: the function takes only these four values.
 * Nothing is sent by the app; the link opens in a new tab only when the user clicks it.
 */

export const FEEDBACK_REPO = 'https://github.com/solondas96/resume-os';

export interface FeedbackContext {
  version: string;
  userAgent: string;
  pageSize: string;
  template: string;
}

export function feedbackUrl(ctx: FeedbackContext): string {
  const title = `Feedback on ResumeLabs ${ctx.version}`;
  const body = [
    'What happened, or what would help?',
    '',
    '(Please do not paste your resume here. If you need to show a problem with your text, describe it in words.)',
    '',
    '---',
    `ResumeLabs: ${ctx.version}`,
    `Browser: ${ctx.userAgent}`,
    `Page size: ${ctx.pageSize}`,
    `Template: ${ctx.template}`,
  ].join('\n');
  return `${FEEDBACK_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
