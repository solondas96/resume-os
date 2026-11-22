/**
 * Bullet builder: composes an XYZ-style bullet from what the user wrote.
 * It never adds facts. Every word of the result comes from the input or a verb list.
 */

export type Intent = 'lead' | 'build' | 'improve' | 'analyse' | 'communicate' | 'earn';

export const INTENT_VERBS: Record<Intent, string[]> = {
  lead: ['Led', 'Directed', 'Owned', 'Coordinated'],
  build: ['Built', 'Designed', 'Implemented', 'Launched'],
  improve: ['Improved', 'Reduced', 'Optimized', 'Increased'],
  analyse: ['Analyzed', 'Measured', 'Evaluated'],
  communicate: ['Presented', 'Wrote', 'Facilitated'],
  earn: ['Grew', 'Generated', 'Saved'],
};

export interface BulletInput {
  intent: Intent;
  verb?: string;
  /** What did you do? */
  did: string;
  /** What changed, by how much? */
  change?: string;
  /** How? */
  how?: string;
}

export interface ComposedBullet {
  text: string;
  hasMetric: boolean;
  prompt?: string;
}

const clean = (s: string) => s.trim().replace(/[.;:,]+$/, '');

export function composeBullet(input: BulletInput): ComposedBullet {
  const verb = (input.verb?.trim() || INTENT_VERBS[input.intent][0]).replace(/^\w/, (c) => c.toUpperCase());
  const did = clean(input.did);
  const change = input.change ? clean(input.change) : '';
  const how = input.how ? clean(input.how) : '';

  let text = [verb, did].filter(Boolean).join(' ');
  if (change) text += `, ${change}`;
  if (how) text += `, by ${how}`;
  text = text.replace(/\s+/g, ' ').trim() + '.';

  const hasMetric = /\d/.test(change);
  return {
    text,
    hasMetric,
    prompt: hasMetric
      ? undefined
      : 'Roughly what percentage, count or time changed? An estimate is fine, but be honest.',
  };
}
