/**
 * Resume health score calculator
 * 0-100 score with 5 categories: impact, clarity, ATS, consistency, length
 */

import { Resume } from '../model/resume';

export interface CategoryScore {
  name: string;
  score: number; // 0-100
  issues: string[];
  fixes: string[];
}

export interface HealthScoreResult {
  overallScore: number;
  categories: CategoryScore[];
  topIssues: string[]; // Top 5 issues to fix
}

/**
 * Calculate impact score (metrics, action verbs, weak phrases)
 */
function scoreImpact(resume: Resume): CategoryScore {
  const issues: string[] = [];
  const fixes: string[] = [];
  let bulletCount = 0;
  let bulletsWithMetrics = 0;
  let bulletsWithActionVerbs = 0;

  const actionVerbs = new Set([
    'achieved', 'architected', 'automated', 'built', 'collaborated', 'created',
    'designed', 'developed', 'engineered', 'established', 'expanded', 'generated',
    'improved', 'increased', 'led', 'managed', 'optimized', 'orchestrated',
    'partnered', 'scaled', 'spearheaded', 'transformed', 'pioneered',
  ]);

  const weakPhrases = ['worked on', 'helped with', 'responsible for', 'involved in'];
  // A quantified bullet: a percentage, money, a multiplier, or a number that is not a year
  const metricPattern = /(\d+(?:\.\d+)?\s?%|[$€£¥]\s?\d|\b\d+(?:\.\d+)?\s?(?:x|k|m|ms|s|h|hrs?|hours?|days?|weeks?|months?|years?|users?|customers?|requests?|engineers?|people|teams?|%)\b|(?<!\d)(?!(?:19|20)\d{2}\b)\d{2,}\b|\bSLA\b|uptime)/i;

  // Scan all bullets
  resume.sections.forEach((section) => {
    if (!!section.items?.length && 'bullets' in section.items[0]) {
      section.items.forEach((item: any) => {
        item.bullets?.forEach((bullet: any) => {
          bulletCount++;
          const text = bullet.text.toLowerCase();

          // Check for metric
          if (metricPattern.test(bullet.text)) {
            bulletsWithMetrics++;
          }

          // Check for action verb
          const firstWord = text.split(/\s+/)[0];
          if (actionVerbs.has(firstWord.replace(/[^a-z]/g, ''))) {
            bulletsWithActionVerbs++;
          }

          // Check for weak phrases
          weakPhrases.forEach((phrase) => {
            if (text.includes(phrase)) {
              issues.push(`Weak phrasing: "${phrase}" (bullet: ${bullet.text.substring(0, 50)}...)`);
            }
          });

          // Check for missing metric
          if (bulletCount < 15 && bulletsWithMetrics < bulletCount * 0.5) {
            if (!metricPattern.test(bullet.text)) {
              issues.push(`Missing metric: "${bullet.text.substring(0, 50)}..."`);
            }
          }
        });
      });
    }
  });

  let score = 100;

  // Deduct for missing metrics
  if (bulletCount > 0) {
    const metricRatio = bulletsWithMetrics / bulletCount;
    if (metricRatio < 0.5) {
      score -= (0.5 - metricRatio) * 40; // Up to -20 points
    }
  }

  // Deduct for weak action verbs
  if (bulletCount > 0) {
    const verbRatio = bulletsWithActionVerbs / bulletCount;
    if (verbRatio < 0.7) {
      score -= (0.7 - verbRatio) * 20; // Up to -14 points
    }
  }

  // Deduct for weak phrases
  score -= Math.min(issues.length * 2, 20);

  fixes.push('Add quantifiable metrics to 50%+ of bullets');
  fixes.push('Start bullets with strong action verbs');
  fixes.push('Replace vague phrases like "worked on" with specific verbs');

  return {
    name: 'Impact',
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues: issues.slice(0, 5),
    fixes,
  };
}

/**
 * Calculate clarity score (word count, jargon, formatting)
 */
function scoreClarity(resume: Resume): CategoryScore {
  const issues: string[] = [];
  const fixes: string[] = [];
  let totalWords = 0;
  let longBullets = 0;
  let bulletCount = 0;

  resume.sections.forEach((section) => {
    if (!!section.items?.length && 'bullets' in section.items[0]) {
      section.items.forEach((item: any) => {
        item.bullets?.forEach((bullet: any) => {
          bulletCount++;
          const words = bullet.text.split(/\s+/).length;
          totalWords += words;

          if (words > 30) {
            longBullets++;
            issues.push(`Long bullet (${words} words): "${bullet.text.substring(0, 50)}..."`);
          }
        });
      });
    }
  });

  let score = 100;

  // Deduct for long bullets
  if (bulletCount > 0) {
    const longRatio = longBullets / bulletCount;
    score -= longRatio * 30; // Up to -30 points
  }

  // Deduct if average bullet is too long
  if (bulletCount > 0) {
    const avgWords = totalWords / bulletCount;
    if (avgWords > 20) {
      score -= Math.min((avgWords - 20) / 2, 10); // Up to -10 points
    }
  }

  fixes.push('Keep bullets under 30 words');
  fixes.push('Break long bullets into 2-3 shorter ones');
  fixes.push('Remove unnecessary jargon');

  return {
    name: 'Clarity',
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues: issues.slice(0, 5),
    fixes,
  };
}

