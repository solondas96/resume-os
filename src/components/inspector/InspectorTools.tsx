/**
 * Inspector sections for the Milestone 3 tools: ATS preview, seniority check,
 * and the bullet builder. All computed from the resume model on the fly.
 */

import React, { useMemo, useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { buildAtsPreview } from '../../intelligence/ats';
import { assessSeniority, levelLabel, SeniorityLevel } from '../../intelligence/seniority';
import { composeBullet, Intent, INTENT_VERBS } from '../../intelligence/bulletBuilder';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="p-5 border-b border-border space-y-3">
    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
    {children}
  </section>
);

export const AtsPreviewSection: React.FC = () => {
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const preview = useMemo(() => (currentResume ? buildAtsPreview(currentResume) : null), [currentResume]);
  if (!preview) return null;
  return (
    <Section title="What applicant tracking software sees">
      <div className="text-[11px] text-muted-foreground">
        Detected sections: {preview.detectedSections.join(', ') || 'none'}
      </div>
      {preview.problems.length > 0 ? (
        <ul className="space-y-2">
          {preview.problems.map((p, i) => (
            <li key={`${p.rule}-${i}`} className="text-xs">
              <div className="text-foreground">{p.message}</div>
              <div className="text-[11px] text-muted-foreground">{p.why}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-muted-foreground">No parsing problems found.</div>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Plain text in reading order</summary>
        <pre className="mt-2 max-h-56 overflow-auto bg-background border border-border rounded-lg p-2 whitespace-pre-wrap font-mono text-[11px]">{preview.text}</pre>
      </details>
    </Section>
  );
};

const TARGETS: (SeniorityLevel | '')[] = ['', 'senior', 'staff', 'principal'];

export const SenioritySection: React.FC = () => {
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const [target, setTarget] = useState<SeniorityLevel | ''>('');
  const result = useMemo(
    () => (currentResume ? assessSeniority(currentResume, target || undefined) : null),
    [currentResume, target]
  );
  if (!result) return null;
  return (
    <Section title="Seniority">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">Reads as: <strong>{result.label}</strong></span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as SeniorityLevel | '')}
          className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground"
          aria-label="Target level"
        >
          {TARGETS.map((t) => (
            <option key={t || 'none'} value={t}>{t ? `Target: ${levelLabel(t)}` : 'No target level'}</option>
          ))}
        </select>
      </div>
      {target && result.missing.length === 0 && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400">The resume shows the signals expected for this level.</div>
      )}
      {result.missing.map((m) => (
        <div key={m.signal} className="text-xs space-y-0.5">
          <div className="text-foreground">Add more {m.signal} signals ({m.have} of {m.need} expected)</div>
          <div className="text-[11px] text-muted-foreground italic">For example: “{m.example}”</div>
        </div>
      ))}
    </Section>
  );
};

export const BulletBuilderSection: React.FC = () => {
  const [intent, setIntent] = useState<Intent>('improve');
  const [verb, setVerb] = useState('');
  const [did, setDid] = useState('');
  const [change, setChange] = useState('');
  const [how, setHow] = useState('');
  const [copied, setCopied] = useState(false);

  const composed = did.trim() ? composeBullet({ intent, verb, did, change, how }) : null;

  const copy = async () => {
    if (!composed) return;
    try {
      await navigator.clipboard.writeText(`- ${composed.text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const input = 'w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30';

  return (
    <Section title="Bullet builder">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span className="text-muted-foreground">Intent</span>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)} className={input}>
            {(Object.keys(INTENT_VERBS) as Intent[]).map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground">Verb (optional)</span>
          <input value={verb} onChange={(e) => setVerb(e.target.value)} placeholder={INTENT_VERBS[intent].join(' / ')} className={input} />
        </label>
      </div>
      <label className="block text-xs space-y-1">
        <span className="text-muted-foreground">What did you do?</span>
        <input value={did} onChange={(e) => setDid(e.target.value)} className={input} />
      </label>
      <label className="block text-xs space-y-1">
        <span className="text-muted-foreground">What changed, by how much?</span>
        <input value={change} onChange={(e) => setChange(e.target.value)} className={input} />
      </label>
      <label className="block text-xs space-y-1">
        <span className="text-muted-foreground">How?</span>
        <input value={how} onChange={(e) => setHow(e.target.value)} className={input} />
      </label>

      {composed && (
        <div className="bg-background border border-border rounded-lg p-3 space-y-2">
          <p className="text-xs text-foreground leading-relaxed">{composed.text}</p>
          {composed.prompt && <p className="text-[11px] text-amber-700 dark:text-amber-400">{composed.prompt}</p>}
          <button onClick={copy} className="text-xs px-3 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition">
            {copied ? 'Copied' : 'Copy as a bullet'}
          </button>
        </div>
      )}
    </Section>
  );
};
