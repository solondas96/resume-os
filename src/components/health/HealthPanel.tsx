/**
 * Resume health score, shown in the status bar (badge) and the inspector (breakdown).
 * Scores come from the deterministic rules in intelligence/healthScore.ts.
 */

import React, { useMemo } from 'react';
import { calculateHealthScore } from '../../intelligence/healthScore';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';

function scoreTone(score: number): string {
  if (score >= 80) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-destructive';
}

export function useHealth() {
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  return useMemo(() => (currentResume ? calculateHealthScore(currentResume) : null), [currentResume]);
}

export const HealthBadge: React.FC<{ onClick: () => void; active: boolean }> = ({ onClick, active }) => {
  const health = useHealth();
  if (!health) return null;
  return (
    <button
      onClick={onClick}
      title="Resume health: open the inspector for the breakdown and fixes"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition font-mono ${
        active ? 'bg-accent text-accent-foreground border border-brand/30' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      <span>Health</span>
      <span className={`font-semibold ${scoreTone(health.overallScore)}`}>{health.overallScore}</span>
    </button>
  );
};

export const HealthBreakdown: React.FC = () => {
  const health = useHealth();
  if (!health) return null;

  return (
    <section className="p-5 border-b border-border space-y-4" aria-label="Resume health">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resume health</span>
        <span className={`text-2xl font-bold font-mono ${scoreTone(health.overallScore)}`}>{health.overallScore}/100</span>
      </div>

      <div className="space-y-3">
        {health.categories.map((cat) => (
          <div key={cat.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-foreground font-medium">{cat.name}</span>
              <span className={`font-mono ${scoreTone(cat.score)}`}>{cat.score}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${cat.score}%` }} />
            </div>
            {cat.issues.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground list-disc pl-4">
                {cat.issues.slice(0, 2).map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {health.topIssues.length > 0 && (
        <div>
          <div className="text-xs font-medium text-foreground mb-1">Top fixes</div>
          <ol className="text-[11px] text-muted-foreground list-decimal pl-4 space-y-0.5">
            {health.topIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
};
