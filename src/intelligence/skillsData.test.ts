// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { loadSkillsDataset, resetSkillsDataLoader } from './skillsData';
import { canonicalSkill, resetSkillsDataset } from './skills';

afterEach(() => {
  resetSkillsDataLoader();
  resetSkillsDataset();
  vi.unstubAllGlobals();
});

describe('loadSkillsDataset', () => {
  beforeEach(() => resetSkillsDataLoader());
  it('positive: a loaded file is installed, and its entries match', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ skills: [{ c: 'Patient Care', a: ['bedside care'] }] }) })));
    expect(await loadSkillsDataset('./test.json')).toBe(true);
    expect(canonicalSkill('bedside care')).toBe('Patient Care');
  });

  it('negative: a missing file (HTTP error) returns false and keeps the curated list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await loadSkillsDataset('./missing-' + Math.random() + '.json')).toBe(false);
    expect(canonicalSkill('k8s')).toBe('Kubernetes');
  });

  it('negative: a network failure returns false without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await loadSkillsDataset('./offline-' + Math.random() + '.json')).toBe(false);
  });
});
