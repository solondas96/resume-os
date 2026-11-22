import { describe, it, expect } from 'vitest';
import { matchJobDescription } from './jobMatcher';
import { markdownToResume } from '../model/serialize';

const resume = (body: string) =>
  markdownToResume(`# Jane Doe\njane@example.com\n\n${body}`, 'Jane');

const JD = `About the role

Required:
- Experience with Kubernetes and Terraform in production

Nice to have:
- Experience with Haskell
`;

describe('job matcher: requirement classification', () => {
  it('positive: bullets under "Required" are must-haves and under "Nice to have" are nice-to-haves', () => {
    const result = matchJobDescription(JD, resume(''));
    const must = result.requirements.filter((r) => r.type === 'must-have');
    const nice = result.requirements.filter((r) => r.type === 'nice-to-have');
    expect(must.length).toBe(1);
    expect(nice.length).toBe(1);
    expect(must[0].text).toContain('Kubernetes');
  });

  it('negative: a posting with no bullet points yields no requirements and a score of 0', () => {
    const result = matchJobDescription('We are hiring a great engineer. Apply today.', resume(''));
    expect(result.requirements).toEqual([]);
    expect(result.score).toBe(0);
    expect(Number.isNaN(result.score)).toBe(false);
  });
});

describe('job matcher: evidence strength', () => {
  const kube = resume(`## Experience
### Acme — Engineer
- Ran Kubernetes and Terraform in production for 3 teams
`);

  it('positive: a bullet containing the requirement terms is strong evidence', () => {
    const req = matchJobDescription(JD, kube).requirements.find((r) => r.type === 'must-have')!;
    expect(req.strength).toBe('strong');
    expect(req.evidence?.bulletText).toContain('Kubernetes');
  });

  it('negative: a resume with no related bullet reports the requirement as missing', () => {
    const unrelated = resume(`## Experience
### Acme — Engineer
- Wrote Python services for billing
`);
    const req = matchJobDescription(JD, unrelated).requirements.find((r) => r.type === 'must-have')!;
    expect(req.strength).toBe('missing');
    expect(req.evidence).toBeUndefined();
  });

  it('a resume with an empty skills section still matches without crashing', () => {
    const r = resume('## Skills\n- Terraform\n\n## Projects\n');
    expect(() => matchJobDescription(JD, r)).not.toThrow();
  });
});

describe('job matcher: overall score', () => {
  it('positive: covering the must-haves scores higher than covering nothing', () => {
    const covered = resume(`## Experience
### Acme — Engineer
- Ran Kubernetes and Terraform in production for 3 teams
`);
    const empty = resume(`## Experience
### Acme — Engineer
- Wrote Python services for billing
`);
    expect(matchJobDescription(JD, covered).score).toBeGreaterThan(matchJobDescription(JD, empty).score);
  });

  it('weights must-haves at 70 percent of the score', () => {
    const covered = resume(`## Experience
### Acme — Engineer
- Ran Kubernetes and Terraform in production for 3 teams
`);
    const result = matchJobDescription(JD, covered);
    // One must-have, fully covered (100); the nice-to-have is not covered (0)
    expect(result.score).toBe(Math.round(100 * 0.7 + 0 * 0.3));
  });
});
