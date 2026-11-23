// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { backupReminderDue, planRestore, clearAppLocalStorage, parseBackup, BACKUP_REMINDER_DAYS } from './dataSafety';
import { markdownToResume } from '../model/serialize';
import { Resume } from '../model/resume';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-23T12:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * DAY).toISOString();
const resume = (title = 'Jane'): Resume => markdownToResume(`# ${title}\n`, title);

describe('backupReminderDue', () => {
  it('positive: due when there are resumes and no backup has ever been made', () => {
    expect(backupReminderDue(null, 1, now)).toBe(true);
  });

  it('positive: due once the last backup is 7 days old or more', () => {
    expect(backupReminderDue(daysAgo(BACKUP_REMINDER_DAYS), 2, now)).toBe(true);
  });

  it('negative: not due within 7 days, and not when there is nothing to back up', () => {
    expect(backupReminderDue(daysAgo(6), 2, now)).toBe(false);
    expect(backupReminderDue(null, 0, now)).toBe(false);
  });

  it('an unreadable backup time counts as never backed up', () => {
    expect(backupReminderDue('not a date', 1, now)).toBe(true);
  });
});

describe('planRestore', () => {
  it('positive: resumes with new ids are added as they are', () => {
    const incoming = [resume('Jane')];
    const plan = planRestore([], incoming);
    expect(plan.map((p) => p.action)).toEqual(['add']);
    expect(plan[0].resume.id).toBe(incoming[0].id);
  });

  it('a resume whose id already exists is restored as a copy with a new id and a "(restored)" title', () => {
    const existing = resume('Jane');
    const plan = planRestore([existing], [existing]);
    expect(plan[0].action).toBe('copy');
    expect(plan[0].resume.id).not.toBe(existing.id);
    expect(plan[0].resume.meta.title).toBe(`${existing.meta.title} (restored)`);
  });

  it('negative: nothing already here is replaced (the original resume is still in the list)', () => {
    const existing = resume('Jane');
    const plan = planRestore([existing], [existing, resume('Sam')]);
    expect(plan.filter((p) => p.action === 'add').length).toBe(1);
    expect(plan.map((p) => p.resume.id)).not.toContain(existing.id);
  });
});

describe('parseBackup (moved to dataSafety, same behaviour)', () => {
  it('negative: a file from another app is refused with a reason', () => {
    const r = parseBackup(JSON.stringify({ app: 'Other', version: 1, resumes: [] }));
    expect(r.ok).toBe(false);
  });
});

describe('clearAppLocalStorage', () => {
  beforeEach(() => localStorage.clear());

  it('positive: removes this app\'s keys and keeps anything else', () => {
    localStorage.setItem('resumeos_state_v1', '{}');
    localStorage.setItem('resume_abc', '{}');
    localStorage.setItem('setting_pageSize', '"A4"');
    localStorage.setItem('some_other_site_key', 'keep');
    clearAppLocalStorage();
    expect(localStorage.getItem('resumeos_state_v1')).toBeNull();
    expect(localStorage.getItem('resume_abc')).toBeNull();
    expect(localStorage.getItem('setting_pageSize')).toBeNull();
    expect(localStorage.getItem('some_other_site_key')).toBe('keep');
  });
});
