import React, { useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { X, Upload, FileText } from 'lucide-react';

export const ImportModal: React.FC = () => {
  const { activeModal, setActiveModal, setMarkdown, saveRevision } = useResumeStoreV2();
  const [pasteText, setPasteText] = useState('');

  if (activeModal !== 'import') return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        saveRevision('Snapshot before import');
        setMarkdown(content);
        setActiveModal(null);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    saveRevision('Snapshot before import');
    setMarkdown(pasteText);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-lifted flex flex-col transition-colors duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Upload className="w-4 h-4 text-brand" />
            <span>Import Markdown Resume</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Upload .md File
            </label>
            <label className="border-2 border-dashed border-border hover:border-brand rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/30 transition group">
              <FileText className="w-8 h-8 text-muted-foreground group-hover:text-brand transition mb-2" />
              <span className="text-xs text-foreground font-medium">Click to select Markdown file</span>
              <span className="text-[11px] text-muted-foreground mt-1">Supports standard .md and CommonMark</span>
              <input
                type="file"
                accept=".md,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-[1px] bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Or Paste Markdown</span>
            <div className="flex-1 h-[1px] bg-border" />
          </div>

          {/* Paste Text Area */}
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste Markdown contents here..."
              rows={6}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground font-mono focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2 bg-card">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>
          <button
            disabled={!pasteText.trim()}
            onClick={handlePasteSubmit}
            className="px-4 py-1.5 bg-primary text-primary-foreground disabled:opacity-40 disabled:pointer-events-none text-xs font-medium rounded-lg hover:opacity-90 active:scale-[0.99] transition shadow-card"
          >
            Import Document
          </button>
        </div>
      </div>
    </div>
  );
};
