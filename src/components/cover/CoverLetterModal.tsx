/**
 * Cover letter generator: fills a structured template from the current resume
 * and the company/role, then opens it in the cover letter workspace.
 */

import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { generateCoverLetterTemplate, coverLetterToMarkdown } from '../../services/coverLetterGenerator';

export const CoverLetterModal: React.FC = () => {
  const activeModal = useResumeStoreV2((s) => s.activeModal);
  const setActiveModal = useResumeStoreV2((s) => s.setActiveModal);
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const setCoverLetterMarkdown = useResumeStoreV2((s) => s.setCoverLetterMarkdown);
  const setWorkspaceMode = useResumeStoreV2((s) => s.setWorkspaceMode);
  const targetRole = currentResume?.meta.targetRole ?? '';

  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');

  if (activeModal !== 'cover-letter') return null;

  const canGenerate = !!currentResume && company.trim().length > 0 && position.trim().length > 0;

  const handleGenerate = () => {
    if (!currentResume) return;
    const data = generateCoverLetterTemplate(currentResume, company.trim(), position.trim());
    setCoverLetterMarkdown(coverLetterToMarkdown(data));
    setWorkspaceMode('cover-letter');
    setActiveModal(null);
    setCompany('');
    setPosition('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-lifted flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <FileText className="w-4 h-4 text-brand" />
            <span>Generate Cover Letter</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition"
            aria-label="Close cover letter generator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Builds a template from your resume's contact details and top achievements. Placeholders in
            [brackets] are for you to fill in.
          </p>
          <label className="block text-xs">
            <span className="block font-medium text-foreground mb-1">Company</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="block text-xs">
            <span className="block font-medium text-foreground mb-1">Position</span>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={targetRole || 'e.g. Staff Software Engineer'}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
            />
          </label>
          {!currentResume && <p className="text-xs text-destructive">Create a resume first.</p>}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="px-4 py-1.5 bg-primary text-primary-foreground disabled:opacity-40 text-xs font-medium rounded-lg hover:opacity-90 transition"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};
