import React, { useState, useMemo } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  X,
  Target,
  Copy,
  PlusCircle,
  Check,
  FileSearch,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const COMMON_STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'you', 'our', 'will', 'are', 'that', 'this',
  'from', 'have', 'all', 'your', 'team', 'work', 'about', 'role', 'looking',
  'join', 'who', 'what', 'where', 'when', 'how', 'more', 'can', 'has', 'must',
  'should', 'their', 'them', 'they', 'plus', 'per', 'into', 'over', 'than',
  'such', 'like', 'help', 'each', 'other', 'also', 'some', 'well', 'both'
]);

const SAMPLE_JOB_DESCRIPTION = `Staff Software Engineer - Cloud Infrastructure & Core Platforms
We are seeking an experienced Staff Software Engineer to lead our distributed systems architecture.
Key Requirements:
- 7+ years of experience with Go, Python, or TypeScript in high-scale environments.
- Deep expertise with Kubernetes, Docker, gRPC, and microservices architecture.
- Hands-on experience with cloud platforms (AWS, GCP), Terraform, and CI/CD pipelines.
- Proven track record optimizing latency, throughput, and PostgreSQL / Redis database performance.
- Experience with Kafka event streams, distributed caching, and zero-downtime deployments.
- Strong leadership skills, mentoring senior engineers, and driving system design reviews.`;

export const AtsMatcherModal: React.FC = () => {
  const { activeModal, setActiveModal, markdown, setMarkdown, saveRevision } = useResumeStore();
  const [jobDescription, setJobDescription] = useState<string>(SAMPLE_JOB_DESCRIPTION);
  const [copied, setCopied] = useState(false);
  const [appended, setAppended] = useState(false);

  const isSample = jobDescription === SAMPLE_JOB_DESCRIPTION;

  // Extract key technical tokens & keywords from job description
  const analysis = useMemo(() => {
    if (!jobDescription.trim()) {
      return { score: 0, matched: [], missing: [], total: 0 };
    }

    // Tokenize JD into terms
    const rawTokens = jobDescription
      .toLowerCase()
      .replace(/[(),:;*•\-–—/]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2 && !COMMON_STOPWORDS.has(t) && !/^\d+$/.test(t));

    // Deduplicate tokens
    const uniqueTerms = Array.from(new Set(rawTokens));

    // Scan against resume markdown (lowercased)
    const resumeLower = markdown.toLowerCase();

    const matched: string[] = [];
    const missing: string[] = [];

    for (const term of uniqueTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(resumeLower)) {
        matched.push(term);
      } else {
        missing.push(term);
      }
    }

    const total = matched.length + missing.length;
    const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;

    return {
      score,
      matched,
      missing,
      total,
    };
  }, [jobDescription, markdown]);

  if (activeModal !== 'ats') return null;

  const handleCopyMissing = () => {
    navigator.clipboard.writeText(analysis.missing.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAppendMissingToResume = () => {
    if (analysis.missing.length === 0) return;

    saveRevision('Append missing ATS keywords');
    const pills = analysis.missing.slice(0, 8).map((k) => `\`${k.toUpperCase()}\``).join(' ');

    let updated = markdown;
    if (updated.includes('## Technical Skills') || updated.includes('## Skills')) {
      updated = updated.replace(
        /(##\s*(?:Technical\s+)?Skills[\s\S]*?)(\n##|\s*$)/,
        `$1\n- **Target Keywords:** ${pills}\n$2`
      );
    } else {
      updated += `\n\n## Target Keywords\n${pills}\n`;
    }

    setMarkdown(updated);
    setAppended(true);
    setTimeout(() => setAppended(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-lifted overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent text-accent-foreground border border-brand/20">
              <Target className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                ATS Resume & Job Description Scanner
                <span className="text-[10px] font-medium bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                  In-Browser Privacy
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Paste a target job posting to scan for missing keywords, match density, and ATS pass score.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Job Description Input (5 cols) */}
          <div className="md:col-span-5 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-brand" />
                Target Job Description
              </label>
              <button
                onClick={() => setJobDescription('')}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job posting, required qualifications, or key skills here..."
              rows={14}
              className="flex-1 w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none font-mono leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground">
              Tip: The ATS scanner automatically ignores common filler words and matches technical keywords against your resume.
            </p>
          </div>

          {/* Right: ATS Match Results (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-5">
            {/* Match Score Card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 border-brand bg-accent text-accent-foreground shadow-card">
                  <span className="text-xl font-bold leading-none">{analysis.score}%</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider mt-0.5">Match</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isSample && (
                      <span className="text-xs font-normal text-muted-foreground block mb-0.5">
                        [Example Preview]
                      </span>
                    )}
                    {analysis.score >= 75
                      ? 'Strong Keyword Overlap'
                      : analysis.score >= 50
                      ? 'Moderate Match — A few gaps detected'
                      : 'Low Keyword Overlap'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Found <strong>{analysis.matched.length}</strong> matching keywords out of {analysis.total} key terms in the job posting.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleAppendMissingToResume}
                  disabled={analysis.missing.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 active:scale-[0.99] transition shadow-card disabled:opacity-40"
                  title="Append top missing keywords to skills section"
                >
                  {appended ? <Check className="w-3.5 h-3.5 text-brand" /> : <PlusCircle className="w-3.5 h-3.5 text-brand" />}
                  <span>{appended ? 'Appended' : 'Append to Skills'}</span>
                </button>
                <button
                  onClick={handleCopyMissing}
                  disabled={analysis.missing.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-muted text-foreground text-xs font-medium transition border border-border disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span>{copied ? 'Copied' : 'Copy Missing'}</span>
                </button>
              </div>
            </div>

            {/* Keyword Match Tabs / Lists */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {/* Matched Keywords */}
              <div className="flex flex-col rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                    Matched Keywords ({analysis.matched.length})
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto mt-2 max-h-52 flex flex-wrap gap-1 content-start">
                  {analysis.matched.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic py-2">No matched keywords yet.</span>
                  ) : (
                    analysis.matched.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-foreground border border-border"
                      >
                        {kw}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="flex flex-col rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-brand" />
                    Missing Gaps ({analysis.missing.length})
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto mt-2 max-h-52 flex flex-wrap gap-1 content-start">
                  {analysis.missing.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic py-2">All keywords present!</span>
                  ) : (
                    analysis.missing.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-accent/60 text-accent-foreground border border-brand/20"
                      >
                        {kw}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Private local parsing: no text or job descriptions leave your browser.</span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
