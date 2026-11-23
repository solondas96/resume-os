// @vitest-environment node
/**
 * ESCO support in the skills build, tested on a made-up ESCO folder (tests/fixtures/esco) in the
 * same layout as the real download. Real ESCO files are not in the repository.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fromEsco, normalisedLabel, dedupeAgainst, SkillOut } from '../../scripts/build-skills';
import { SKILLS } from './skills';

const ESCO = join(process.cwd(), 'tests', 'fixtures', 'esco');
const sk = (c: string, a: string[] = [], k = 'skill'): SkillOut => ({ c, a, k });

describe('fromEsco: the made-up ESCO folder', () => {
  const esco = fromEsco(ESCO);

  it('positive: reads preferred labels and the quoted, multi-line alternative labels', () => {
    const stock = esco.skills.find((s) => s.c === 'Stock control');
    expect(stock?.a).toEqual(['inventory management', 'stock keeping']);
    expect(esco.skills.find((s) => s.c === 'Ancient Greek literature')?.k).toBe('knowledge');
    expect(esco.skills.length).toBe(7);
  });

  it('positive: a skill used by an occupation gets that occupation\'s ISCO major group tag ("I" + digit)', () => {
    expect(esco.skills.find((s) => s.c === 'Animal triage')?.o).toEqual(['I3']);
    expect(esco.skills.find((s) => s.c === 'Stock control')?.o).toEqual(['I1']);
  });

  it('negative: a skill with no occupation link has no tags', () => {
    expect(esco.skills.find((s) => s.c === 'Negotiation')?.o).toBeUndefined();
  });

  it('negative: a missing folder gives nothing and does not throw', () => {
    const none = fromEsco(join(ESCO, 'does-not-exist'));
    expect(none).toEqual({ skills: [], titles: [] });
  });
});

describe('normalisedLabel', () => {
  it('positive: case, punctuation and spacing do not matter', () => {
    expect(normalisedLabel('Python (programming)')).toBe('python programming');
    expect(normalisedLabel('  Month-end   CLOSE ')).toBe('month end close');
  });
  it('keeps + and # so C++ and C# stay distinct from C', () => {
    expect(normalisedLabel('C++')).not.toBe(normalisedLabel('C'));
    expect(normalisedLabel('C#')).not.toBe(normalisedLabel('C'));
  });
});

describe('dedupeAgainst: ESCO labels already in the dataset are dropped', () => {
  const existing = [sk('Negotiation', ['bargaining']), sk('Strategic planning', []), sk('Inventory Management', ['stock management'])];

  it('positive: the same label in another case or order is a duplicate', () => {
    const { kept, dropped } = dedupeAgainst(existing, [sk('NEGOTIATION'), sk('Planning strategic')]);
    expect(kept).toEqual([]);
    expect(dropped.map((d) => d.c)).toEqual(['NEGOTIATION', 'Planning strategic']);
  });

  it('positive: a label that overlaps by 80% or more (Jaccard) is a duplicate', () => {
    // Four shared words out of five in the union: 4/5 = 80%, which is the threshold
    const base = [sk('Strategic planning analysis skills')];
    const { dropped } = dedupeAgainst(base, [sk('Strategic planning analysis skills long')]);
    expect(dropped.length).toBe(1);
  });

  it('negative: different skills are kept, including one that shares a single word', () => {
    const { kept } = dedupeAgainst(existing, [sk('Financial planning'), sk('Crop rotation'), sk('Ancient Greek literature')]);
    expect(kept.map((k) => k.c)).toEqual(['Financial planning', 'Crop rotation', 'Ancient Greek literature']);
  });

  it('negative: an alternative label of an existing skill also counts as a duplicate', () => {
    const { dropped } = dedupeAgainst(existing, [sk('bargaining')]);
    expect(dropped.length).toBe(1);
  });

  it('the curated tech list has no ESCO duplicates of its own names (sanity)', () => {
    const curated = SKILLS.map((e) => sk(e.canonical, e.aliases));
    const { kept } = dedupeAgainst(curated, [sk('JavaScript')]);
    expect(kept).toEqual([]);
  });
});

describe('the build run on the made-up ESCO folder', () => {
  let outDir: string;
  const onet = '/private/tmp/claude-501/onet/db/db_29_1_text';
  const tsx = join(process.cwd(), 'node_modules', '.bin', 'tsx');
  const haveOnet = existsSync(onet);

  beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'skills-build-'));
  });
  afterAll(() => {
    if (outDir) rmSync(outDir, { recursive: true, force: true });
  });

  it.skipIf(!haveOnet)('positive: the normal build writes one file and reports the ESCO counts', () => {
    const log = execFileSync(tsx, ['scripts/build-skills.ts', '--onet', onet, '--esco', ESCO, '--out', outDir], { encoding: 'utf8' });
    expect(log).toMatch(/ESCO: 7 skills read, 2 duplicates/);
    const data = JSON.parse(readFileSync(join(outDir, 'skills.json'), 'utf8'));
    expect(data.skills.some((s: SkillOut) => s.c === 'Ancient Greek literature')).toBe(true);
    expect(existsSync(join(outDir, 'skills-esco.json'))).toBe(false);
  });

  it.skipIf(!haveOnet)('positive: a forced split writes the core and the ESCO entries in separate files', () => {
    const split = mkdtempSync(join(tmpdir(), 'skills-split-'));
    try {
      execFileSync(tsx, ['scripts/build-skills.ts', '--onet', onet, '--esco', ESCO, '--out', split], {
        encoding: 'utf8',
        env: { ...process.env, SKILLS_FORCE_SPLIT: '1' },
      });
      const core = JSON.parse(readFileSync(join(split, 'skills.json'), 'utf8'));
      const esco = JSON.parse(readFileSync(join(split, 'skills-esco.json'), 'utf8'));
      expect(esco.skills.map((s: SkillOut) => s.c)).toContain('Animal triage');
      expect(core.skills.some((s: SkillOut) => s.c === 'Animal triage')).toBe(false);
    } finally {
      rmSync(split, { recursive: true, force: true });
    }
  });
});

describe('the app loads the ESCO file after the core, when there is one', () => {
  // Imported here so the mocked fetch is in place before the loader runs
  it('positive: a name that only the ESCO file has is recognised after loading', async () => {
    const { loadSkillsDataset, resetSkillsDataLoader } = await import('./skillsData');
    const { canonicalSkill, resetSkillsDataset } = await import('./skills');
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (String(url).endsWith('skills-esco.json')) return new Response(JSON.stringify({ skills: [{ c: 'Veterinary triage', a: ['animal triage'], k: 'skill' }] }));
      return new Response(JSON.stringify({ skills: [{ c: 'Core only', a: [], k: 'skill' }] }));
    }) as typeof fetch;
    try {
      resetSkillsDataLoader();
      expect(await loadSkillsDataset()).toBe(true);
      expect(canonicalSkill('animal triage')).toBe('Veterinary triage');
      expect(canonicalSkill('Core only')).toBe('Core only');
    } finally {
      globalThis.fetch = realFetch;
      resetSkillsDataset();
      resetSkillsDataLoader();
    }
  });

  it('negative: without the ESCO file, the core still loads and nothing is an error', async () => {
    const { loadSkillsDataset, resetSkillsDataLoader } = await import('./skillsData');
    const { canonicalSkill, resetSkillsDataset } = await import('./skills');
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (String(url).endsWith('skills-esco.json')) return new Response('not found', { status: 404 });
      return new Response(JSON.stringify({ skills: [{ c: 'Core only', a: [], k: 'skill' }] }));
    }) as typeof fetch;
    try {
      resetSkillsDataLoader();
      expect(await loadSkillsDataset()).toBe(true);
      expect(canonicalSkill('animal triage')).toBeNull();
      expect(canonicalSkill('Core only')).toBe('Core only');
    } finally {
      globalThis.fetch = realFetch;
      resetSkillsDataset();
      resetSkillsDataLoader();
    }
  });
});
