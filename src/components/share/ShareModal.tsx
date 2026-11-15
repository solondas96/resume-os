import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { getShareableUrl } from '../../utils/shareResume';

export const ShareModal: React.FC = () => {
  const {
    documentTitle,
    markdown,
    theme,
    accentColor,
    fontSize,
    marginSize,
    lineHeight,
    shareModalOpen,
    setShareModalOpen,
    setRecruiterViewMode,
  } = useResumeStore();

  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!shareModalOpen) return '';
    return getShareableUrl({
      title: documentTitle,
      markdown,
      theme,
      accentColor,
      fontSize,
      marginSize,
      lineHeight,
    });
  }, [shareModalOpen, documentTitle, markdown, theme, accentColor, fontSize, marginSize, lineHeight]);

  if (!shareModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewRecruiterView = () => {
    setShareModalOpen(false);
    window.location.hash = shareUrl.split('#')[1] || '';
    setRecruiterViewMode(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
              <Share2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Share Web Resume</h2>
              <p className="text-xs text-muted-foreground">Recruiter-ready direct online portfolio link</p>
            </div>
          </div>
          <button
            onClick={() => setShareModalOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-accent/40 border border-brand/20 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-muted-foreground">
              <strong className="text-foreground font-medium block">100% Client-Side & Private</strong>
              The resume data is encoded directly into the URL fragment. No data is stored on external servers or tracked by third parties.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Shareable Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground font-mono truncate focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand text-white text-xs font-medium rounded-xl hover:bg-brand-hover transition active:scale-[0.98] shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border">
            <button
              onClick={handlePreviewRecruiterView}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Recruiter View</span>
            </button>
            <button
              onClick={() => setShareModalOpen(false)}
              className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
