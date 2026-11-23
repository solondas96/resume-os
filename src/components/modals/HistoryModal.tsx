import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { X, Clock, RotateCcw, Trash2 } from 'lucide-react';

export const HistoryModal: React.FC = () => {
  const { activeModal, setActiveModal, revisions, restoreRevision, deleteRevision } = useResumeStoreV2();

  if (activeModal !== 'history') return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-xl w-full shadow-lifted flex flex-col max-h-[80vh] transition-colors duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Clock className="w-4 h-4 text-brand-text" />
            <span>Revision History</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {revisions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              No previous revisions saved yet. Edits and exports automatically create snapshots here.
            </div>
          ) : (
            revisions.map((rev) => (
              <div
                key={rev.id}
                className="bg-background border border-border rounded-xl p-3 flex items-center justify-between hover:bg-muted/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{rev.title}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded capitalize">
                      {rev.theme}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-border"
                      style={{ backgroundColor: rev.accentColor }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(rev.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>{rev.markdown.length} chars</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (confirm('Restore this revision? Your current version is saved as a snapshot first.')) {
                        restoreRevision(rev);
                        setActiveModal(null);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition"
                  >
                    <RotateCcw className="w-3 h-3 text-brand-text" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => deleteRevision(rev.id)}
                    title="Delete snapshot"
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end bg-card">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
