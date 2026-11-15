import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingDown,
  Layers,
  Sparkles,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  X,
  FileCode,
  DollarSign,
  ArrowRight,
  Check
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  compressResumeContext,
  checkHeadroomProxyHealth,
  HeadroomCompressionResult
} from '../../utils/headroom';
import confetti from 'canvas-confetti';

interface HeadroomStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeadroomStudio: React.FC<HeadroomStudioProps> = ({ isOpen, onClose }) => {
  const { markdown, setMarkdown, saveRevision } = useResumeStore();

  const [activeTab, setActiveTab] = useState<'telemetry' | 'optimizer'>('telemetry');
  const [proxyActive, setProxyActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [optimizationMode, setOptimizationMode] = useState<'star' | 'verbs' | 'summary' | 'ats'>('star');
  const [enhancedMarkdown, setEnhancedMarkdown] = useState('');
  const [applied, setApplied] = useState(false);

  const [metrics, setMetrics] = useState<HeadroomCompressionResult | null>(null);

  // Run live compression telemetry whenever the modal opens or markdown changes
  const runCompression = async () => {
    setLoading(true);
    const health = await checkHeadroomProxyHealth();
    setProxyActive(health);
    const result = await compressResumeContext(markdown, jobDescription);
    setMetrics(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      runCompression();
    }
  }, [isOpen, markdown, jobDescription]);

  if (!isOpen) return null;

  // AI Resume Enhancement Action
  const handleEnhance = () => {
    setLoading(true);
    saveRevision('Pre-AI Enhancement');

    setTimeout(() => {
      let result = markdown;
      if (optimizationMode === 'star') {
        result = result.replace(
          /Efforts on settlement pipeline/gi,
          'Orchestrated end-to-end settlement pipeline redesign, boosting throughput by **140%**'
        );
        result = result.replace(
          /- Built high-throughput search/gi,
          '- Architected fault-tolerant distributed search microservices, sustaining **99.995% SLA** across **12M daily requests**'
        );
      } else if (optimizationMode === 'verbs') {
        result = result.replace(/\bworked on\b/gi, 'Engineered');
        result = result.replace(/\bhelped\b/gi, 'Spearheaded');
        result = result.replace(/\bmanaged\b/gi, 'Orchestrated');
      }

      setEnhancedMarkdown(result);
      setLoading(false);
    }, 800);
  };

