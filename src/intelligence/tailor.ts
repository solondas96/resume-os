/**
 * Tailoring proposals. Given a resume and a job description, propose changes that only
 * reorder, hide, or point out. A proposal never writes or edits a sentence.
 *
 * Relevance is TF-IDF over terms that are resolved through the skills dictionary
 * (so "k8s" and "Kubernetes" are one term), plus stemmed words. Plain arithmetic, no models.
 * Same input gives the same proposals in the same order.
 */

import { Resume, sectionItems, allBullets } from '../model/resume';
import * as edit from '../model/edit';
import { extractSkills, stemWord } from './skills';
import { matchJobDescription } from './jobMatcher';

/** A one-page resume holds about this many bullets in total; more than this are hidden, lowest relevance first */
export const PAGE_BULLET_BUDGET = 14;
/** An entry keeps at least this many bullets when hiding */
export const MIN_BULLETS_PER_ENTRY = 2;

const STOP = new Set([
  'the', 'and', 'with', 'for', 'experience', 'years', 'year', 'strong', 'good', 'ability', 'knowledge',
  'work', 'working', 'role', 'team', 'teams', 'skills', 'skill', 'from', 'that', 'this', 'will', 'you',
  'your', 'our', 'are', 'have', 'must', 'nice', 'required', 'preferred', 'bonus', 'plus', 'including',
  'such', 'able', 'using', 'make', 'build', 'help', 'join', 'about', 'their', 'they', 'job', 'position',
]);