/**
 * Calculate ATS score (formatting, contact info, structure)
 */
function scoreATS(resume: Resume): CategoryScore {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 100;

  // Check contact info
  if (!resume.basics.email) {
    issues.push('Missing email address');
    score -= 10;
  }
  if (!resume.basics.phone) {
    issues.push('Missing phone number');
    score -= 5;
  }

  // Check for standard section names
  const standardSections = ['experience', 'education', 'skills'];
  const foundSections = resume.sections.map((s) => s.kind);

  standardSections.forEach((section) => {
    if (!foundSections.includes(section as any)) {
      issues.push(`Missing standard section: ${section}`);
      score -= 5;
    }
  });

  // Check for unusual characters
  const hasUnicodeIssues = /[^\x00-\x7F]/.test(JSON.stringify(resume.basics));
  if (hasUnicodeIssues) {
    issues.push('Contains non-ASCII characters (may cause ATS issues)');
    score -= 5;
  }

  fixes.push('Include both email and phone');
  fixes.push('Use standard section names (Experience, Education, Skills)');
  fixes.push('Stick to ASCII characters for maximum ATS compatibility');

  return {
    name: 'ATS Readiness',
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues: issues.slice(0, 5),
    fixes,
  };
}

/**
 * Calculate consistency score (tense, punctuation, formatting)
 */
function scoreConsistency(resume: Resume): CategoryScore {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 100;

  const verbs: string[] = [];
  let endsWithPeriod = 0;
  let bulletCount = 0;

  resume.sections.forEach((section) => {
    if (!!section.items?.length && 'bullets' in section.items[0]) {
      section.items.forEach((item: any) => {
        item.bullets?.forEach((bullet: any) => {
          bulletCount++;
          const text = bullet.text;
          const firstWord = text.split(/\s+/)[0].toLowerCase();
          verbs.push(firstWord);

          if (text.endsWith('.')) {
            endsWithPeriod++;
          }
        });
      });
    }
  });

  // Check punctuation consistency
  if (bulletCount > 0) {
    const periodRatio = endsWithPeriod / bulletCount;
    if (periodRatio > 0.1 && periodRatio < 0.9) {
      issues.push('Inconsistent punctuation (some bullets end with period, some don\'t)');
      score -= 15;
    }
  }

  // Check tense consistency (simple heuristic)
  const pastTenseEndings = ['ed', 'led', 'ned'];
  let pastCount = 0;
  verbs.forEach((verb) => {
    if (pastTenseEndings.some((end) => verb.endsWith(end))) {
      pastCount++;
    }
  });

  if (verbs.length > 0) {
    const pastRatio = pastCount / verbs.length;
    if (pastRatio > 0.1 && pastRatio < 0.9) {
      issues.push('Inconsistent tense usage');
      score -= 10;
    }
  }

  fixes.push('Use consistent punctuation (all bullets end with period or none do)');
  fixes.push('Use consistent tense (past tense for previous roles, present for current)');

  return {
    name: 'Consistency',
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues: issues.slice(0, 5),
    fixes,
  };
}

/**
 * Calculate length score (page count, detail level)
 */
function scoreLength(resume: Resume): CategoryScore {
  const issues: string[] = [];
  const fixes: string[] = [];
  let score = 100;

  // Count content
  let bulletCount = 0;

  resume.sections.forEach((section) => {
    if (!!section.items?.length && 'bullets' in section.items[0]) {
      section.items.forEach((item: any) => {
        bulletCount += item.bullets?.length || 0;
      });
    }
  });

  // Rough heuristic: aim for 15-25 bullets for 5-10 years experience
  if (bulletCount < 10) {
    issues.push('Resume seems sparse. Consider adding more accomplishments.');
    score -= 10;
  } else if (bulletCount > 40) {
    issues.push('Resume is very detailed. Consider consolidating or removing less recent roles.');
    score -= 10;
  }

  fixes.push('Aim for 15-25 bullets total');
  fixes.push('Focus on recent and relevant roles');
  fixes.push('Remove or minimize roles older than 10 years');

  return {
    name: 'Length',
    score: Math.max(0, Math.min(100, Math.round(score))),
    issues: issues.slice(0, 5),
    fixes,
  };
}

/**
 * Calculate overall health score
 */
export function calculateHealthScore(resume: Resume): HealthScoreResult {
  const categories = [
    scoreImpact(resume),
    scoreClarity(resume),
    scoreATS(resume),
    scoreConsistency(resume),
    scoreLength(resume),
  ];

  const overallScore = Math.round(
    categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
  );

  // Collect top issues
  const allIssues = categories.flatMap((cat) => cat.issues);
  const topIssues = [...new Set(allIssues)].slice(0, 5);

  return {
    overallScore,
    categories,
    topIssues,
  };
}
