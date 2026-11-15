import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Loader2,
  FileText,
  AlertTriangle,
  Sliders
} from 'lucide-react';

export const StatusBar: React.FC = () => {
  const {
    markdown,
    pageCount,
    isSaving,
    zoom,
    setZoom,
    autoFitZoom,
    setAutoFitZoom,
    compactSpacing,
    setCompactSpacing
  } = useResumeStore();

  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = markdown.split('\n').length;
  const isSpill = pageCount > 1;

  return (
    <footer className="no-print h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-3 text-[11px] text-slate-400 select-none z-30 flex-shrink-0">
      {/* Left: Editor Metrics & Autosave */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-slate-600">•</span>
          <span>{lineCount} lines</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800 mx-1" />

        {/* Autosave Indicator */}
        <div className="flex items-center gap-1.5 font-medium">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="text-amber-400">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Page Count & Spill Indicator */}
      <div className="flex items-center gap-2">
        {isSpill ? (
          <div className="flex items-center gap-2">
            <div
              title={`${pageCount} A4 pages. Content spills onto multiple pages.`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold font-mono"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>{pageCount} Pages (Spill)</span>
            </div>
            {!compactSpacing && (
              <button
                onClick={() => setCompactSpacing(true)}
                className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5"
                title="Enable compact line-height and margins to help fit onto 1 page"
              >
                <Sliders className="w-2.5 h-2.5" />
                <span>Try Compact</span>
              </button>
            )}
          </div>
        ) : (
          <div
            title="Clean single-page resume layout"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium font-mono"
          >
            <FileText className="w-3 h-3 text-blue-400" />
            <span>1 Page</span>
          </div>
        )}
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            setAutoFitZoom(false);
            setZoom(Math.max(0.4, Number((zoom - 0.1).toFixed(2))));
          }}
          title="Zoom Out (Ctrl -)"
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <span className="w-10 text-center font-mono font-medium text-slate-300">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => {
            setAutoFitZoom(false);
            setZoom(Math.min(1.5, Number((zoom + 0.1).toFixed(2))));
          }}
          title="Zoom In (Ctrl +)"
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />

        <button
          onClick={() => setAutoFitZoom(true)}
          title="Auto-Fit Canvas Width to Viewport"
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition font-medium ${
            autoFitZoom
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Maximize2 className="w-2.5 h-2.5" />
          <span>Fit</span>
        </button>
      </div>
    </footer>
  );
};