/** Terms of a text: canonical skills (from the dictionary) and stemmed significant words */
export function termsOf(text: string): string[] {
  const skills = extractSkills(text).map((s) => `skill:${s.toLowerCase()}`);
  const words = text
    .split(/[^A-Za-z0-9+#.]+/)
    .filter((w) => w.length > 3 && !STOP.has(w.toLowerCase()))
    .map(stemWord)
    .filter((w) => w.length > 3 && !STOP.has(w));
  return [...skills, ...words];
}

function counts(terms: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of terms) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/**
 * Relevance of each bullet to the job description.
 * score = sum over shared terms of (1 + ln tf_bullet) * idf, weighted by how often the term appears in the job.
 */
export function scoreBullets(resume: Resume, jobDescription: string): Map<string, number> {
  const jd = counts(termsOf(jobDescription));
  const bullets = allBullets(resume);
  const docs = bullets.map((b) => counts(termsOf(b.bullet.text)));
  const n = bullets.length;

  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.keys()) df.set(t, (df.get(t) ?? 0) + 1);

  const scores = new Map<string, number>();
  bullets.forEach((b, i) => {
    let score = 0;
    for (const [term, tf] of docs[i]) {
      const weight = jd.get(term);
      if (!weight) continue;
      const idf = Math.log((n + 1) / ((df.get(term) ?? 0) + 1)) + 1;
      score += (1 + Math.log(tf)) * idf * (1 + Math.log(weight));
    }
    scores.set(b.bullet.id, Math.round(score * 1000) / 1000);
  });
  return scores;
}

export type ChangeKind = 'reorder-bullets' | 'hide-bullet' | 'reorder-skills' | 'reorder-groups' | 'gap';

export interface Proposal {
  id: string;
  kind: ChangeKind;
  title: string;
  why: string;
  /** Lines shown before the change */
  before: string[];
  /** Lines shown after the change */
  after: string[];
  /** Pure change to the resume. Absent for gaps, which are information only. */
  apply?: (resume: Resume) => Resume;
}

/** Stable sort by score, descending; ties keep the original order */
function rankIds<T extends { id: string }>(items: T[], score: (x: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, s: score(item) }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .map((x) => x.item);
}

export function tailoringProposals(resume: Resume, jobDescription: string): Proposal[] {
  if (!jobDescription.trim()) return [];
  const scores = scoreBullets(resume, jobDescription);
  const out: Proposal[] = [];
  const jdSkills = new Set(extractSkills(jobDescription));
  const jdTerms = new Set(termsOf(jobDescription));

  // 1. Reorder bullets within each entry, most relevant first
  for (const section of resume.sections) {
    for (const item of sectionItems(section)) {
      const current = item.bullets;
      const ranked = rankIds(current, (b) => scores.get(b.id) ?? 0);
      if (ranked.every((b, i) => b.id === current[i].id)) continue;
      const label = entryLabel(item);
      out.push({
        id: `reorder-bullets:${item.id}`,
        kind: 'reorder-bullets',
        title: `Put the most relevant bullets first under ${label}`,
        why: 'Bullets that match this job now read first. The text does not change.',
        before: current.map((b) => `- ${b.text}`),
        after: ranked.map((b) => `- ${b.text}`),
        apply: (r) => edit.setBulletOrder(r, section.id, item.id, ranked.map((b) => b.id)),
      });
    }
  }

  // 2. Hide the least relevant bullets when the resume is over one page
  const visible = allBullets(resume).filter((b) => !b.bullet.hidden);
  let toHide = visible.length - PAGE_BULLET_BUDGET;
  if (toHide > 0) {
    const candidates = [...visible]
      .map((entry, index) => ({ ...entry, index, s: scores.get(entry.bullet.id) ?? 0 }))
      .filter((c) => c.s === 0)
      .sort((a, b) => a.s - b.s || b.index - a.index); // lowest first, later bullets before earlier ones
    const remainingPerItem = new Map<string, number>();
    for (const section of resume.sections) {
      for (const item of sectionItems(section)) remainingPerItem.set(item.id, item.bullets.filter((b) => !b.hidden).length);
    }
    for (const c of candidates) {
      if (toHide <= 0) break;
      const item = sectionItems(resume.sections.find((s) => s.id === c.sectionId)!).find((it) => it.bullets.some((b) => b.id === c.bullet.id))!;
      if ((remainingPerItem.get(item.id) ?? 0) <= MIN_BULLETS_PER_ENTRY) continue;
      remainingPerItem.set(item.id, (remainingPerItem.get(item.id) ?? 0) - 1);
      toHide -= 1;
      out.push({
        id: `hide-bullet:${c.bullet.id}`,
        kind: 'hide-bullet',
        title: 'Hide a bullet with no link to this job to fit one page',
        why: `Nothing in it matches the job, and the resume is over ${PAGE_BULLET_BUDGET} bullets. It stays in the form, hidden.`,
        before: [`- ${c.bullet.text}`],
        after: [`(hidden) ${c.bullet.text}`],
        apply: (r) => edit.setBulletHidden(r, c.sectionId, item.id, c.bullet.id, true),
      });
    }
  }

  // 3. Skills: groups and skills that match the job first
  for (const section of resume.sections) {
    if (section.kind !== 'skills') continue;
    const matchedSkill = (skill: string) =>
      jdSkills.has(skill) || extractSkills(skill).some((s) => jdSkills.has(s)) || termsOf(skill).some((t) => jdTerms.has(t));
    for (const group of section.groups) {
      const ranked = rankIds(group.skills.map((s, i) => ({ id: `${i}`, s })), (x) => (matchedSkill(x.s) ? 1 : 0)).map((x) => x.s);
      if (ranked.every((s, i) => s === group.skills[i])) continue;
      out.push({
        id: `reorder-skills:${group.id}`,
        kind: 'reorder-skills',
        title: `List the skills this job asks for first in "${group.label || 'Skills'}"`,
        why: 'The skills are the same; only their order changes.',
        before: [group.skills.join(', ')],
        after: [ranked.join(', ')],
        apply: (r) => edit.setGroupSkills(r, section.id, group.id, ranked),
      });
    }
    const groupScore = (g: { skills: string[] }) => g.skills.filter(matchedSkill).length;
    const rankedGroups = rankIds(section.groups, groupScore);
    if (!rankedGroups.every((g, i) => g.id === section.groups[i].id)) {
      out.push({
        id: `reorder-groups:${section.id}`,
        kind: 'reorder-groups',
        title: `Move the skill groups that match this job to the top of ${section.title}`,
        why: 'Groups with the most matching skills read first.',
        before: section.groups.map((g) => g.label || 'Skills'),
        after: rankedGroups.map((g) => g.label || 'Skills'),
        apply: (r) => edit.setGroupOrder(r, section.id, rankedGroups.map((g) => g.id)),
      });
    }
  }

  // 4. Must-haves with no evidence: information only, the user writes any new content
  const match = matchJobDescription(jobDescription, resume);
  for (const req of match.requirements) {
    if (req.type !== 'must-have' || req.strength !== 'missing') continue;
    out.push({
      id: `gap:${req.text}`,
      kind: 'gap',
      title: `No evidence yet for: ${req.text}`,
      why: 'Add it only if it is true for you. This tool does not write new sentences.',
      before: [],
      after: [],
    });
  }

  return out;
}

/**
 * Apply the accepted proposals to a resume, in list order. Gaps change nothing.
 */
export function applyAccepted(resume: Resume, proposals: Proposal[], acceptedIds: Set<string>): Resume {
  return proposals.reduce((r, p) => (acceptedIds.has(p.id) && p.apply ? p.apply(r) : r), resume);
}

function entryLabel(item: object): string {
  const fields = item as Record<string, unknown>;
  if ('company' in fields) return `${fields.company}`;
  if ('school' in fields) return `${fields.school}`;
  return `${fields.title ?? 'this project'}`;
}


/** Stable id for a job description (FNV-1a), used to link a tailored copy to its job */
export function jobIdOf(jobDescription: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < jobDescription.length; i++) {
    h ^= jobDescription.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `job-${h.toString(16).padStart(8, '0')}`;
}
