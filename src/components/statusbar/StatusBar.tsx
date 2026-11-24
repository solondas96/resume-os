import React, { useMemo } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Loader2,
  FileText,
  AlertTriangle,
  Sparkles,
  Target
} from 'lucide-react';
import { analyzeBullets } from '../../utils/bulletLinter';
import { HealthBadge } from '../health/HealthPanel';

/** "Saved · just now", "Saved · 3m ago", or "Saved" before the first save */
export function savedLabel(at: number | null, now: number = Date.now()): string {
  if (at === null) return 'Saved';
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 30) return 'Saved · just now';
  if (s < 3600) return `Saved · ${Math.round(s / 60)}m ago`;
  return `Saved · ${Math.round(s / 3600)}h ago`;
}

export const StatusBar: React.FC = () => {
  const {
    markdown,
    workspaceMode,
    coverLetterMarkdown,
    pageCount,
    isSaving,
    lastSavedAt,
    zoom,
    setZoom,
    autoFitZoom,
    setAutoFitZoom,
    fitToOnePage,
    inspectorTab,
    openInspector,
    closeInspector,
  } = useResumeStoreV2();

  const activeContent = workspaceMode === 'cover-letter' ? coverLetterMarkdown : markdown;
  const wordCount = activeContent.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = activeContent.split('\n').length;
  const isSpill = pageCount > 1;

  const linterResult = useMemo(() => {
    return analyzeBullets(markdown);
  }, [markdown]);

  return (
    <footer className="no-print h-8 bg-card border-t border-border flex items-center justify-between px-3 text-[11px] text-muted-foreground select-none z-30 shrink-0 transition-colors">
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
              <Loader2 className="w-3 h-3 text-brand-text animate-spin" />
              <span className="text-brand-text">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              <span>{savedLabel(lastSavedAt)}</span>
            </>
          )}
        </div>

        {/* Bullet Linter Pill */}
        {workspaceMode === 'resume' && (
          <>
            <div className="h-3 w-[1px] bg-border mx-1 hidden sm:block" />
            <button
              onClick={() => (inspectorTab === 'health' ? closeInspector() : openInspector('health'))}
              title="Open bullet checks: weak verbs and missing numbers"
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition font-mono ${
                inspectorTab === 'health'
                  ? 'bg-accent text-accent-foreground border border-brand/30'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3 h-3 text-brand-text" />
              <span>Impact: {linterResult.overallScore}%</span>
            </button>
          </>
        )}

        {/* Health badge: opens the inspector breakdown */}
        <div className="h-3 w-[1px] bg-border mx-1 hidden sm:block" />
        <HealthBadge
          active={inspectorTab === 'health'}
          onClick={() => (inspectorTab === 'health' ? closeInspector() : openInspector('health'))}
        />

        {/* Job Match Pill */}
        <button
          onClick={() => (inspectorTab === 'match' ? closeInspector() : openInspector('match'))}
          title="Open Job Match"
          className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition font-mono ${
            inspectorTab === 'match'
              ? 'bg-accent text-accent-foreground border border-brand/30'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="w-3 h-3 text-brand-text" />
          <span>Job Match</span>
        </button>
      </div>

      {/* Center: Page Count & Auto-Fit to 1 Page */}
      <div className="flex items-center gap-2">
        {isSpill ? (
          <div className="flex items-center gap-2">
            <div
              title={`${pageCount} A4 pages. Content spills onto multiple pages.`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent border border-brand/30 text-accent-foreground font-medium font-mono"
            >
              <AlertTriangle className="w-3 h-3 text-brand-text" />
              <span>{pageCount} Pages (Spill)</span>
            </div>

            <button
              onClick={fitToOnePage}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-button text-on-pencil font-medium text-[10px] hover:bg-brand-hover transition active:scale-[0.98]"
              title="Automatically optimize line-height, margins and font size to pull content onto 1 page"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Auto-Fit 1 Page</span>
            </button>
          </div>
        ) : (
          <div
            title="Clean single-page resume layout"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground font-mono"
          >
            <FileText className="w-3 h-3 text-brand-text" />
            <span>1 Page (Fit)</span>
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
