// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

const saveResume = vi.fn(async (_resume: unknown) => true);
vi.mock('../services/persistence', () => ({ saveResume: (...a: unknown[]) => saveResume(a[0]) }));

import { migrateV1ToV2, needsMigration, getV1Backup, restoreFromV1Backup, runMigrationOnStartup } from './migrate';

const PROFILE = {
  id: 'p1',
  title: 'Old',
  targetRole: 'Engineer',
  markdown: '# Old Person\n\n## Experience\n### Acme — Engineer\n- Did it\n',
  theme: 'classic',
  accentColor: '#123456',
  fontSize: 'large',
  marginSize: 'narrow',
  lineHeight: 'tight',
  updatedAt: 1700000000000,
};

describe('v1 migration details', () => {
  beforeEach(() => {
    localStorage.clear();
    saveResume.mockClear();
  });

  it('carries the design settings and dates from the v1 profile', async () => {
    localStorage.setItem('resumeos_profiles_v1', JSON.stringify([PROFILE]));
    await migrateV1ToV2();
    const saved = saveResume.mock.calls[0][0] as any;
    expect(saved.design).toMatchObject({ template: 'classic', accent: '#123456', fontSize: 'large', margin: 'narrow', lineHeight: 'tight' });
    expect(saved.meta.targetRole).toBe('Engineer');
    expect(saved.meta.updatedAt).toBe(1700000000000);
  });

  it('takes a backup of every v1 key before migrating', async () => {
    localStorage.setItem('resumeos_state_v1', '{"markdown":"x"}');
    localStorage.setItem('resumeos_profiles_v1', JSON.stringify([PROFILE]));
    const result = await migrateV1ToV2();
    expect(result.backupCreated).toBe(true);
    const backup = getV1Backup();
    expect(backup.data.state).toBe('{"markdown":"x"}');
    expect(backup.data.profiles).toContain('Old Person');
  });

  it('a profile list that is not an array migrates nothing and does not throw', async () => {
    localStorage.setItem('resumeos_profiles_v1', '{"not":"an array"}');
    const result = await migrateV1ToV2();
    expect(result.migratedCount).toBe(0);
    expect(localStorage.getItem('resumeos_v1_migrated')).toBe('true');
  });

  it('a profile with broken JSON is reported as an error and not flagged as migrated', async () => {
    localStorage.setItem('resumeos_profiles_v1', '{broken');
    const result = await migrateV1ToV2();
    expect(result.errors.join(' ')).toMatch(/Failed to migrate profiles/);
    expect(localStorage.getItem('resumeos_v1_migrated')).toBeNull();
  });

  it('needsMigration is true only for v1 data that has not been migrated', () => {
    expect(needsMigration()).toBe(false);
    localStorage.setItem('resumeos_state_v1', '{}');
    expect(needsMigration()).toBe(true);
    localStorage.setItem('resumeos_v1_migrated', 'true');
    expect(needsMigration()).toBe(false);
  });

  it('runMigrationOnStartup does nothing when there is no v1 data', async () => {
    expect(await runMigrationOnStartup()).toBeNull();
    localStorage.setItem('resumeos_profiles_v1', JSON.stringify([PROFILE]));
    const result = await runMigrationOnStartup();
    expect(result?.migratedCount).toBe(1);
  });

  it('restoreFromV1Backup puts the v1 keys back and clears the migrated flag', async () => {
    localStorage.setItem('resumeos_profiles_v1', JSON.stringify([PROFILE]));
    localStorage.setItem('resumeos_history_v1', '[]');
    await migrateV1ToV2();
    localStorage.removeItem('resumeos_profiles_v1');
    expect(restoreFromV1Backup()).toBe(true);
    expect(localStorage.getItem('resumeos_profiles_v1')).toContain('Old Person');
    expect(localStorage.getItem('resumeos_v1_migrated')).toBeNull();
  });

  it('negative: restoring with no backup returns false', () => {
    localStorage.clear();
    expect(getV1Backup()).toBeNull();
    expect(restoreFromV1Backup()).toBe(false);
  });
});
