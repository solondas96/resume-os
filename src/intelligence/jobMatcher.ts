/**
 * Job description matcher
 * Requirement extraction, keyword matching, evidence linking
 */

import { Resume } from '../model/resume';

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
 * Extract skills/keywords from text
 */
function extractSkillsFromText(text: string): string[] {
  const skills: string[] = [];

  // Common skill patterns
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience\s+)?(?:in\s+)?(\w+)/gi,
    /(?:experience|proficiency|expertise)\s+(?:with|in)\s+([^,\.]+)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // Capitalized phrases
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const skill = match[1] || match[2];
      if (skill && skill.length > 2 && skill.length < 50) {
        skills.push(skill.trim());
      }
    }
  });

  return [...new Set(skills)]; // Deduplicate
}

/**
 * Find evidence of a requirement in resume
 */
function findEvidence(requirement: ParsedRequirement, resume: Resume): ParsedRequirement {
  // Simple keyword matching
  for (const section of resume.sections) {
    if (!!section.items?.length && 'bullets' in section.items[0]) {
      for (const item of section.items as any) {
        for (const bullet of item.bullets || []) {
          const bulletLower = bullet.text.toLowerCase();

          // Check if any requirement keywords appear in bullet
          let matchCount = 0;
          for (const skill of requirement.skills) {
            if (bulletLower.includes(skill.toLowerCase())) {
              matchCount++;
            }
          }

          if (matchCount >= 2) {
            requirement.evidence = {
              sectionId: section.id,
              bulletText: bullet.text,
            };
            requirement.strength = 'strong';
            return requirement;
          } else if (matchCount === 1) {
            requirement.strength = 'moderate';
          }
        }
      }
    }
  }

  // Check skills section
  for (const section of resume.sections) {
    if (section.kind === 'skills' && section.groups) {
      for (const group of section.groups) {
        for (const skill of group.skills) {
          if (skill.toLowerCase().includes(requirement.skills[0]?.toLowerCase() || '')) {
            requirement.strength = 'weak';
            break;
          }
        }
      }
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
