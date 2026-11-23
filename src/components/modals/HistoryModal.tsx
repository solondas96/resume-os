/**
 * Saved versions of this resume, shown in the inspector's History tab.
 * Restoring a version first saves the current one, so nothing is lost.
 */

import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';

export const HistoryPanel: React.FC = () => {
  const { revisions, restoreRevision, deleteRevision, closeInspector } = useResumeStoreV2();

  return (
    <div className="p-4 space-y-2">
      {revisions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-xs">
          No saved versions yet. Edits and downloads save a copy here automatically.
        </div>
      ) : (
        revisions.map((rev) => (
          <div
            key={rev.id}
            className="bg-background border border-border rounded-xl p-3 flex items-center justify-between hover:bg-muted/40 transition"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground truncate">{rev.title}</span>
                <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded capitalize">
                  {rev.theme}
                </span>
                <div className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: rev.accentColor }} />
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>{new Date(rev.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (confirm('Restore this version? Your current version is saved first.')) {
                    restoreRevision(rev);
                    closeInspector();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition"
              >
                <RotateCcw className="w-3 h-3 text-brand-text" />
                <span>Restore</span>
              </button>
              <button
                onClick={() => deleteRevision(rev.id)}
                title="Delete this saved version"
                aria-label={`Delete saved version from ${new Date(rev.timestamp).toLocaleString()}`}
                className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
