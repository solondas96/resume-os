/**
 * Your data, in the inspector's History tab: how much this browser holds, a backup to download,
 * a restore from a file, and deleting everything (with a typed confirmation).
 */

import React, { useEffect, useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import {
  downloadBackupFile,
  storageStatus,
  StorageStatus,
  BACKUP_REMINDER_DAYS,
} from '../../services/dataSafety';
import { RestoreReview } from './RestoreReview';

const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 0);
const CONFIRM_WORD = 'DELETE';

export const DataPanel: React.FC = () => {
  const resumes = useResumeStoreV2((s) => s.resumes);
  const applications = useResumeStoreV2((s) => s.applications);
  const coverLetterMarkdown = useResumeStoreV2((s) => s.coverLetterMarkdown);
  const lastBackupAt = useResumeStoreV2((s) => s.lastBackupAt);
  const markBackup = useResumeStoreV2((s) => s.markBackup);
  const deleteAllData = useResumeStoreV2((s) => s.deleteAllData);

  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const kept = useResumeStoreV2((s) => s.storageKept);
  const [restoreText, setRestoreText] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void storageStatus().then(setStorage);
  }, []);

  const download = () => {
    const name = downloadBackupFile({ resumes, applications, coverLetterMarkdown });
    markBackup();
    setMessage(`Saved ${name}. Keep it somewhere safe.`);
  };

  const readFile = async (file: File) => {
    setRestoreText(await file.text());
  };

  const wipe = async () => {
    setDeleting(true);
    await deleteAllData();
    window.location.reload();
  };

  return (
    <div className="p-4 space-y-5 text-sm">
      <section aria-label="Storage" className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Where your data is</h3>
        <p className="text-foreground text-xs">
          Everything is stored only in this browser. Nothing is uploaded.
        </p>
        {storage && (
          <p className="text-xs text-muted-foreground">
            Using {mb(storage.usedBytes)} MB of about {mb(storage.quotaBytes)} MB available to this site.
          </p>
        )}
        {kept === null && (
          <p className="text-xs text-muted-foreground">The browser is asked to keep this data when your first resume is created.</p>
        )}
        {kept !== null && (
          <p className="text-xs text-muted-foreground">
            {kept
              ? 'The browser keeps this data unless you clear it.'
              : 'The browser may clear this data when storage runs low. Download a backup to be safe.'}
          </p>
        )}
      </section>

      <section aria-label="Backup" className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Backup</h3>
        <p className="text-xs text-muted-foreground">
          Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : 'none yet'}. We remind you after {BACKUP_REMINDER_DAYS} days.
        </p>
        <button
          type="button"
          onClick={download}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
        >
          Download a backup
        </button>
        {message && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{message}</p>}
      </section>

      <section aria-label="Restore" className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Restore</h3>
        {restoreText === null ? (
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground cursor-pointer">
            <span>Restore from a backup file</span>
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Choose a backup file to restore"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) void readFile(f);
              }}
            />
          </label>
        ) : (
          <RestoreReview text={restoreText} onCancel={() => setRestoreText(null)} />
        )}
      </section>

      <section aria-label="Delete all data" className="space-y-2 border-t border-border pt-4">
        <h3 className="text-xs font-medium text-destructive uppercase tracking-wider">Delete everything</h3>
        <p className="text-xs text-muted-foreground">
          This removes every resume, saved version and application from this browser. It cannot be undone unless you have a backup.
        </p>
        {!deleting && (
          <>
            <label className="block text-xs text-foreground space-y-1">
              <span>Type {CONFIRM_WORD} to confirm</span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                aria-label={`Type ${CONFIRM_WORD} to confirm deleting everything`}
              />
            </label>
            <button
              type="button"
              disabled={typed !== CONFIRM_WORD}
              onClick={wipe}
              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium disabled:opacity-40"
            >
              Delete all my data
            </button>
          </>
        )}
        {deleting && <p className="text-xs text-muted-foreground">Deleting…</p>}
      </section>
    </div>
  );
};
