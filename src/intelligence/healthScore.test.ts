import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from './healthScore';
import { markdownToResume } from '../model/serialize';

/** Build a resume from markdown, using the same parser the app uses */
function resumeFrom(body: string, header = '# Jane Doe\njane@example.com\n+1 (415) 555-0182\n') {
  return markdownToResume(`${header}\n${body}`, 'Jane');
}

const bullets = (lines: string[]) =>
  `## Experience\n### Acme — Engineer\n${lines.map((l) => `- ${l}`).join('\n')}\n\n## Skills\n- TypeScript\n\n## Education\n### State U — BSc\n`;

function category(resume: ReturnType<typeof resumeFrom>, name: string) {
  const c = calculateHealthScore(resume).categories.find((x) => x.name === name);
  if (!c) throw new Error(`no category ${name}`);
  return c;
}

describe('health: Impact', () => {
  const strong = bullets([
    'Led a migration that cut build time by 40%',
    'Built a cache serving 2M requests per day',
    'Improved p99 latency by 30ms',
    'Automated release checks saving 10h per week',
  ]);

  it('positive: metrics and action verbs score high with no weak-phrase issues', () => {
    const c = category(resumeFrom(strong), 'Impact');
    expect(c.score).toBeGreaterThanOrEqual(90);
    expect(c.issues.some((i) => i.startsWith('Weak phrasing'))).toBe(false);
  });

  it('negative: weak phrases are flagged and lower the score', () => {
    const weak = bullets([
      'Worked on the billing system',
      'Helped with onboarding',
      'Responsible for the API',
      'Involved in planning',
    ]);
    const c = category(resumeFrom(weak), 'Impact');
    expect(c.issues.some((i) => i.startsWith('Weak phrasing'))).toBe(true);
    expect(c.score).toBeLessThan(category(resumeFrom(strong), 'Impact').score);
  });

  it('negative: a bullet without any metric is reported as missing one', () => {
    const c = category(resumeFrom(bullets(['Built the internal tooling for the team'])), 'Impact');
    expect(c.issues.some((i) => i.startsWith('Missing metric'))).toBe(true);
  });
});

describe('health: Clarity', () => {
  it('positive: short bullets raise no long-bullet issue', () => {
    const c = category(resumeFrom(bullets(['Shipped a payments refactor across 3 services'])), 'Clarity');
    expect(c.issues.some((i) => i.startsWith('Long bullet'))).toBe(false);
    expect(c.score).toBe(100);
  });

  it('negative: a bullet over 30 words is reported and lowers the score', () => {
    const long = Array(36).fill('word').join(' ');
    const c = category(resumeFrom(bullets([long])), 'Clarity');
    expect(c.issues.some((i) => i.startsWith('Long bullet'))).toBe(true);
    expect(c.score).toBeLessThan(100);
  });
});

describe('health: ATS readiness', () => {
  const fullBody = `## Experience\n### Acme — Engineer\n- Did a thing\n\n## Skills\n- TypeScript\n\n## Education\n### State U — BSc\n`;

  it('positive: email, phone and all standard sections give a full score', () => {
    const c = category(resumeFrom(fullBody), 'ATS Readiness');
    expect(c.score).toBe(100);
    expect(c.issues).toEqual([]);
  });

  it('negative: a missing email is reported and deducted', () => {
    const r = resumeFrom(fullBody, '# Jane Doe\n+1 (415) 555-0182\n');
    const c = category(r, 'ATS Readiness');
    expect(c.issues).toContain('Missing email address');
    expect(c.score).toBeLessThan(100);
  });

  it('negative: a missing standard section is reported', () => {
    const c = category(resumeFrom('## Skills\n- TypeScript\n'), 'ATS Readiness');
    expect(c.issues.some((i) => i.startsWith('Missing standard section'))).toBe(true);
  });

  it('negative: non-ASCII characters in the header are flagged', () => {
    const r = resumeFrom(fullBody, '# José Ruiz\njose@example.com\n+1 (415) 555-0182\n');
    expect(category(r, 'ATS Readiness').issues.some((i) => i.includes('non-ASCII'))).toBe(true);
  });
});

describe('health: Consistency', () => {
  it('positive: bullets that all end with a period raise no punctuation issue', () => {
    const c = category(resumeFrom(bullets(['Shipped one.', 'Led two.', 'Built three.', 'Ran four.'])), 'Consistency');
    expect(c.issues.some((i) => i.includes('punctuation'))).toBe(false);
  });

  it('negative: mixed punctuation is reported', () => {
    const c = category(resumeFrom(bullets(['Shipped one.', 'Led two', 'Built three.', 'Ran four', 'Owned five'])), 'Consistency');
    expect(c.issues.some((i) => i.includes('punctuation'))).toBe(true);
    expect(c.score).toBeLessThan(100);
  });
});

describe('health: Length', () => {
  const many = (n: number) => bullets(Array.from({ length: n }, (_, i) => `Did task ${i} with 10% gain`));

  it('positive: 10 to 40 bullets raise no length issue', () => {
    const c = category(resumeFrom(many(20)), 'Length');
    expect(c.issues).toEqual([]);
    expect(c.score).toBe(100);
  });

  it('negative: fewer than 10 bullets is reported as sparse', () => {
    const c = category(resumeFrom(many(3)), 'Length');
    expect(c.issues.some((i) => i.includes('sparse'))).toBe(true);
  });

  it('negative: more than 40 bullets is reported as too detailed', () => {
    const c = category(resumeFrom(many(45)), 'Length');
    expect(c.issues.some((i) => i.includes('very detailed'))).toBe(true);
  });
});

describe('health: overall', () => {
  it('is the average of the five categories and never throws on empty sections', () => {
    // Skills and education sections have no bullets: must not crash
    const r = resumeFrom('## Skills\n- TypeScript\n\n## Projects\n');
    const result = calculateHealthScore(r);
    expect(result.categories.length).toBe(5);
    const avg = Math.round(result.categories.reduce((n, c) => n + c.score, 0) / 5);
    expect(result.overallScore).toBe(avg);
  });
});
