/**
 * Inspector sections for the Milestone 3 tools: ATS preview, seniority check,
 * and the bullet builder. All computed from the resume model on the fly.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { readoutFromHtml, printHtml } from '../../intelligence/atsReadout';
import { layoutProblems, pdfProblems, AtsProblem } from '../../intelligence/atsCompare';
import { importResume } from '../../services/importResume';
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
  const readout = useMemo(() => (currentResume ? readoutFromHtml(printHtml(currentResume)) : null), [currentResume]);
  const problems = useMemo(
    () => (currentResume && readout ? layoutProblems(currentResume, readout) : []),
    [currentResume, readout]
  );
  const [pdf, setPdf] = useState<null | { text: string; headings: string[]; problems: AtsProblem[]; error?: string }>(null);
  const [checking, setChecking] = useState(false);

  if (!currentResume || !readout) return null;

  const checkPdf = async (file: File) => {
    setChecking(true);
    const result = await importResume(file);
    setChecking(false);
    if (!result.success || !result.pageText) {
      setPdf({ text: '', headings: [], problems: [], error: result.errors[0] ?? 'The file could not be read.' });
      return;
    }
    const headings = result.structure?.sections.map((s) => s.title) ?? [];
    setPdf({
      text: result.pageText,
      headings,
      problems: pdfProblems(currentResume, {
        text: result.pageText,
        detectedHeadings: headings,
        email: result.resume?.basics.email || undefined,
        phone: result.resume?.basics.phone || undefined,
      }),
    });
  };

  return (
    <Section title="What applicant tracking software sees">
      <p className="text-[11px] text-muted-foreground">
        Estimated from the print layout: the text a parser reads, in reading order. A PDF you export is checked below.
      </p>
      <div className="text-[11px] text-muted-foreground">
        Detected sections: {readout.headings.join(', ') || 'none'}
      </div>
      {problems.length > 0 ? (
        <ul className="space-y-2">
          {problems.map((p, i) => (
            <li key={`${p.rule}-${i}`} className="text-xs">
              <div className={p.severity === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}>{p.message}</div>
              <div className="text-[11px] text-muted-foreground">{p.why}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-muted-foreground">No layout problems found.</div>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Plain text in reading order</summary>
        <pre className="mt-2 max-h-56 overflow-auto bg-background border border-border rounded-lg p-2 whitespace-pre-wrap font-mono text-[11px]">{readout.lines.join('\n')}</pre>
      </details>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="text-xs font-medium text-foreground">Check a PDF you exported</div>
        <p className="text-[11px] text-muted-foreground">
          Use Print (Ctrl/Cmd+P), choose "Save as PDF", then pick that file here. It is read with the same PDF reader as the importer, in your browser.
        </p>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs text-foreground cursor-pointer">
          <span>{checking ? 'Reading…' : 'Choose a PDF'}</span>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            aria-label="Choose an exported PDF to check"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) void checkPdf(f);
            }}
          />
        </label>
        {pdf?.error && <div className="text-xs text-destructive">{pdf.error}</div>}
        {pdf && !pdf.error && (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground">Headings the PDF reader found: {pdf.headings.join(', ') || 'none'}</div>
            {pdf.problems.length === 0 ? (
              <div className="text-xs text-emerald-700 dark:text-emerald-400">The PDF text matches your resume, in order.</div>
            ) : (
              <ul className="space-y-2">
                {pdf.problems.map((p, i) => (
                  <li key={`${p.rule}-${i}`} className="text-xs">
                    <div className="text-amber-700 dark:text-amber-400">{p.message}</div>
                    <div className="text-[11px] text-muted-foreground">{p.why}</div>
                  </li>
                ))}
              </ul>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Text the PDF reader found</summary>
              <pre aria-label="Text the PDF reader found" className="mt-2 max-h-56 overflow-auto bg-background border border-border rounded-lg p-2 whitespace-pre-wrap font-mono text-[11px]">{pdf.text}</pre>
            </details>
          </div>
        )}
      </div>
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
        <div className="text-xs text-emerald-700 dark:text-emerald-400">The resume shows the signals expected for this level.</div>
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
  const bulletSeed = useResumeStoreV2((s) => s.bulletSeed);
  const [intent, setIntent] = useState<Intent>('improve');
  const [verb, setVerb] = useState('');
  const [did, setDid] = useState(bulletSeed);
  // "Improve" on a bullet pre-fills the builder with that bullet's text
  useEffect(() => {
    if (bulletSeed) setDid(bulletSeed);
  }, [bulletSeed]);
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
