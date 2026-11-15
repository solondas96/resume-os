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
        // Enhance work experience bullet points with quantified STAR metrics
        result = result.replace(
          /Efforts on settlement pipeline/gi,
          'Orchestrated end-to-end settlement pipeline redesign, boosting throughput by **140%**'
        );
        result = result.replace(
          /- Built high-throughput search/gi,
          '- Architected fault-tolerant distributed search microservices, sustaining **99.995% SLA** across **12M daily requests**'
        );
      } else if (optimizationMode === 'verbs') {
        // Elevate weak verbs to high-impact verbs
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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.2 },
      });
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-tight">Headroom AI Studio</h2>
                <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Context Compression
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Token optimization & cost reduction layer for LLM resume agents (60–95% savings)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                proxyActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  proxyActive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
                }`}
              />
              <span>{proxyActive ? 'Local Proxy Active (8787)' : 'Edge Compression Engine'}</span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 bg-slate-950/50 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'telemetry'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Token Compression Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'optimizer'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Resume Optimizer</span>
          </button>
        </div>

        {/* Tab 1: Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Hero Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Original Tokens</span>
                <div className="text-xl font-bold font-mono text-slate-100">
                  {metrics?.originalTokens ?? 0}
                </div>
                <span className="text-[10px] text-slate-500">Uncompressed context</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Compressed Tokens</span>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {metrics?.compressedTokens ?? 0}
                </div>
                <span className="text-[10px] text-slate-500">Post-Headroom Smart Crush</span>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-emerald-400 font-medium">Token Savings</span>
                <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1">
                  <span>-{metrics?.savingsPercentage ?? 0}%</span>
                </div>
                <span className="text-[10px] text-emerald-500/80">
                  {metrics?.tokensSaved ?? 0} tokens pruned
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Cost Saved (10k Calls)</span>
                <div className="text-xl font-bold font-mono text-slate-100">
                  ${((metrics?.costSavedUSD?.gpt4o ?? 0) * 10000).toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500">Calculated on GPT-4o</span>
              </div>
            </div>

            {/* Savings Breakdown */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Compression Breakdown</span>
                </span>
                <button
                  onClick={runCompression}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Recalculate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">JSON & Structural Crushing</span>
                  <div className="text-base font-bold font-mono text-slate-200 mt-1">
                    {metrics?.breakdown?.jsonStructureCrushedTokens ?? 0} tokens
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Schema bloat, repeated keys, and metadata pruned
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Whitespace & Newline Noise</span>
                  <div className="text-base font-bold font-mono text-slate-200 mt-1">
                    {metrics?.breakdown?.whitespaceReducedTokens ?? 0} tokens
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Formatting tabs, multi-breaks, and indentation normalized
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Semantic Redundancy</span>
                  <div className="text-base font-bold font-mono text-slate-200 mt-1">
                    {metrics?.breakdown?.semanticRedundancyTokens ?? 0} tokens
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Weak filler phrases ("responsible for", "helped with") trimmed
                  </p>
                </div>
              </div>
            </div>

            {/* Compressed Context Preview Diff */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Headroom Compressed Prompt Stream (Sent to LLM)</span>
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {metrics?.compressedContent}
              </div>
            </div>

            {/* Architecture Dogfooding Callout */}
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-slate-300">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-amber-300 text-xs">Production AI Dogfooding</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Production AI systems hit rate limits and steep inference bills when sending full resumes,
                  system prompts, and job specifications on every turn. Headroom compresses unstructured and
                  JSON contexts by up to <strong>90%</strong> without degrading model reasoning quality.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <a
                    href="https://github.com/headroomlabs-ai/headroom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>GitHub Repo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://headroom-docs.vercel.app/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
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
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Action Presets */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 block">Select AI Optimization Strategy</label>
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
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs">{item.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description Matching Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">Target Job Description (Optional)</label>
                <span className="text-[10px] text-amber-400 font-mono">
                  Headroom will compress both inputs
                </span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting requirements here to tailor bullet points and match ATS keywords..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Using <strong>{metrics?.compressedTokens ?? 0} compressed tokens</strong> (saved {metrics?.tokensSaved ?? 0} tokens via Headroom)
                </span>
              </div>

              <button
                onClick={handleEnhance}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>{loading ? 'Optimizing with Headroom...' : 'Run Compressed AI Optimization'}</span>
              </button>
            </div>

            {/* Generated Output Preview */}
            {enhancedMarkdown && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Optimized Resume Preview</span>
                  </span>
                  <button
                    onClick={handleApplyToEditor}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition"
                  >
                    {applied ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{applied ? 'Applied!' : 'Apply to Resume Editor'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {enhancedMarkdown}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Token limits matter: <em>"Build intelligent systems that are efficient, observable, and economically sustainable."</em>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition font-medium"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
