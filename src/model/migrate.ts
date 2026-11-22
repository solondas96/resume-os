/**
 * Schema Migration: v1 (flat markdown) → v2 (structured model)
 * Lossless migration with backup preservation
 */

import { Resume } from './resume';
import { markdownToResume } from './serialize';
import { saveResume } from '../services/persistence';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  backupCreated: boolean;
  errors: string[];
}

/**
 * Migrate all v1 data from localStorage to v2 format (IndexedDB)
 * Creates a backup before migration
 */
export async function migrateV1ToV2(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    backupCreated: false,
    errors: [],
  };

  if (typeof localStorage === 'undefined') {
    result.success = false;
    result.errors.push('localStorage not available');
    return result;
  }

  try {
    // 1. Create backup of all v1 data
    const v1Backup = {
      timestamp: Date.now(),
      data: {
        state: localStorage.getItem('resumeos_state_v1'),
        profiles: localStorage.getItem('resumeos_profiles_v1'),
        history: localStorage.getItem('resumeos_history_v1'),
        coverLetter: localStorage.getItem('resumeos_cover_letter_v1'),
        jobDesc: localStorage.getItem('resumeos_job_desc_v1'),
      },
    };

    try {
      localStorage.setItem('resumeos_v1_backup', JSON.stringify(v1Backup));
      result.backupCreated = true;
    } catch (e) {
      result.errors.push(`Failed to create backup: ${e}`);
    }

    // 2. Migrate profiles (resumes). Each one is saved through persistence.
    const profilesData = localStorage.getItem('resumeos_profiles_v1');
    let allSaved = true;
    if (profilesData) {
      try {
        const profiles = JSON.parse(profilesData);
        if (Array.isArray(profiles)) {
          for (let i = 0; i < profiles.length; i++) {
            const migrated = migrateProfile(profiles[i], i);
            if (!migrated) {
              allSaved = false;
              result.errors.push(`Profile ${i} could not be converted`);
              continue;
            }
            const saved = await saveResume(migrated);
            if (saved) {
              result.migratedCount++;
            } else {
              allSaved = false;
              result.errors.push(`Failed to save migrated resume "${migrated.basics.name || i}"`);
            }
          }
        }
      } catch (e) {
        allSaved = false;
        result.errors.push(`Failed to migrate profiles: ${e}`);
      }
    }

    // 3. Mark v1 as migrated ONLY when every resume was saved.
    // The v1 data is kept either way so nothing is lost.
    if (allSaved) {
      localStorage.setItem('resumeos_v1_migrated', 'true');
    }

    result.success = allSaved;
    return result;
  } catch (e) {
    result.success = false;
    result.errors.push(`Migration failed: ${e}`);
    return result;
  }
}

/**
 * Convert a v1 profile to v2 Resume model
 */
function migrateProfile(v1Profile: any, index: number): Resume | null {
  try {
    const markdown = v1Profile.markdown || '';
    const title = v1Profile.title || 'Untitled Resume';

    const resume = markdownToResume(markdown, title);
    // Deterministic id so a retried migration overwrites instead of duplicating
    resume.id = `v1-${v1Profile.id ?? index}`;

    // Preserve design settings
    resume.meta.targetRole = v1Profile.targetRole;
    resume.meta.updatedAt = v1Profile.updatedAt || Date.now();

    resume.design.template = v1Profile.theme || 'modern';
    resume.design.accent = v1Profile.accentColor || '#c96442';
    resume.design.fontSize = v1Profile.fontSize || 'medium';
    resume.design.margin = v1Profile.marginSize || 'normal';
    resume.design.lineHeight = v1Profile.lineHeight || 'normal';

    return resume;
  } catch (e) {
    console.error(`Failed to migrate profile:`, e);
    return null;
  }
}

/**
 * Startup hook: run the v1 → v2 migration once, if needed.
 */
export async function runMigrationOnStartup(): Promise<MigrationResult | null> {
  if (!needsMigration()) return null;
  return migrateV1ToV2();
}

/**
 * Check if v1 data exists and needs migration
 */
export function needsMigration(): boolean {
  if (typeof localStorage === 'undefined') return false;

  const v1Exists = !!localStorage.getItem('resumeos_state_v1') || !!localStorage.getItem('resumeos_profiles_v1');
  const alreadyMigrated = localStorage.getItem('resumeos_v1_migrated') === 'true';

  return v1Exists && !alreadyMigrated;
}

/**
 * Get the v1 backup (for recovery/inspection)
 */
export function getV1Backup(): any {
  if (typeof localStorage === 'undefined') return null;

  const backup = localStorage.getItem('resumeos_v1_backup');
  return backup ? JSON.parse(backup) : null;
}

/**
 * Restore from v1 backup (for recovery)
 */
export function restoreFromV1Backup(): boolean {
  if (typeof localStorage === 'undefined') return false;

  const backup = getV1Backup();
  if (!backup || !backup.data) return false;

  try {
    if (backup.data.state) {
      localStorage.setItem('resumeos_state_v1', backup.data.state);
    }
    if (backup.data.profiles) {
      localStorage.setItem('resumeos_profiles_v1', backup.data.profiles);
    }
    if (backup.data.history) {
      localStorage.setItem('resumeos_history_v1', backup.data.history);
    }
    if (backup.data.coverLetter) {
      localStorage.setItem('resumeos_cover_letter_v1', backup.data.coverLetter);
    }
    if (backup.data.jobDesc) {
      localStorage.setItem('resumeos_job_desc_v1', backup.data.jobDesc);
    }

    localStorage.removeItem('resumeos_v1_migrated');
    return true;
  } catch (e) {
    console.error('Failed to restore from v1 backup:', e);
    return false;
  }
}
