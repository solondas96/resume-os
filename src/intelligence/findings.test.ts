import { describe, it, expect } from 'vitest';
import { BULLET_RULES, bulletFindings, findingsByBullet } from './findings';
import { markdownToResume } from '../model/serialize';

const rule = (name: string) => BULLET_RULES.find((r) => r.rule === name)!;

describe('bullet rules: each has a positive and a negative case', () => {
  it('bullet.no-metric: fires without a number, not with one', () => {
    expect(rule('bullet.no-metric').test('Built the reporting tool')).toBe(true);
    expect(rule('bullet.no-metric').test('Cut build time by 40%')).toBe(false);
  });

  it('bullet.weak-phrase: fires on "worked on", not on a strong verb', () => {
    expect(rule('bullet.weak-phrase').test('Worked on the billing system')).toBe(true);
    expect(rule('bullet.weak-phrase').test('Led the billing system')).toBe(false);
  });

  it('bullet.no-action-verb: fires when the first word is not a verb from the list', () => {
    expect(rule('bullet.no-action-verb').test('Responsible for the API')).toBe(true);
    expect(rule('bullet.no-action-verb').test('Built the API')).toBe(false);
  });

  it('bullet.vague-quantifier: fires on "various", not on a count', () => {
    expect(rule('bullet.vague-quantifier').test('Ran various experiments')).toBe(true);
    expect(rule('bullet.vague-quantifier').test('Ran 12 experiments')).toBe(false);
  });

  it('bullet.too-long: fires over 30 words, not at 30', () => {
    const words = (n: number) => Array(n).fill('word').join(' ');
    expect(rule('bullet.too-long').test(words(31))).toBe(true);
    expect(rule('bullet.too-long').test(words(30))).toBe(false);
  });

  it('bullet.first-person: fires on "I", not on the action', () => {
    expect(rule('bullet.first-person').test('I built the API')).toBe(true);
    expect(rule('bullet.first-person').test('Built the API')).toBe(false);
  });
});

describe('bulletFindings', () => {
  const resume = markdownToResume(
    '# A\n\n## Experience\n### Acme — Engineer\n- Worked on the billing system\n- Cut latency by 30%\n',
    'A'
  );

  it('points each finding at the bullet and its section', () => {
    const findings = bulletFindings(resume);
    const weak = findings.find((f) => f.rule === 'bullet.weak-phrase')!;
    expect(weak.target.sectionId).toBe(resume.sections[0].id);
    expect(weak.why.length).toBeGreaterThan(0);
  });

  it('a good bullet gets no metric or passive-phrase finding', () => {
    const good = bulletFindings(resume).filter((f) => f.target.bulletId && f.rule.startsWith('bullet.'));
    const cut = resume.sections[0] as any;
    const goodId = cut.items[0].bullets[1].id;
    expect(good.some((f) => f.target.bulletId === goodId && f.rule === 'bullet.no-metric')).toBe(false);
  });

  it('groups findings by bullet, most serious first', () => {
    const grouped = findingsByBullet(bulletFindings(resume));
    const weakBullet = (resume.sections[0] as any).items[0].bullets[0].id;
    const list = grouped.get(weakBullet)!;
    expect(list.length).toBeGreaterThan(1);
    expect(list[0].severity).toBe('suggestion');
  });
});
