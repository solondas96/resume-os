import React, { useMemo, useState } from 'react';
import {
  X,
  Target,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';

// Common technical and functional stop words to ignore
const STOP_WORDS = new Set([
  'and', 'the', 'with', 'for', 'you', 'will', 'that', 'our', 'are', 'your', 'about',
  'from', 'this', 'have', 'work', 'team', 'teams', 'skills', 'experience', 'ability',
  'years', 'strong', 'role', 'looking', 'candidate', 'company', 'working', 'responsibilities'
]);

export const JobTailorPanel: React.FC = () => {
  const {
    markdown,
    activeSidePanel,
    setActiveSidePanel,
    targetJobDescription,
    setTargetJobDescription,
  } = useResumeStoreV2();

  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const isOpen = activeSidePanel === 'tailor';

  // Extract keywords and compute match against resume markdown
  const matchResult = useMemo(() => {
    if (!targetJobDescription.trim()) {
      return {
        score: 0,
        matched: [] as string[],
        missing: [] as string[],
        totalKeywords: 0,
      };
    }

    // Tokenize Job Description
    const jdTokens = targetJobDescription
      .toLowerCase()
      .replace(/[^a-z0-9#+.\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    // Frequency map
    const freq: Record<string, number> = {};
    for (const token of jdTokens) {
      freq[token] = (freq[token] || 0) + 1;
    }

    // Sort by frequency and take top 25 meaningful keywords
    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([word]) => word);

    const resumeLower = markdown.toLowerCase();

    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of topKeywords) {
      // Escape for regex whole word match
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(resumeLower)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    const total = topKeywords.length;
    const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);

    return {
      score,
      matched,
      missing,
      totalKeywords: total,
    };
  }, [targetJobDescription, markdown]);

  if (!isOpen) return null;

  const handleCopy = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1200);
  };

  const scoreColor =
    matchResult.score >= 75
      ? 'text-emerald-600 dark:text-emerald-400'
      : matchResult.score >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
            <Target className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Job Match Tailor</h2>
            <p className="text-xs text-muted-foreground">Side-by-side ATS keyword scanner</p>
          </div>
        </div>
        <button
          onClick={() => setActiveSidePanel('none')}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Target Job Description Input */}
      <div className="p-4 border-b border-border bg-muted/10 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Target Job Description</label>
          {targetJobDescription && (
            <button
              onClick={() => setTargetJobDescription('')}
              className="text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          value={targetJobDescription}
          onChange={(e) => setTargetJobDescription(e.target.value)}
          placeholder="Paste job posting text here (e.g. responsibilities, required qualifications, tech stack)..."
          rows={4}
          className="w-full p-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-brand resize-none"
        />
      </div>

      {/* Real-time Match Scorecard */}
      {targetJobDescription ? (
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">ATS Keyword Match</span>
            <div className={`text-2xl font-bold font-mono tracking-tight ${scoreColor}`}>
              {matchResult.score}%
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                {matchResult.matched.length}
              </strong>{' '}
              found
            </div>
            <div>
              <strong className="text-rose-500 font-mono font-semibold">{matchResult.missing.length}</strong> missing
            </div>
          </div>
        </div>
      ) : null}

      {/* Keywords Breakdown */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!targetJobDescription ? (
          <div className="text-center py-14 text-muted-foreground text-xs space-y-2">
            <Target className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p>Paste a job description above to inspect keyword overlap in real-time as you edit.</p>
          </div>
        ) : (
          <>
            {/* Missing Keywords */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  Missing Keywords ({matchResult.missing.length})
                </span>
                <span className="text-[11px] text-muted-foreground">Click to copy</span>
              </div>

              {matchResult.missing.length === 0 ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  🎉 Outstanding! Your resume contains all top keywords identified from the job description.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missing.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => handleCopy(kw)}
                      className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground border border-border transition active:scale-[0.98]"
                    >
                      <span className="font-mono text-[11px]">{kw}</span>
                      {copiedKeyword === kw ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matched Keywords */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Matched Keywords ({matchResult.matched.length})
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {matchResult.matched.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-mono text-[11px]"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
        Live sync: as you type missing terms in the editor, this scorecard updates instantly without page reload.
      </div>
    </div>
  );
};