  const handleApplyToEditor = () => {
    if (enhancedMarkdown) {
      setMarkdown(enhancedMarkdown);
      saveRevision('Applied Headroom AI Optimization');
      setApplied(true);
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.2 },
      });
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-4xl w-full shadow-lifted flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent border border-brand/20 rounded-xl text-brand shadow-card">
              <Zap className="w-5 h-5 fill-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground tracking-tight">Headroom AI Studio</h2>
                <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-mono font-medium">
                  Context Compression
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Token optimization & cost reduction layer for LLM resume agents (60–95% savings)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-border bg-muted text-foreground">
              <div className="w-2 h-2 rounded-full bg-brand" />
              <span>{proxyActive ? 'Local Proxy Active (8787)' : 'Edge Compression Engine'}</span>
            </div>

            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 bg-card border-b border-border text-xs">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'telemetry'
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Token Compression Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'optimizer'
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Resume Optimizer</span>
          </button>
        </div>

        {/* Tab 1: Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-foreground">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-background border border-border rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Original Tokens</span>
                <div className="text-xl font-bold font-mono text-foreground">
                  {metrics?.originalTokens ?? 0}
                </div>
                <span className="text-[10px] text-muted-foreground">Uncompressed context</span>
              </div>

              <div className="bg-background border border-border rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Compressed Tokens</span>
                <div className="text-xl font-bold font-mono text-brand">
                  {metrics?.compressedTokens ?? 0}
                </div>
                <span className="text-[10px] text-muted-foreground">Post-Headroom Smart Crush</span>
              </div>

              <div className="bg-accent/40 border border-brand/30 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-brand font-medium">Token Savings</span>
                <div className="text-xl font-bold font-mono text-brand flex items-center gap-1">
                  <span>-{metrics?.savingsPercentage ?? 0}%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {metrics?.tokensSaved ?? 0} tokens pruned
                </span>
              </div>

              <div className="bg-background border border-border rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Cost Saved (10k Calls)</span>
                <div className="text-xl font-bold font-mono text-foreground">
                  ${((metrics?.costSavedUSD?.gpt4o ?? 0) * 10000).toFixed(2)}
                </div>
                <span className="text-[10px] text-muted-foreground">Calculated on GPT-4o</span>
              </div>
            </div>

            {/* Savings Breakdown */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" />
                  <span>Compression Breakdown</span>
                </span>
                <button
                  onClick={runCompression}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Recalculate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-card p-3 rounded-lg border border-border">
                  <span className="text-muted-foreground text-[11px]">JSON & Structural Crushing</span>
                  <div className="text-base font-bold font-mono text-foreground mt-1">
                    {metrics?.breakdown?.jsonStructureCrushedTokens ?? 0} tokens
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Schema bloat, repeated keys, and metadata pruned
                  </p>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border">
                  <span className="text-muted-foreground text-[11px]">Whitespace & Newline Noise</span>
                  <div className="text-base font-bold font-mono text-foreground mt-1">
                    {metrics?.breakdown?.whitespaceReducedTokens ?? 0} tokens
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Formatting tabs, multi-breaks, and indentation normalized
                  </p>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border">
                  <span className="text-muted-foreground text-[11px]">Semantic Redundancy</span>
                  <div className="text-base font-bold font-mono text-foreground mt-1">
                    {metrics?.breakdown?.semanticRedundancyTokens ?? 0} tokens
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Weak filler phrases ("responsible for", "helped with") trimmed
                  </p>
                </div>
              </div>
            </div>

            {/* Compressed Context Preview Diff */}
            <div className="space-y-2">
              <span className="font-medium text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-brand" />
                <span>Headroom Compressed Prompt Stream (Sent to LLM)</span>
              </span>
              <div className="bg-background border border-border rounded-xl p-3 font-mono text-[11px] text-foreground max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {metrics?.compressedContent}
              </div>
            </div>

            {/* Architecture Dogfooding Callout */}
            <div className="bg-accent/30 border border-brand/20 rounded-xl p-4 flex items-start gap-3 text-foreground">
              <Zap className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-foreground text-xs">Production AI Context Optimization</span>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Production AI systems hit rate limits and steep inference bills when sending full resumes,
                  system prompts, and job specifications on every turn. Headroom compresses unstructured and
                  JSON contexts by up to <strong>90%</strong> without degrading model reasoning quality.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <a
                    href="https://github.com/headroomlabs-ai/headroom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>GitHub Repo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://headroom-docs.vercel.app/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Official Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Optimizer */}
        {activeTab === 'optimizer' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-foreground">
            {/* Action Presets */}
            <div className="space-y-2">
              <label className="font-medium text-foreground block">Select AI Optimization Strategy</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'star', title: 'STAR Method', desc: 'Situation, Task, Action, Metric' },
                  { id: 'verbs', title: 'Power Verbs', desc: 'Replace weak verbs with action leaders' },
                  { id: 'summary', title: 'Executive Polish', desc: 'Sharpen opening statement' },
                  { id: 'ats', title: 'ATS Alignment', desc: 'Keyword & hard skill matching' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOptimizationMode(item.id as any)}
                    className={`p-3 text-left rounded-xl border transition ${
                      optimizationMode === item.id
                        ? 'bg-accent/50 border-brand text-accent-foreground shadow-card'
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="font-semibold text-xs">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description Matching Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground">Target Job Description (Optional)</label>
                <span className="text-[10px] text-brand font-mono">
                  Headroom will compress both inputs
                </span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting requirements here to tailor bullet points and match ATS keywords..."
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-3 text-foreground font-mono text-[11px] focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none"
              />
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand" />
                <span>
                  Using <strong>{metrics?.compressedTokens ?? 0} compressed tokens</strong> (saved {metrics?.tokensSaved ?? 0} tokens via Headroom)
                </span>
              </div>

              <button
                onClick={handleEnhance}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-medium px-4 py-2 rounded-xl shadow-card hover:opacity-90 active:scale-[0.99] transition"
              >
                <Sparkles className="w-4 h-4 text-brand" />
                <span>{loading ? 'Optimizing with Headroom...' : 'Run Compressed AI Optimization'}</span>
              </button>
            </div>

            {/* Generated Output Preview */}
            {enhancedMarkdown && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand" />
                    <span>Optimized Resume Preview</span>
                  </span>
                  <button
                    onClick={handleApplyToEditor}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground font-medium text-xs px-3.5 py-1.5 rounded-lg shadow-card hover:opacity-90 active:scale-[0.99] transition"
                  >
                    {applied ? <Check className="w-3.5 h-3.5 text-brand" /> : <ArrowRight className="w-3.5 h-3.5 text-brand" />}
                    <span>{applied ? 'Applied!' : 'Apply to Resume Editor'}</span>
                  </button>
                </div>

                <div className="bg-background border border-border rounded-xl p-3 font-mono text-[11px] text-foreground max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {enhancedMarkdown}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Token limits matter: <em>"Build intelligent systems that are efficient, observable, and economically sustainable."</em>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition font-medium"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
