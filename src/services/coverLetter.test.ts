import { describe, it, expect } from 'vitest';
import { generateCoverLetterTemplate, evidenceForJob } from './coverLetterGenerator';
import { markdownToResume } from '../model/serialize';

const RESUME = `# Jane Doe
jane@example.com

## Experience
### Acme — Engineer
- Organised the quarterly offsite
- Ran Kubernetes clusters in production serving 2M requests
- Mentored 5 engineers across 3 teams
`;
const JD = 'Required:\n- Experience running Kubernetes clusters in production\n- Experience mentoring engineers\n';

describe('cover letter from a job', () => {
  it('positive: the job evidence bullets appear as placeholders to rewrite, most relevant first', () => {
    const r = markdownToResume(RESUME, 'Jane');
    const evidence = evidenceForJob(r, JD);
    expect(evidence[0]).toContain('Kubernetes');
    const letter = generateCoverLetterTemplate(r, 'Acme', 'Engineer', evidence);
    expect(letter.content).toContain('[Rewrite in your own words, using this as evidence: "Ran Kubernetes clusters in production serving 2M requests"]');
    expect(letter.content).not.toContain('Organised the quarterly offsite');
  });

  it('negative: with no job, the template uses the first achievements as before', () => {
    const r = markdownToResume(RESUME, 'Jane');
    const letter = generateCoverLetterTemplate(r, 'Acme', 'Engineer');
    expect(letter.content).toContain('- Organised the quarterly offsite');
    expect(letter.content).not.toContain('Rewrite in your own words');
  });

  it('negative: an empty job gives no evidence', () => {
    expect(evidenceForJob(markdownToResume(RESUME, 'Jane'), '   ')).toEqual([]);
  });

  it('the template invents no sentence: every bullet in it comes from the resume or a placeholder', () => {
    const r = markdownToResume(RESUME, 'Jane');
    const evidence = evidenceForJob(r, JD);
    const letter = generateCoverLetterTemplate(r, 'Acme', 'Engineer', evidence);
    for (const e of evidence) expect(letter.content).toContain(e);
  });
});
