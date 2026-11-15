import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { X, Upload, FileText } from 'lucide-react';

export const ImportModal: React.FC = () => {
  const { activeModal, setActiveModal, setMarkdown, saveRevision } = useResumeStore();
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import Markdown Resume</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Upload .md File
            </label>
            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 transition group">
              <FileText className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition mb-2" />
              <span className="text-xs text-slate-300 font-medium">Click to select Markdown file</span>
              <span className="text-[11px] text-slate-500 mt-1">Supports standard .md and CommonMark</span>
              <input
                type="file"
                accept=".md,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Or Paste Markdown</span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          {/* Paste Text Area */}
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste Markdown contents here..."
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition"
          >
            Cancel
          </button>
          <button
            disabled={!pasteText.trim()}
            onClick={handlePasteSubmit}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-medium rounded-md transition"
          >
            Load into Editor
          </button>
        </div>
      </div>
    </div>
  );
};
