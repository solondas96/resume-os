/**
 * Findings: explainable notes about individual bullets, shown inline in the form editor.
 * Pure rules over the model. Each finding says what was noticed and why it matters.
 * Findings never change text; they point at a bullet.
 */

import { Resume, allBullets } from '../model/resume';
import { hasMetric } from './healthScore';

export type Severity = 'info' | 'suggestion' | 'warning';

export interface Finding {
  id: string;
  rule: string;
  severity: Severity;
  category: 'impact' | 'clarity' | 'consistency';
  target: { sectionId: string; bulletId: string };
  message: string;
  why: string;
}

const WEAK_PHRASES = ['worked on', 'helped with', 'responsible for', 'involved in', 'assisted with'];
const ACTION_VERBS = new Set([
  'achieved', 'architected', 'automated', 'built', 'collaborated', 'created', 'designed', 'developed',
  'drove', 'engineered', 'established', 'expanded', 'generated', 'improved', 'increased', 'launched',
  'led', 'managed', 'mentored', 'optimized', 'orchestrated', 'owned', 'partnered', 'reduced', 'scaled',
  'shipped', 'spearheaded', 'transformed', 'implemented', 'delivered', 'coordinated', 'analyzed',
  'cut', 'grew', 'saved', 'migrated', 'resolved', 'maintained', 'hired', 'taught', 'wrote', 'presented',
]);
const VAGUE = /\b(various|many|several|some|a lot of|numerous)\b/i;
const FIRST_PERSON = /\b(I|my|me|we|our)\b/;
const MAX_WORDS = 30;

interface Rule {
  rule: string;
  severity: Severity;
  category: Finding['category'];
  test: (text: string) => boolean;
  message: string;
  why: string;
}

export const BULLET_RULES: Rule[] = [
  {
    rule: 'bullet.no-metric',
    severity: 'suggestion',
    category: 'impact',
    test: (t) => !hasMetric(t),
    message: 'This bullet could show impact. What changed, and by how much?',
    why: 'Numbers such as a percentage, a count or a time make results easier to judge at a glance.',
  },
  {
    rule: 'bullet.weak-phrase',
    severity: 'suggestion',
    category: 'impact',
    test: (t) => WEAK_PHRASES.some((p) => t.toLowerCase().includes(p)),
    message: 'A passive phrase is hiding what you did.',
    why: 'Phrases such as "worked on" or "responsible for" describe a role rather than an outcome.',
  },
  {
    rule: 'bullet.no-action-verb',
    severity: 'info',
    category: 'impact',
    test: (t) => {
      const first = t.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '';
      return first.length > 0 && !ACTION_VERBS.has(first);
    },
    message: 'Start with a strong action verb, if one fits.',
    why: 'Leading with a verb such as "Built" or "Led" makes the action clear in a fast scan.',
  },
  {
    rule: 'bullet.vague-quantifier',
    severity: 'info',
    category: 'clarity',
    test: (t) => VAGUE.test(t),
    message: 'A vague word such as "various" or "many" could be a number.',
    why: 'Exact counts are more credible than general quantities.',
  },
  {
    rule: 'bullet.too-long',
    severity: 'warning',
    category: 'clarity',
    test: (t) => t.trim().split(/\s+/).length > MAX_WORDS,
    message: `This bullet is longer than ${MAX_WORDS} words.`,
    why: 'Long bullets are hard to scan. Splitting one into two short points usually reads better.',
  },
  {
    rule: 'bullet.first-person',
    severity: 'info',
    category: 'consistency',
    test: (t) => FIRST_PERSON.test(t),
    message: 'Resume bullets usually leave out pronouns.',
    why: 'Starting with the action keeps the style consistent across the resume.',
  },
];

/** Findings for every bullet in the resume */
export function bulletFindings(resume: Resume): Finding[] {
  const out: Finding[] = [];
  for (const { sectionId, bullet } of allBullets(resume)) {
    for (const r of BULLET_RULES) {
      if (r.test(bullet.text)) {
        out.push({
          id: `${r.rule}:${bullet.id}`,
          rule: r.rule,
          severity: r.severity,
          category: r.category,
          target: { sectionId, bulletId: bullet.id },
          message: r.message,
          why: r.why,
        });
      }
    }
  }
  return out;
}

/** All findings for each bullet, most serious first (the first one sets the dot's colour) */
export function findingsByBullet(findings: Finding[]): Map<string, Finding[]> {
  const rank: Record<Severity, number> = { warning: 3, suggestion: 2, info: 1 };
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    map.set(f.target.bulletId, [...(map.get(f.target.bulletId) ?? []), f]);
  }
  for (const list of map.values()) list.sort((a, b) => rank[b.severity] - rank[a.severity]);
  return map;
}
