import { BulletAnalysis, BulletLinterResult } from '../types';

export const STRONG_ACTION_VERBS = [
  'accelerated', 'achieved', 'administered', 'advocated', 'analyzed', 'architected',
  'automated', 'authored', 'built', 'centralized', 'championed', 'co-authored',
  'compiled', 'composed', 'consolidated', 'constructed', 'converted', 'coordinated',
  'created', 'decreased', 'delivered', 'deployed', 'designed', 'developed',
  'devised', 'diagnosed', 'directed', 'documented', 'doubled', 'drafted',
  'eliminated', 'engineered', 'enhanced', 'established', 'evaluated', 'executed',
  'expanded', 'expedited', 'formulated', 'founded', 'generated', 'governed',
  'guided', 'halved', 'headed', 'identified', 'implemented', 'improved',
  'increased', 'initiated', 'inspected', 'installed', 'instituted', 'integrated',
  'introduced', 'invented', 'investigated', 'launched', 'led', 'managed',
  'maximized', 'mentored', 'minimized', 'modernized', 'negotiated', 'operated',
  'optimized', 'orchestrated', 'organized', 'overhauled', 'oversaw', 'partnered',
  'pioneered', 'planned', 'produced', 'published', 're-architected', 're-engineered',
  'rebuilt', 'reduced', 'refined', 'refactored', 'remodeled', 'reorganized',
  'replaced', 'restructured', 'revamped', 'revitalized', 'saved', 'scaled',
  'simplified', 'spearheaded', 'standardized', 'steered', 'streamlined', 'strengthened',
  'surpassed', 'trained', 'transformed', 'tripled', 'unified', 'upgraded'
];

export const WEAK_PASSIVE_PHRASES: Record<string, string> = {
  'worked on': 'Engineered',
  'worked with': 'Collaborated with',
  'helped with': 'Spearheaded',
  'helped to': 'Assisted in optimizing',
  'responsible for': 'Owned and directed',
  'duties included': 'Executed',
  'participated in': 'Contributed to',
  'handled': 'Managed',
  'assisted with': 'Co-led',
  'assisted in': 'Partnered to deliver',
  'involved in': 'Drove',
  'tried to': 'Tested and deployed',
  'did': 'Executed',
  'made': 'Designed and shipped',
  'talked to': 'Conducted user research with',
};

const METRIC_REGEX = /(\b\d+(?:\.\d+)?(?:%|[xX]|k|K|M|B|\+)|\$\d+(?:\.\d+)?(?:[kKmMbB])?|\b\d{2,}\b)/g;

/**
 * Analyzes resume bullet points for action verbs, quantifiable metrics, and impact.
 */
export function analyzeBullets(markdown: string): BulletLinterResult {
  if (!markdown) {
    return {
      overallScore: 0,
      totalBullets: 0,
      strongBullets: 0,
      metricsBullets: 0,
      weakVerbBullets: 0,
      bullets: [],
    };
  }

  // Extract lines starting with bullet markers (- or * or •)
  const lines = markdown.split(/\r?\n/);
  const rawBullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      // Exclude skills list lines (which usually look like: "- **Category:** Skill1, Skill2")
      if (/^[-*•]\s+\*\*[^*]+:\*\*/.test(trimmed)) {
        continue;
      }
      rawBullets.push(trimmed);
    }
  }

  const analyzedBullets: BulletAnalysis[] = [];
  let strongCount = 0;
  let metricsCount = 0;
  let weakCount = 0;

  for (const bullet of rawBullets) {
    // Strip leading bullet and markdown bold/link artifacts for plain analysis
    const cleanText = bullet
      .replace(/^[-*•]\s+/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // First word for action verb check
    const lowerFirstWord = (words[0] || '').toLowerCase().replace(/[^a-z-]/g, '');

    // Check for weak passive phrases
    let weakVerb: string | undefined;
    let suggestedVerb: string | undefined;
    for (const [weakPhrase, suggestion] of Object.entries(WEAK_PASSIVE_PHRASES)) {
      if (cleanText.toLowerCase().startsWith(weakPhrase)) {
        weakVerb = weakPhrase;
        suggestedVerb = suggestion;
        break;
      }
    }

    // Check for strong action verb
    const hasActionVerb = !weakVerb && STRONG_ACTION_VERBS.includes(lowerFirstWord);
    const actionVerb = hasActionVerb ? words[0] : undefined;

    // Check for metrics
    const metricMatches = cleanText.match(METRIC_REGEX) || [];
    const hasMetric = metricMatches.length > 0;

    let score = 50; // base score
    if (hasActionVerb) score += 25;
    if (weakVerb) score -= 25;
    if (hasMetric) score += 25;
    if (wordCount >= 12 && wordCount <= 35) score += 10;
    else if (wordCount < 8 || wordCount > 45) score -= 15;

    score = Math.max(10, Math.min(100, score));

    let status: 'strong' | 'needs-metric' | 'passive' = 'needs-metric';
    if (weakVerb) {
      status = 'passive';
      weakCount++;
    } else if (hasActionVerb && hasMetric) {
      status = 'strong';
      strongCount++;
    } else {
      status = 'needs-metric';
      if (hasActionVerb) strongCount++;
    }

    if (hasMetric) metricsCount++;

    analyzedBullets.push({
      raw: bullet,
      cleanText,
      hasActionVerb,
      actionVerb,
      weakVerb,
      suggestedVerb,
      hasMetric,
      metrics: metricMatches,
      wordCount,
      score,
      status,
    });
  }

  const total = analyzedBullets.length;
  const overallScore = total === 0 ? 100 : Math.round(
    analyzedBullets.reduce((acc, b) => acc + b.score, 0) / total
  );

  return {
    overallScore,
    totalBullets: total,
    strongBullets: strongCount,
    metricsBullets: metricsCount,
    weakVerbBullets: weakCount,
    bullets: analyzedBullets,
  };
}

/**
 * Replaces a weak bullet opening with a recommended strong action verb in the markdown.
 */
export function quickFixBulletVerb(
  markdown: string,
  rawBullet: string,
  weakVerb: string,
  replacement: string
): string {
  // Build case-insensitive replacement for that specific bullet line
  const escapedWeak = weakVerb.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(^[-*•]\\s+)${escapedWeak}`, 'i');
  const updatedBullet = rawBullet.replace(regex, `$1${replacement}`);
  return markdown.replace(rawBullet, updatedBullet);
}
