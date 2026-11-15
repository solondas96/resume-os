import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { X, Clock, RotateCcw } from 'lucide-react';

export const HistoryModal: React.FC = () => {
  const { activeModal, setActiveModal, history, restoreRevision } = useResumeStore();

  if (activeModal !== 'history') return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Revision History</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No previous revisions saved yet. Edits and exports automatically create snapshots here.
            </div>
          ) : (
            history.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{rev.title}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded capitalize">
                      {rev.theme}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: rev.accentColor }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(rev.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>{rev.markdown.length} chars</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Restore this revision into the editor? Current unsaved work will be overwritten.')) {
                      restoreRevision(rev);
                      setActiveModal(null);
                    }
                  }}
                  className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-md border border-blue-500/30 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
