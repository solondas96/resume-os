/**
 * Data safety: when to remind the user to back up, how a restore is planned, storage status,
 * and deleting everything in this browser. Pure rules are kept apart from the browser calls.
 */

import { Resume, newResumeId } from '../model/resume';
import type { JobApplication } from '../model/tracker';

/** Version of the backup file. Bump it when the shape changes. */
export const BACKUP_VERSION = 1;

/** Read a backup file's text. Returns the resumes and applications, or why it cannot be used. */
export function parseBackup(text: string): { ok: true; resumes: Resume[]; applications: JobApplication[]; coverLetterMarkdown: string } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  const b = data as { app?: string; version?: number; resumes?: Resume[]; applications?: JobApplication[]; coverLetterMarkdown?: string };
  if (b.app !== 'ResumeLabs') return { ok: false, error: 'This is not a ResumeLabs backup.' };
  if (b.version !== BACKUP_VERSION) return { ok: false, error: `Unsupported backup version ${b.version}.` };
  if (!Array.isArray(b.resumes)) return { ok: false, error: 'The backup has no resumes.' };
  return { ok: true, resumes: b.resumes, applications: b.applications ?? [], coverLetterMarkdown: b.coverLetterMarkdown ?? '' };
}


export const BACKUP_REMINDER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Remind to back up when there are resumes and no backup in the last 7 days (or never) */
export function backupReminderDue(lastBackupAt: string | null, resumeCount: number, now: Date = new Date()): boolean {
  if (resumeCount === 0) return false;
  if (!lastBackupAt) return true;
  const last = Date.parse(lastBackupAt);
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= BACKUP_REMINDER_DAYS * DAY_MS;
}

export interface RestoreItem {
  resume: Resume;
  /** "add": the id is new. "copy": the id already exists here, so the restored copy gets a new id */
  action: 'add' | 'copy';
}

/**
 * Plan a restore. Nothing is overwritten: a resume whose id already exists here is restored as a
 * copy with a new id and a "(restored)" title.
 */
export function planRestore(current: Resume[], incoming: Resume[]): RestoreItem[] {
  const taken = new Set(current.map((r) => r.id));
  return incoming.map((resume) => {
    if (!taken.has(resume.id)) {
      taken.add(resume.id);
      return { resume, action: 'add' as const };
    }
    const copy: Resume = { ...resume, id: newResumeId(), meta: { ...resume.meta, title: `${resume.meta.title} (restored)` } };
    taken.add(copy.id);
    return { resume: copy, action: 'copy' as const };
  });
}

export interface StorageStatus {
  usedBytes: number;
  quotaBytes: number;
}

/** How much this site uses in the browser, if the browser says */
export async function storageStatus(): Promise<StorageStatus | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (usage === undefined || quota === undefined) return null;
    return { usedBytes: usage, quotaBytes: quota };
  } catch {
    return null;
  }
}

/**
 * Ask the browser to keep this data (not clear it under pressure). Returns whether it is kept.
 * Chrome and Firefox decide; Safari may grant it only for installed apps.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** The backup file for a set of resumes and applications (the same format as backup.json) */
export function backupJson(input: { resumes: Resume[]; applications: unknown[]; coverLetterMarkdown: string; version: number; exportedAt?: string }): string {
  return JSON.stringify(
    {
      app: 'ResumeLabs',
      version: input.version,
      exportedAt: input.exportedAt ?? new Date().toISOString(),
      resumes: input.resumes,
      applications: input.applications,
      coverLetterMarkdown: input.coverLetterMarkdown,
    },
    null,
    2,
  );
}

/** Keys this app keeps in localStorage (all start with these prefixes) */
// The fallback writes resume_, setting_ and revisions_ keys when IndexedDB is unavailable
export const APP_STORAGE_PREFIXES = ['resumeos', 'resumelabs', 'resume_', 'setting_', 'revisions_'];

/** Remove this app's local data from localStorage */
export function clearAppLocalStorage(): void {
  if (typeof localStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && APP_STORAGE_PREFIXES.some((p) => k.toLowerCase().startsWith(p))) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
}

/** Download a backup file now. Nothing is uploaded. Returns the file name. */
export function downloadBackupFile(input: { resumes: Resume[]; applications: unknown[]; coverLetterMarkdown: string }): string {
  const today = new Date().toISOString().slice(0, 10);
  const filename = `resumelabs-backup-${today}.json`;
  const blob = new Blob([backupJson({ ...input, version: BACKUP_VERSION })], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}
