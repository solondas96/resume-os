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
    <footer className="no-print h-8 bg-card border-t border-border flex items-center justify-between px-3 text-[11px] text-muted-foreground select-none z-30 flex-shrink-0 transition-colors">
      {/* Left: Editor Metrics & Autosave */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-muted-foreground/40">•</span>
          <span>{lineCount} lines</span>
        </div>

        <div className="h-3 w-[1px] bg-border mx-1" />

        {/* Autosave Indicator */}
        <div className="flex items-center gap-1.5 font-medium">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 text-brand animate-spin" />
              <span className="text-brand">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              <span>Saved</span>
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
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent border border-brand/30 text-accent-foreground font-medium font-mono"
            >
              <AlertTriangle className="w-3 h-3 text-brand" />
              <span>{pageCount} Pages (Spill)</span>
            </div>
            {!compactSpacing && (
              <button
                onClick={() => setCompactSpacing(true)}
                className="text-[10px] text-brand hover:underline flex items-center gap-0.5 font-medium"
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
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground font-mono"
          >
            <FileText className="w-3 h-3 text-brand" />
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
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <span className="w-10 text-center font-mono font-medium text-foreground">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => {
            setAutoFitZoom(false);
            setZoom(Math.min(1.5, Number((zoom + 0.1).toFixed(2))));
          }}
          title="Zoom In (Ctrl +)"
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="h-3 w-[1px] bg-border mx-0.5" />

        <button
          onClick={() => setAutoFitZoom(true)}
          title="Auto-Fit Canvas Width to Viewport"
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition font-medium ${
            autoFitZoom
              ? 'bg-accent text-accent-foreground border border-brand/30'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Maximize2 className="w-2.5 h-2.5" />
          <span>Fit</span>
        </button>
      </div>
    </footer>
  );
};
