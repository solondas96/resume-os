import { describe, it, expect } from 'vitest';
import { extractSkills, canonicalSkill, stemWord } from './skills';

describe('skills dictionary', () => {
  it('positive: synonyms and abbreviations resolve to the canonical name', () => {
    expect(canonicalSkill('k8s')).toBe('Kubernetes');
    expect(canonicalSkill('Postgres')).toBe('PostgreSQL');
    expect(canonicalSkill('Golang')).toBe('Go');
  });

  it('positive: extracts several canonical skills from one sentence', () => {
    expect(extractSkills('Ran k8s clusters with Terraform and postgres')).toEqual(['Kubernetes', 'Terraform', 'PostgreSQL']);
  });

  it('negative: unknown words and stopwords are not skills', () => {
    expect(canonicalSkill('synergy')).toBeNull();
    expect(extractSkills('We value a collaborative, fast-moving culture')).toEqual([]);
  });

  it('negative: a short alias does not match inside another word', () => {
    // "ts" must not match inside "jets" or "lots"
    expect(extractSkills('Managed lots of jets')).toEqual([]);
  });

  it('rule-based normalisation folds -ize/-ise and plural forms together', () => {
    expect(stemWord('optimizing')).toBe(stemWord('optimization'));
    expect(stemWord('optimize')).toBe(stemWord('optimised'));
    expect(stemWord('services')).toBe(stemWord('service'));
  });
});
