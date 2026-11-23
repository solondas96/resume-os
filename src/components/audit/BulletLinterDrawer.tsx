import { SenioritySection, AtsPreviewSection, BulletBuilderSection } from '../inspector/InspectorTools';
import { HealthBreakdown } from '../health/HealthPanel';
import React, { useMemo } from 'react';
import {
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { analyzeBullets, quickFixBulletVerb } from '../../utils/bulletLinter';

export const BulletLinterDrawer: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { markdown, setMarkdown, inspectorTab, closeInspector, saveRevision } = useResumeStoreV2();

  const isOpen = inspectorTab === 'health';

  const analysis = useMemo(() => {
    return analyzeBullets(markdown);
  }, [markdown]);

  if (!embedded && !isOpen) return null;

  const handleApplyFix = (rawBullet: string, weakVerb: string, replacement: string) => {
    saveRevision('Before Action Verb Quick Fix');
    const updated = quickFixBulletVerb(markdown, rawBullet, weakVerb, replacement);
    setMarkdown(updated);
  };

  const scoreColor =
    analysis.overallScore >= 80
      ? 'text-emerald-700 dark:text-emerald-400'
      : analysis.overallScore >= 60
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <div className={embedded ? 'flex flex-col min-h-0 flex-1' : 'no-print fixed z-40 bg-card shadow-2xl flex flex-col animate-in duration-200 motion-reduce:animate-none inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-border slide-in-from-bottom sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:border-t-0 sm:border-l sm:slide-in-from-right'}>
      {/* Drawer Header */}
      {!embedded && (
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
            <Sparkles className="w-4 h-4 text-brand-text" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Inspector</h2>
            <p className="text-xs text-muted-foreground">Health, weak verbs and missing numbers</p>
          </div>
        </div>
        <button
          onClick={() => closeInspector()}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      )}
      {/* One scrolling body: on a short screen every section stays reachable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      <HealthBreakdown />
      <SenioritySection />
      <AtsPreviewSection />
      <BulletBuilderSection />

      {/* Score Overview Card */}
      <div className="p-5 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Impact</span>
            <div className={`text-2xl font-bold tracking-tight font-mono ${scoreColor}`}>
              {analysis.overallScore}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground">Total Analyzed</span>
            <div className="text-sm font-semibold text-foreground font-mono">
              {analysis.totalBullets} bullets
            </div>
          </div>
        </div>

        {/* Quick stat chips */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">
            <div className="font-mono text-base font-bold">{analysis.strongBullets}</div>
            <div className="text-[10px]">Action Verbs</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 font-medium">
            <div className="font-mono text-base font-bold">{analysis.metricsBullets}</div>
            <div className="text-[10px]">Quantified</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
            <div className="font-mono text-base font-bold">{analysis.weakVerbBullets}</div>
            <div className="text-[10px]">Passive/Weak</div>
          </div>
        </div>
      </div>

      {/* Bullets List */}
      <div className="p-5 space-y-3.5">
        {analysis.bullets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            No bullet points found in work experience. Add lines starting with "-" to analyze.
          </div>
        ) : (
          analysis.bullets.map((bullet, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs transition ${
                bullet.status === 'strong'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : bullet.status === 'passive'
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {bullet.hasActionVerb && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                      ✓ {bullet.actionVerb}
                    </span>
                  )}
                  {bullet.hasMetric && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium">
                      {bullet.metrics.join(', ')}
                    </span>
                  )}
                  {bullet.weakVerb && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 font-medium">
                      Passive: "{bullet.weakVerb}"
                    </span>
                  )}
                  {!bullet.hasMetric && !bullet.weakVerb && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      Needs Quantifiable Metric
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                  {bullet.score}pts
                </span>
              </div>

              <p className="text-foreground leading-relaxed select-text">{bullet.cleanText}</p>

              {/* Quick fix suggestion if weak verb */}
              {bullet.weakVerb && bullet.suggestedVerb && (
                <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Suggest: <strong className="text-foreground">{bullet.suggestedVerb}</strong>
                  </span>
                  <button
                    onClick={() => handleApplyFix(bullet.raw, bullet.weakVerb!, bullet.suggestedVerb!)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-brand-button text-white rounded text-[11px] font-medium hover:bg-brand-hover transition active:scale-[0.98]"
                  >
                    <span>Replace Verb</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      </div>

      {/* Guidance Footer */}
      <div className="p-4 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">A simple formula for bullets:</p>
        <p className="text-[11px] leading-relaxed">
          "Accomplished <strong>[X]</strong> as measured by <strong>[Y]</strong>, by doing <strong>[Z]</strong>". Always quantify results with numbers, latency drops, or dollar volume.
        </p>
      </div>
    </div>
  );
};
