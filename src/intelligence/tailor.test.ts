import { describe, it, expect } from 'vitest';
import { scoreBullets, tailoringProposals, applyAccepted, PAGE_BULLET_BUDGET, termsOf } from './tailor';
import { markdownToResume, resumeToMarkdown } from '../model/serialize';
import { allBullets, sectionItems, Resume } from '../model/resume';

const JD = `Required:
- Experience running Kubernetes clusters in production
- Terraform infrastructure as code
Nice to have:
- Haskell`;

const BASE = `# Jane Doe
jane@example.com

## Experience
### Acme — Senior Engineer
- Organised the quarterly offsite and budget spreadsheet
- Ran Kubernetes clusters in production serving 2M requests
- Wrote onboarding notes for new hires
- Operated Terraform infrastructure as code across three regions

## Skills
- **Languages:** Python, Go
- **Platform:** Kubernetes, Docker, Terraform
`;

const resume = () => markdownToResume(BASE, 'Jane');

const bulletTexts = (r: Resume) => sectionItems(r.sections[0])[0].bullets.map((b) => b.text);

describe('relevance scoring', () => {
  it('is deterministic: the same input gives the same scores', () => {
    const a = [...scoreBullets(resume(), JD).values()];
    const b = [...scoreBullets(resume(), JD).values()];
    expect(a).toEqual(b);
  });

  it('positive: a bullet with the job terms scores above one without them', () => {
    const r = resume();
    const scores = scoreBullets(r, JD);
    const byText = Object.fromEntries(allBullets(r).map((b) => [b.bullet.text, scores.get(b.bullet.id)!]));
    expect(byText['Ran Kubernetes clusters in production serving 2M requests']).toBeGreaterThan(byText['Wrote onboarding notes for new hires']);
    expect(byText['Ran Kubernetes clusters in production serving 2M requests']).toBeGreaterThan(0);
  });

  it('negative: a bullet with no shared terms scores zero', () => {
    const r = resume();
    const scores = scoreBullets(r, JD);
    const offTopic = allBullets(r).find((b) => b.bullet.text.startsWith('Organised'))!;
    expect(scores.get(offTopic.bullet.id)).toBe(0);
  });

  it('dictionary synonyms count as the same term ("k8s" and "Kubernetes")', () => {
    expect(termsOf('Ran k8s clusters')).toContain('skill:kubernetes');
    expect(termsOf('Ran Kubernetes clusters')).toContain('skill:kubernetes');
  });
});

describe('proposals', () => {
  it('positive: proposes reordering when the relevant bullet is not first', () => {
    const props = tailoringProposals(resume(), JD);
    const reorder = props.find((p) => p.kind === 'reorder-bullets');
    expect(reorder).toBeDefined();
    expect(reorder!.after[0]).toContain('Kubernetes');
  });

  it('negative: no reorder proposal when the bullets are already in relevance order', () => {
    const ordered = markdownToResume(
      `# Jane\n\n## Experience\n### Acme — Engineer\n- Ran Kubernetes clusters in production\n- Operated Terraform infrastructure\n- Organised the offsite\n`,
      'Jane'
    );
    const props = tailoringProposals(ordered, JD).filter((p) => p.kind === 'reorder-bullets');
    expect(props).toEqual([]);
  });

  it('proposes skills that match the job first (positive) and nothing when they already do (negative)', () => {
    const props = tailoringProposals(resume(), JD).filter((p) => p.kind === 'reorder-skills');
    expect(props.some((p) => p.after[0].startsWith('Kubernetes'))).toBe(true);
    const aligned = markdownToResume(`# J\n\n## Skills\n- **Platform:** Kubernetes, Terraform\n`, 'J');
    expect(tailoringProposals(aligned, JD).filter((p) => p.kind === 'reorder-skills')).toEqual([]);
  });

  it('hides nothing when the resume fits the page budget', () => {
    expect(tailoringProposals(resume(), JD).filter((p) => p.kind === 'hide-bullet')).toEqual([]);
  });

  it('over budget: hides only zero-relevance bullets, and never leaves an entry below the minimum', () => {
    const many = Array.from({ length: PAGE_BULLET_BUDGET + 4 }, (_, i) => `- Organised meeting number ${i}`).join('\n');
    const r = markdownToResume(`# J\n\n## Experience\n### Acme — Engineer\n${many}\n- Ran Kubernetes clusters\n`, 'J');
    const hides = tailoringProposals(r, JD).filter((p) => p.kind === 'hide-bullet');
    expect(hides.length).toBeGreaterThan(0);
    const applied = applyAccepted(r, hides, new Set(hides.map((h) => h.id)));
    const visible = sectionItems(applied.sections[0])[0].bullets.filter((b) => !b.hidden);
    expect(visible.length).toBeGreaterThanOrEqual(2);
    expect(visible.some((b) => b.text.includes('Kubernetes'))).toBe(true);
  });

  it('gaps: a must-have with no evidence is reported, with no change to apply', () => {
    const jd = 'Required:\n- Experience with Rust systems programming\n';
    const gaps = tailoringProposals(resume(), jd).filter((p) => p.kind === 'gap');
    expect(gaps.length).toBe(1);
    expect(gaps[0].title).toContain('Rust');
    expect(gaps[0].apply).toBeUndefined();
  });

  it('negative: a must-have the resume already covers is not reported as a gap', () => {
    const gaps = tailoringProposals(resume(), JD).filter((p) => p.kind === 'gap');
    expect(gaps).toEqual([]);
  });
});

describe('accept and reject', () => {
  it('accepted reorder changes the order; rejected does not', () => {
    const r = resume();
    const props = tailoringProposals(r, JD);
    const id = props.find((p) => p.kind === 'reorder-bullets')!.id;
    const accepted = applyAccepted(r, props, new Set([id]));
    expect(bulletTexts(accepted)[0]).toContain('Kubernetes');
    const rejected = applyAccepted(r, props, new Set());
    expect(bulletTexts(rejected)).toEqual(bulletTexts(r));
  });

  it('accepting every proposal changes order and skills but never any sentence', () => {
    const r = resume();
    const props = tailoringProposals(r, JD);
    const all = applyAccepted(r, props, new Set(props.map((p) => p.id)));
    const sentencesBefore = allBullets(r).map((b) => b.bullet.text).sort();
    const sentencesAfter = allBullets(all).map((b) => b.bullet.text).sort();
    expect(sentencesAfter).toEqual(sentencesBefore);
    const skillsBefore = resumeToMarkdown(r).match(/- \*\*Platform:\*\*.*/)![0];
    const skillsAfter = resumeToMarkdown(all).match(/- \*\*Platform:\*\*.*/)![0];
    expect(skillsAfter).not.toBe(skillsBefore);
  });

  it('a hide can be rejected and leaves the bullet visible', () => {
    const many = Array.from({ length: PAGE_BULLET_BUDGET + 2 }, (_, i) => `- Organised meeting ${i}`).join('\n');
    const r = markdownToResume(`# J\n\n## Experience\n### Acme — Engineer\n${many}\n- Ran Kubernetes clusters\n`, 'J');
    const props = tailoringProposals(r, JD);
    const after = applyAccepted(r, props, new Set(props.filter((p) => p.kind !== 'hide-bullet').map((p) => p.id)));
    expect(allBullets(after).every((b) => !b.bullet.hidden)).toBe(true);
  });
});
