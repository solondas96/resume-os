/**
 * Job match side panel: paste a job description, see how the resume covers it,
 * then create a tailored copy or track the application.
 * Uses intelligence/jobMatcher.ts (deterministic, no AI).
 */

import React, { useMemo, useState } from 'react';
import { X, Target, Copy, Plus } from 'lucide-react';
import { matchJobDescription } from '../../intelligence/jobMatcher';
import { jobIdOf } from '../../intelligence/tailor';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { TailorSection } from './TailorSection';

const STRENGTH_STYLE: Record<string, string> = {
  strong: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  moderate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  weak: 'bg-muted text-muted-foreground',
  missing: 'bg-destructive/10 text-destructive',
};

export const JobMatchPanel: React.FC = () => {
  const activeSidePanel = useResumeStoreV2((s) => s.activeSidePanel);
  const setActiveSidePanel = useResumeStoreV2((s) => s.setActiveSidePanel);
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const jd = useResumeStoreV2((s) => s.targetJobDescription);
  const setJd = useResumeStoreV2((s) => s.setTargetJobDescription);
  const addApplication = useResumeStoreV2((s) => s.addApplication);
  const tailorFor = useResumeStoreV2((s) => s.tailorFor);
  const updateApplication = useResumeStoreV2((s) => s.updateApplication);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [tracked, setTracked] = useState(false);

  const result = useMemo(
    () => (currentResume && jd.trim() ? matchJobDescription(jd, currentResume) : null),
    [currentResume, jd]
  );

  if (activeSidePanel !== 'match') return null;

  const handleTailor = () => {
    if (!currentResume || !jd.trim()) return;
    tailorFor(jd);
  };

  const handleTrack = () => {
    if (!company.trim() && !role.trim()) return;
    const id = addApplication(company.trim() || 'Unknown company', role.trim() || 'Unknown role');
    // Link to the tailored copy when this resume is one for this job
    const linked = currentResume && currentResume.meta.targetJobId === jobIdOf(jd) ? currentResume.id : undefined;
    updateApplication(id, { ...(result ? { matchScore: result.score } : {}), ...(linked ? { tailoredResumeId: linked } : {}) });
    setTracked(true);
    setTimeout(() => setTracked(false), 1500);
  };

  const mustHaves = result?.requirements.filter((r) => r.type === 'must-have') ?? [];
  const niceToHaves = result?.requirements.filter((r) => r.type === 'nice-to-have') ?? [];

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card border-l border-border shadow-lifted z-40 flex flex-col no-print">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Job Match</h2>
            <p className="text-xs text-muted-foreground">See how this resume covers a job posting</p>
          </div>
        </div>
        <button
          onClick={() => setActiveSidePanel('none')}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          aria-label="Close job match"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Job description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={7}
            placeholder={'Paste the posting. Put requirements under "Required" and extras under "Nice to have", as bullets.'}
            className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground font-mono focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none leading-relaxed"
          />
        </div>

        {!result && (
          <p className="text-xs text-muted-foreground">Paste a job description to see your match score.</p>
        )}

        {result && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Match score</div>
                <div className="text-3xl font-bold font-mono text-foreground">{result.score}%</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{result.matchedCount} of {result.requirements.length} requirements covered</div>
                <div>{result.missingCount} missing</div>
              </div>
            </div>

            <RequirementList title="Required" items={mustHaves} />
            {niceToHaves.length > 0 && <RequirementList title="Nice to have" items={niceToHaves} />}

            {result.skills.missing.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground mb-1.5">Skills not found in your resume</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills.missing.slice(0, 20).map((skill) => (
                    <span key={skill} className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="border-t border-border pt-5 space-y-3">
          <button
            onClick={handleTailor}
            disabled={!currentResume || !jd.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground disabled:opacity-40 text-xs font-medium rounded-lg hover:opacity-90 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            Tailor for this job (creates a linked copy)
          </button>

          <div className="space-y-3">
            <div className="text-xs font-medium text-foreground">Tailoring</div>
            <TailorSection />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">Track this application</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role"
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={!company.trim() && !role.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 text-xs font-medium rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              {tracked ? 'Added to tracker' : 'Add to tracker'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const RequirementList: React.FC<{
  title: string;
  items: { text: string; strength: string; evidence?: { bulletText: string } }[];
}> = ({ title, items }) => {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-medium text-foreground mb-2">{title}</div>
      <ul className="space-y-2">
        {items.map((req, i) => (
          <li key={i} className="text-xs">
            <div className="flex items-start gap-2">
              <span className={`shrink-0 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${STRENGTH_STYLE[req.strength]}`}>
                {req.strength}
              </span>
              <span className="text-foreground leading-snug">{req.text}</span>
            </div>
            {req.evidence && (
              <div className="ml-[3.25rem] mt-1 text-[11px] text-muted-foreground italic">“{req.evidence.bulletText}”</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
