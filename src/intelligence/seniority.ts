/**
 * Seniority check: does the resume read at the level it targets?
 * Counts scope, ownership and leadership signals in bullets against a lexicon.
 */

import { Resume } from '../model/resume';

export type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'staff' | 'principal';

const LEXICON = {
  scope: [
    'team', 'teams', 'cross-functional', 'multi-team', 'department', 'organization', 'org-wide',
    'company-wide', 'company', 'industry', 'global', 'region', 'regional', 'platform', 'roadmap',
  ],
  ownership: ['owned', 'owner', 'ownership', 'architected', 'designed', 'defined', 'launched', 'founded', 'drove', 'set the strategy'],
  leadership: ['led', 'mentored', 'managed', 'hired', 'coached', 'interviewed', 'grew the team', 'built a team', 'sponsored'],
} as const;

export type SignalType = keyof typeof LEXICON;

export interface SeniorityResult {
  level: SeniorityLevel;
  label: string;
  signals: Record<SignalType, number>;
  target?: SeniorityLevel;
  missing: { signal: SignalType; need: number; have: number; example: string }[];
}

const LABEL: Record<SeniorityLevel, string> = {
  entry: 'Entry',
  mid: 'Mid-level',
  senior: 'Senior',
  staff: 'Staff / Lead',
  principal: 'Principal / Director',
};

const ORDER: SeniorityLevel[] = ['entry', 'mid', 'senior', 'staff', 'principal'];

/** Minimum count of each signal type that a level is expected to show */
const EXPECTED: Record<SeniorityLevel, Partial<Record<SignalType, number>>> = {
  entry: {},
  mid: { ownership: 1 },
  senior: { ownership: 2, leadership: 1 },
  staff: { scope: 2, ownership: 2, leadership: 1 },
  principal: { scope: 3, ownership: 3, leadership: 2 },
};

const EXAMPLES: Record<SignalType, string> = {
  scope: 'Coordinated delivery across 3 teams, so each one shipped on the same schedule',
  ownership: 'Owned the design and rollout of the billing service from proposal to launch',
  leadership: 'Mentored 2 engineers to their first promotion',
};

function countSignals(resume: Resume): Record<SignalType, number> {
  const signals: Record<SignalType, number> = { scope: 0, ownership: 0, leadership: 0 };
  for (const s of resume.sections) {
    for (const item of (s.items ?? []) as { bullets?: { text: string }[] }[]) {
      for (const b of item.bullets ?? []) {
        const lower = b.text.toLowerCase();
        for (const type of Object.keys(LEXICON) as SignalType[]) {
          if (LEXICON[type].some((term) => new RegExp(`(?<![a-z])${term.replace(/[-]/g, '\\-')}(?![a-z])`).test(lower))) {
            signals[type] += 1;
          }
        }
      }
    }
  }
  return signals;
}

export function assessSeniority(resume: Resume, target?: SeniorityLevel): SeniorityResult {
  const signals = countSignals(resume);
  const total = signals.scope + signals.ownership + signals.leadership;

  // Level from total signal count, with scope weighted up for the top levels
  let level: SeniorityLevel = 'entry';
  if (total >= 14 && signals.scope >= 3) level = 'principal';
  else if (total >= 9 && signals.scope >= 2) level = 'staff';
  else if (total >= 5) level = 'senior';
  else if (total >= 2) level = 'mid';

  const missing: SeniorityResult['missing'] = [];
  if (target) {
    for (const [type, need] of Object.entries(EXPECTED[target]) as [SignalType, number][]) {
      if (signals[type] < need) {
        missing.push({
          signal: type,
          need,
          have: signals[type],
          example: EXAMPLES[type],
        });
      }
    }
  }

  return { level, label: LABEL[level], signals, target, missing };
}

export function levelLabel(level: SeniorityLevel): string {
  return LABEL[level];
}

export function isAtOrAbove(level: SeniorityLevel, target: SeniorityLevel): boolean {
  return ORDER.indexOf(level) >= ORDER.indexOf(target);
}
