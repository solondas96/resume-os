/**
 * Tailoring proposals for the job in the match panel. Each change is a diff with
 * Accept / Reject. Nothing changes until "Apply accepted changes" is pressed.
 * Changes apply to the tailored copy only, never to the original.
 */

import React, { useMemo, useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { tailoringProposals, applyAccepted, jobIdOf, Proposal } from '../../intelligence/tailor';

type Decision = 'accept' | 'reject';

const DiffLines: React.FC<{ before: string[]; after: string[] }> = ({ before, after }) => (
  <div className="font-mono text-[11px] leading-relaxed space-y-0.5 mt-2" aria-label="Change preview">
    {before.map((line, i) => (
      <div key={`b${i}`} className="text-destructive line-through decoration-destructive/40 break-words">− {line}</div>
    ))}
    {after.map((line, i) => (
      <div key={`a${i}`} className="text-emerald-700 dark:text-emerald-400 break-words">+ {line}</div>
    ))}
  </div>
);

export const TailorSection: React.FC = () => {
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const jd = useResumeStoreV2((s) => s.targetJobDescription);
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const jobId = jd.trim() ? jobIdOf(jd) : '';
  const isTailoredCopy = !!currentResume && !!jobId && currentResume.meta.targetJobId === jobId;

  const proposals = useMemo<Proposal[]>(
    () => (currentResume && jd.trim() ? tailoringProposals(currentResume, jd) : []),
    [currentResume, jd]
  );
  const changes = proposals.filter((p) => p.kind !== 'gap');
  const gaps = proposals.filter((p) => p.kind === 'gap');
  const acceptedIds = new Set(changes.filter((p) => decisions[p.id] === 'accept').map((p) => p.id));

  if (!jd.trim()) return null;

  if (!isTailoredCopy) {
    return (
      <p className="text-xs text-muted-foreground">
        Create the tailored copy first. Changes are then made to the copy, and your original stays as it is.
      </p>
    );
  }

  const apply = () => {
    if (acceptedIds.size === 0) return;
    const ids = new Set(acceptedIds);
    updateModel((r) => applyAccepted(r, proposals, ids));
    setDecisions({});
  };

  // Pressing the same choice again clears it
  const decide = (id: string, value: Decision) =>
    setDecisions((d) => {
      const next = { ...d };
      if (d[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });

  return (
    <div className="space-y-4">
      {changes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing to reorder or hide: the resume already reads in this job's order.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{changes.length} proposed change{changes.length === 1 ? '' : 's'}</span>
            <button
              type="button"
              onClick={() => setDecisions(Object.fromEntries(changes.map((p) => [p.id, 'accept' as Decision])))}
              className="text-xs text-brand hover:underline min-h-[32px]"
            >
              Accept all
            </button>
          </div>
          <ul className="space-y-3" aria-label="Proposed changes">
            {changes.map((p) => {
              const decision = decisions[p.id];
              return (
                <li key={p.id} className="border border-border rounded-lg p-3 bg-background">
                  <div className="text-xs font-medium text-foreground">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.why}</div>
                  <DiffLines before={p.before} after={p.after} />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      aria-pressed={decision === 'accept'}
                      onClick={() => decide(p.id, 'accept')}
                      className={`px-2.5 py-1 rounded-md text-xs min-h-[32px] ${decision === 'accept' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      aria-pressed={decision === 'reject'}
                      onClick={() => decide(p.id, 'reject')}
                      className={`px-2.5 py-1 rounded-md text-xs min-h-[32px] ${decision === 'reject' ? 'bg-destructive text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            disabled={acceptedIds.size === 0}
            onClick={apply}
            className="w-full px-4 py-2 bg-primary text-primary-foreground disabled:opacity-40 text-xs font-medium rounded-lg hover:opacity-90 transition"
          >
            Apply {acceptedIds.size} accepted change{acceptedIds.size === 1 ? '' : 's'}
          </button>
        </>
      )}

      {gaps.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground">Gaps to consider</div>
          <ul className="space-y-2">
            {gaps.map((g) => (
              <li key={g.id} className="text-xs">
                <div className="text-foreground">{g.title}</div>
                <div className="text-[11px] text-muted-foreground">{g.why}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
