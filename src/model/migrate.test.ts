import { describe, it, expect, vi, beforeEach } from 'vitest';

const saveResume = vi.fn();
vi.mock('../services/persistence', () => ({
  saveResume: (...args: unknown[]) => saveResume(...args),
}));

import { migrateV1ToV2 } from './migrate';

const profiles = [
  { id: 'a', title: 'Alpha', markdown: '# Ada\n\n## Experience\n- Built things', theme: 'modern' },
  { id: 'b', title: 'Beta', markdown: '# Bob\n\n## Skills\n- TypeScript' },
];

describe('migrateV1ToV2', () => {
  beforeEach(() => {
    localStorage.clear();
    saveResume.mockReset();
    localStorage.setItem('resumeos_profiles_v1', JSON.stringify(profiles));
  });

  it('saves every resume and sets the migrated flag when all saves succeed', async () => {
    saveResume.mockResolvedValue(true);
    const result = await migrateV1ToV2();

    expect(saveResume).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.migratedCount).toBe(2);
    expect(localStorage.getItem('resumeos_v1_migrated')).toBe('true');
    const ids = saveResume.mock.calls.map((c) => c[0].id);
    expect(ids).toEqual(['v1-a', 'v1-b']);
  });

  it('does NOT set the migrated flag when any save fails', async () => {
    saveResume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const result = await migrateV1ToV2();

    expect(result.success).toBe(false);
    expect(result.migratedCount).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(localStorage.getItem('resumeos_v1_migrated')).toBeNull();
    // v1 data is kept as backup
    expect(localStorage.getItem('resumeos_profiles_v1')).not.toBeNull();
  });

  it('does not set the flag when saving throws', async () => {
    saveResume.mockRejectedValue(new Error('quota'));
    const result = await migrateV1ToV2();
    expect(result.success).toBe(false);
    expect(localStorage.getItem('resumeos_v1_migrated')).toBeNull();
  });
});
