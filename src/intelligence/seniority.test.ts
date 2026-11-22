import { describe, it, expect } from 'vitest';
import { assessSeniority } from './seniority';
import { markdownToResume } from '../model/serialize';

const resumeWith = (bullets: string[]) =>
  markdownToResume(`# Jane\n\n## Experience\n### Acme — Engineer\n${bullets.map((b) => `- ${b}`).join('\n')}\n`, 'Jane');

describe('seniority check', () => {
  it('positive: scope, ownership and leadership signals raise the level', () => {
    const r = resumeWith([
      'Led a cross-functional team of 6 engineers',
      'Owned the billing platform roadmap across 4 teams',
      'Mentored 3 engineers to promotion',
      'Designed the company-wide data contract',
      'Architected the org-wide deployment pipeline',
      'Drove adoption across the department',
      'Hired and coached the team',
      'Launched the regional payments rollout',
      'Defined the platform strategy for the industry',
    ]);
    const s = assessSeniority(r);
    expect(['senior', 'staff', 'principal']).toContain(s.level);
    expect(s.signals.leadership).toBeGreaterThan(0);
  });

  it('negative: a resume with no scope or ownership words reads as entry level', () => {
    const s = assessSeniority(resumeWith(['Helped with reports', 'Attended meetings']));
    expect(s.level).toBe('entry');
    expect(s.label).toBe('Entry');
  });

  it('reports the specific missing signal types for a target level', () => {
    const s = assessSeniority(resumeWith(['Wrote unit tests for the parser']), 'staff');
    expect(s.target).toBe('staff');
    const signals = s.missing.map((m) => m.signal);
    expect(signals).toContain('scope');
    expect(signals).toContain('leadership');
    expect(s.missing.find((m) => m.signal === 'scope')!.example.length).toBeGreaterThan(0);
  });

  it('positive: a target already met reports nothing missing', () => {
    const s = assessSeniority(resumeWith([
      'Led 2 teams across the company',
      'Owned the platform roadmap',
      'Owned the payments design',
      'Mentored 2 engineers',
      'Coordinated work across 3 teams',
    ]), 'senior');
    expect(s.missing).toEqual([]);
  });
});
