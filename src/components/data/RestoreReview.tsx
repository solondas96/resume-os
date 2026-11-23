/**
 * Restore from a backup file, shown before anything is changed: what is in the file, and what
 * will be added. Nothing already here is replaced; a clashing resume is restored as a copy.
 */

import React, { useMemo, useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { parseBackup, planRestore } from '../../services/dataSafety';

export const RestoreReview: React.FC<{ text: string; onCancel: () => void }> = ({ text, onCancel }) => {
  const resumes = useResumeStoreV2((s) => s.resumes);
  const applications = useResumeStoreV2((s) => s.applications);
  const restoreBackup = useResumeStoreV2((s) => s.restoreBackup);
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseBackup(text), [text]);

  if (!parsed.ok) {
    return (
      <div role="alert" className="space-y-2 text-sm">
        <p className="text-destructive">This file cannot be restored. {parsed.error}</p>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium">
          Choose another file
        </button>
      </div>
    );
  }

  const plan = planRestore(resumes, parsed.resumes);
  const copies = plan.filter((p) => p.action === 'copy').length;
  const knownApps = new Set(applications.map((a) => a.id));
  const newApps = parsed.applications.filter((a) => !knownApps.has(a.id)).length;

  const confirm = async () => {
    setBusy(true);
    await restoreBackup(parsed.resumes, parsed.applications);
    setBusy(false);
  };

  return (
    <section aria-label="Restore preview" className="space-y-3 text-sm">
      <h3 className="font-semibold text-foreground">Restore from this backup?</h3>
      <p className="text-muted-foreground text-xs">
        The file has {parsed.resumes.length} resume{parsed.resumes.length === 1 ? '' : 's'}. {plan.length - copies} will be added as they are.
        {copies > 0 ? ` ${copies} already exist here, so they will be restored as copies with "(restored)" in the name.` : ''} Nothing here will be replaced.
      </p>
      <ul className="text-xs text-foreground list-disc pl-5 space-y-0.5">
        {parsed.resumes.map((r) => (
          <li key={r.id}>
            {r.basics.name || 'Unnamed resume'} <span className="text-muted-foreground">({r.meta.title})</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {newApps} job application{newApps === 1 ? '' : 's'} will be added.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40"
        >
          {busy ? 'Restoring…' : 'Restore these'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium">
          Cancel
        </button>
      </div>
    </section>
  );
};
