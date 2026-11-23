/**
 * A gentle reminder to download a backup, when there are resumes and the last backup is a week
 * old or more (or there has never been one). Dismissed for the session with "Later".
 */

import React, { useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { backupReminderDue, downloadBackupFile } from '../../services/dataSafety';

export const BackupReminder: React.FC = () => {
  const resumes = useResumeStoreV2((s) => s.resumes);
  const applications = useResumeStoreV2((s) => s.applications);
  const coverLetterMarkdown = useResumeStoreV2((s) => s.coverLetterMarkdown);
  const lastBackupAt = useResumeStoreV2((s) => s.lastBackupAt);
  const markBackup = useResumeStoreV2((s) => s.markBackup);
  const [later, setLater] = useState(false);

  if (later || !backupReminderDue(lastBackupAt, resumes.length)) return null;

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
        <button type="button" onClick={() => setLater(true)} className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium">
          Later
        </button>
      </div>
    </div>
  );
};
