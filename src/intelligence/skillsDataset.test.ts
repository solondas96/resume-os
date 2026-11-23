// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { installSkillsDataset, resetSkillsDataset, extractSkills, canonicalSkill } from './skills';
import { matchJobDescription } from './jobMatcher';
import { markdownToResume } from '../model/serialize';

const dataset = JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', 'skills.json'), 'utf8'));

/** A posting in plain language, with its requirements as bullets */
const posting = (lines: string[]) => `Required:\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
const resume = (bullet: string) => markdownToResume(`# Sam Lee\n\n## Experience\n### Acme — Staff\n- ${bullet}\n`, 'Sam');

describe('generated skills dataset: non-tech professions', () => {
  beforeAll(() => installSkillsDataset(dataset));
  afterAll(() => resetSkillsDataset());

  it('nursing: "medicine and dentistry" is a skill, and a bullet about triage is evidence for it', () => {
    const jd = posting(['Knowledge of medicine and dentistry for patient triage']);
    expect(extractSkills(jd)).toContain('Medicine and Dentistry');
    const req = matchJobDescription(jd, resume('Applied medicine and dentistry protocols to triage 40 patients a shift')).requirements[0];
    expect(req.strength).not.toBe('missing');
  });

  it('accounting: "economics and accounting" and "mathematics" are recognised and matched', () => {
    const jd = posting(['Economics and accounting knowledge', 'Strong mathematics']);
    const skills = extractSkills(jd);
    expect(skills).toEqual(expect.arrayContaining(['Economics and Accounting', 'Mathematics']));
    const reqs = matchJobDescription(jd, resume('Closed the monthly books using economics and accounting controls')).requirements;
    expect(reqs[0].strength).not.toBe('missing');
  });

  it('teaching: "education and training" is recognised', () => {
    const jd = posting(['Experience in education and training design']);
    expect(extractSkills(jd)).toContain('Education and Training');
  });

  it('retail: "customer and personal service" and "sales and marketing" are recognised', () => {
    const jd = posting(['Customer and personal service', 'Sales and marketing']);
    expect(extractSkills(jd)).toEqual(expect.arrayContaining(['Customer and Personal Service', 'Sales and Marketing']));
  });

  it('soft skills from the dataset are recognised ("active listening", "critical thinking")', () => {
    expect(extractSkills('Active listening and critical thinking')).toEqual(expect.arrayContaining(['Active Listening', 'Critical Thinking']));
  });

  it('the dataset is shared: a name the curated list also has keeps its curated form', () => {
    expect(canonicalSkill('k8s')).toBe('Kubernetes');
    expect(canonicalSkill('Git')).toBe('Git');
  });
});

describe('without the dataset, the same phrases are not recognised (negative control)', () => {
  beforeAll(() => resetSkillsDataset());

  it('nursing and accounting phrases are not in the curated dictionary', () => {
    expect(extractSkills('medicine and dentistry; economics and accounting')).toEqual([]);
    expect(canonicalSkill('active listening')).toBeNull();
  });
});

describe('synonyms from a dataset (aliases)', () => {
  afterAll(() => resetSkillsDataset());

  it('an alias from the dataset resolves to its canonical name', () => {
    installSkillsDataset({ skills: [{ c: 'Patient Care', a: ['bedside care', 'patient support'] }] });
    expect(canonicalSkill('bedside care')).toBe('Patient Care');
    expect(extractSkills('Provided Patient Support on the ward')).toEqual(['Patient Care']);
  });
});

describe('tokenising', () => {
  it('keeps C++, Node.js and CI/CD whole', () => {
    expect(extractSkills('C++ and Node.js with CI/CD')).toEqual(expect.arrayContaining(['C++', 'Node.js', 'CI/CD']));
  });
});
