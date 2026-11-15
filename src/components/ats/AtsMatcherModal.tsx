import React, { useState, useMemo } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  X,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  PlusCircle,
  Check,
  FileSearch
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

  // Extract key technical tokens & keywords from job description
  const analysis = useMemo(() => {
    if (!jobDescription.trim()) {
      return { score: 0, matched: [], missing: [], total: 0 };
    }

    // Tokenize JD into terms (words and common hyphenated/dotted terms like ci/cd, node.js, etc.)
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
      // Check if term exists as a word in resume
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                ATS Resume & Job Description Scanner
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                  100% In-Browser Privacy
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste a target job posting to scan for missing keywords, match density, and ATS pass score.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Job Description Input (5 cols) */}
          <div className="md:col-span-5 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Target Job Description
              </label>
              <button
                onClick={() => setJobDescription('')}
                className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job posting, required qualifications, or key skills here..."
              rows={14}
              className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-mono leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Tip: The ATS scanner automatically ignores common filler words and matches technical keywords against your resume.
            </p>
          </div>

          {/* Right: ATS Match Results (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-5">
            {/* Match Score Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 shadow-sm ${
                    analysis.score >= 70
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : analysis.score >= 45
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <span className="text-xl font-black leading-none">{analysis.score}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Match</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {analysis.score >= 75
                      ? 'Excellent ATS Alignment!'
                      : analysis.score >= 50
                      ? 'Good Match — A few gaps detected'
                      : 'Low Keyword Overlap'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Found <strong>{analysis.matched.length}</strong> matching keywords out of {analysis.total} key terms in the job posting.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleAppendMissingToResume}
                  disabled={analysis.missing.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                  title="Append top missing keywords to skills section"
                >
                  {appended ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  <span>{appended ? 'Appended!' : 'Append to Skills'}</span>
                </button>
                <button
                  onClick={handleCopyMissing}
                  disabled={analysis.missing.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Missing'}</span>
                </button>
              </div>
            </div>

            {/* Missing Keywords Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Missing Keywords ({analysis.missing.length})
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Recommend including in experience/skills</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl min-h-[90px] max-h-[140px] overflow-y-auto flex flex-wrap gap-1.5">
                {analysis.missing.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No missing keywords found! Fantastic job.</span>
                ) : (
                  analysis.missing.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 rounded text-[11px] font-mono"
                    >
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Matched Keywords Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Matched Keywords ({analysis.matched.length})
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Successfully detected in resume</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl min-h-[90px] max-h-[140px] overflow-y-auto flex flex-wrap gap-1.5">
                {analysis.matched.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No matching keywords yet.</span>
                ) : (
                  analysis.matched.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-mono"
                    >
                      ✓ {kw}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Target an ATS score of <strong>75%+</strong> for higher recruiter callback rates.</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
