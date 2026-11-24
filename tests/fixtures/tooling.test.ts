// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { checkDataset } from '../../scripts/check-skills';
import { run as addFixture } from './add-fixture';

const good = {
  version: 1,
  sources: [{ name: 'Project', license: 'Project-authored', attribution: 'ResumeLabs' }],
  skills: [
    { c: 'JavaScript', a: ['js'], k: 'technology' },
    { c: 'Scrum', a: [], k: 'practice' },
  ],
};

describe('skills:check rules', () => {
  it('positive: a clean dataset passes and counts by kind', () => {
    const { problems, kinds } = checkDataset(good, 1000);
    expect(problems).toEqual([]);
    expect(kinds).toEqual({ technology: 1, practice: 1 });
  });

  it('negative: a repeated name (ignoring case) fails', () => {
    const { problems } = checkDataset({ ...good, skills: [...good.skills, { c: 'javascript', a: [], k: 'technology' }] }, 1000);
    expect(problems.join(' ')).toMatch(/appears twice/);
  });

  it('negative: a source with no licence fails', () => {
    const { problems } = checkDataset({ ...good, sources: [{ name: 'Unlisted' }] }, 1000);
    expect(problems.join(' ')).toMatch(/no licence or attribution/);
  });

  it('negative: a file over the byte budget fails', () => {
    const { problems } = checkDataset(good, 2_000_000);
    expect(problems.join(' ')).toMatch(/over the 1500000 byte budget/);
  });

  it('negative: a skill with no aliases list fails', () => {
    const { problems } = checkDataset({ ...good, skills: [{ c: 'Go', k: 'technology' } as unknown as { c: string; a: string[]; k: string }] }, 1000);
    expect(problems.join(' ')).toMatch(/no list of aliases/);
  });
});

describe('fixtures:add input checks', () => {
  it('negative: an id with capitals or spaces is refused, and nothing is written', () => {
    expect(addFixture(['Bad Id', 'docs/usability-kit/sample-resume.pdf'])).toBe(2);
  });

  it('negative: a file that is not a PDF is refused', () => {
    expect(addFixture(['tmp-not-a-pdf', 'docs/usability-kit/job-description.txt'])).toBe(2);
  });

  it('negative: a missing file is refused', () => {
    expect(addFixture(['tmp-missing', 'does/not/exist.pdf'])).toBe(2);
  });

  it('negative: missing arguments print the usage and return 2', () => {
    expect(addFixture(['only-an-id'])).toBe(2);
  });
});
