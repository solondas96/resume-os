/**
 * A gentle reminder, shown when the app opens, to download a backup if there are resumes and the last
 * backup is a week old or more (or there has never been one). "Later" dismisses it.
 */

import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { downloadBackupFile } from '../../services/dataSafety';

export const BackupReminder: React.FC = () => {
  const resumes = useResumeStoreV2((s) => s.resumes);
  const applications = useResumeStoreV2((s) => s.applications);
  const coverLetterMarkdown = useResumeStoreV2((s) => s.coverLetterMarkdown);
  const markBackup = useResumeStoreV2((s) => s.markBackup);
  const open = useResumeStoreV2((s) => s.backupReminderOpen);
  const setOpen = useResumeStoreV2((s) => s.setBackupReminderOpen);

  if (!open) return null;

  const download = () => {
    downloadBackupFile({ resumes, applications, coverLetterMarkdown });
    markBackup();
  };

  return (
    <div
      role="region"
      aria-label="Backup reminder"
      className="no-print fixed bottom-16 left-4 z-30 max-w-xs bg-card border border-border rounded-xl shadow-lifted p-3 space-y-2"
    >
      <p className="text-xs text-foreground">
        Your resumes live only in this browser. Download a backup to keep a copy.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={download} className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
          Download a backup
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium">
          Later
        </button>
      </div>
    </div>
  );
};
