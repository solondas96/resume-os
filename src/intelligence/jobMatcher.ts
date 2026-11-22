/**
 * Job description matcher
 * Requirement extraction, keyword matching, evidence linking
 */

import { Resume, sectionItems } from '../model/resume';
import { extractSkills, stemWord } from './skills';
import { hasMetric } from './healthScore';

export interface ParsedRequirement {
  text: string;
  type: 'must-have' | 'nice-to-have';
  skills: string[];
  evidence?: { sectionId: string; bulletText: string };
  strength: 'strong' | 'moderate' | 'weak' | 'missing';
}

export interface JobMatchResult {
  score: number; // 0-100
  requirements: ParsedRequirement[];
  matchedCount: number;
  missingCount: number;
  skills: { found: string[]; missing: string[] };
}

/**
 * Extract requirements from job description
 */
function extractRequirements(jobDescription: string): ParsedRequirement[] {
  const requirements: ParsedRequirement[] = [];
  const lines = jobDescription.split('\n');

  let currentType: 'must-have' | 'nice-to-have' = 'must-have';

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Detect section type
    if (lower.includes('nice to have') || lower.includes('preferred')) {
      currentType = 'nice-to-have';
      continue;
    }
    if (lower.includes('required') || lower.includes('must have')) {
      currentType = 'must-have';
      continue;
    }

    // Extract requirements (lines starting with -, •, *, or numbers)
    if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-•*\d.]\s+/, '').trim();

      if (text.length > 10) {
        requirements.push({
          text,
          type: currentType,
          skills: extractSkillsFromText(text),
          strength: 'missing',
        });
      }
    }
  }

  return requirements;
}

/**
 * Extract skills from text using the dictionary (canonical names and synonyms).
 * Falls back to stemmed significant words so unknown terms still match.
 */
const STOPWORDS = new Set([
  'the', 'and', 'with', 'for', 'experience', 'years', 'year', 'strong', 'good', 'ability', 'knowledge',
  'work', 'working', 'role', 'team', 'skills', 'skill', 'in', 'of', 'a', 'an', 'to', 'or', 'on', 'at',
  'using', 'proficiency', 'expertise', 'familiarity', 'understanding', 'must', 'nice', 'have', 'required',
  'preferred', 'bonus', 'plus', 'etc', 'including', 'such', 'as', 'be', 'is', 'are', 'you', 'we', 'our',
]);

function extractSkillsFromText(text: string): string[] {
  const dictionary = extractSkills(text);
  if (dictionary.length > 0) return dictionary;
  return [...new Set(
    text
      .split(/[^A-Za-z0-9+#.]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w.toLowerCase()))
      .map((w) => stemWord(w))
      .filter((w) => w.length > 3)
  )];
}

/**
 * Find evidence of a requirement in the resume.
 * strong: an experience bullet that covers the requirement and has a metric
 * moderate: an experience bullet that covers it, without a metric
 * weak: only the skills list covers it
 * missing: nothing covers it
 */
function findEvidence(requirement: ParsedRequirement, resume: Resume): ParsedRequirement {
  if (requirement.skills.length === 0) return requirement;
  const wanted = new Set(requirement.skills);
  let best: { strength: 'strong' | 'moderate'; bulletText: string; sectionId: string } | null = null;

  for (const section of resume.sections) {
    for (const item of sectionItems(section) as { bullets?: { text: string }[] }[]) {
      for (const bullet of item.bullets ?? []) {
        const overlap = extractSkillsFromText(bullet.text).filter((s) => wanted.has(s)).length;
        if (overlap === 0) continue;
        const strength = hasMetric(bullet.text) ? 'strong' : 'moderate';
        if (!best || (strength === 'strong' && best.strength === 'moderate')) {
          best = { strength, bulletText: bullet.text, sectionId: section.id };
        }
      }
    }
  }

  if (best) {
    requirement.strength = best.strength;
    requirement.evidence = { sectionId: best.sectionId, bulletText: best.bulletText };
    return requirement;
  }

  for (const section of resume.sections) {
    if (section.kind !== 'skills') continue;
    const listed = extractSkillsFromText((section.groups ?? []).flatMap((g) => g.skills).join(', '));
    if (listed.some((s) => wanted.has(s))) {
      requirement.strength = 'weak';
      return requirement;
    }
  }

  return requirement;
}

/**
 * Calculate match score
 */export function matchJobDescription(jobDescription: string, resume: Resume): JobMatchResult {
  const requirements = extractRequirements(jobDescription);

  // Find evidence for each requirement
  const matchedRequirements = requirements.map((req) => findEvidence(req, resume));

  // Calculate score
  let matchedCount = 0;
  let mustHaveMatches = 0;
  let mustHaveTotal = 0;

  matchedRequirements.forEach((req) => {
    if (req.strength !== 'missing') {
      matchedCount++;
    }

    if (req.type === 'must-have') {
      mustHaveTotal++;
      if (req.strength !== 'missing') {
        mustHaveMatches++;
      }
    }
  });

  // No requirements found (e.g. a posting with no bullet points): nothing to match
  if (requirements.length === 0) {
    return { score: 0, requirements: [], matchedCount: 0, missingCount: 0, skills: { found: [], missing: [] } };
  }

  // Must-haves are 70% of the score, nice-to-haves 30%.
  // With no nice-to-haves listed, must-haves carry the whole score.
  const niceTotal = requirements.length - mustHaveTotal;
  const niceMatches = matchedRequirements.filter((r) => r.type === 'nice-to-have' && r.strength !== 'missing').length;
  const mustHaveScore = mustHaveTotal > 0 ? (mustHaveMatches / mustHaveTotal) * 100 : 0;
  const niceToHaveScore = niceTotal > 0 ? (niceMatches / niceTotal) * 100 : null;
  const score = Math.round(
    niceToHaveScore === null ? mustHaveScore : mustHaveScore * 0.7 + niceToHaveScore * 0.3
  );

  // Extract all skills
  const foundSkills: Set<string> = new Set();
  const missingSkills: Set<string> = new Set();

  matchedRequirements.forEach((req) => {
    if (req.strength !== 'missing') {
      req.skills.forEach((skill) => foundSkills.add(skill));
    } else {
      req.skills.forEach((skill) => missingSkills.add(skill));
    }
  });

  return {
    score: Math.min(100, Math.max(0, score)),
    requirements: matchedRequirements,
    matchedCount,
    missingCount: requirements.length - matchedCount,
    skills: {
      found: Array.from(foundSkills),
      missing: Array.from(missingSkills),
    },
  };
}
