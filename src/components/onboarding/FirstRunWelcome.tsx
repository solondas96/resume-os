/**
 * First-run welcome screen for new users
 * Three entry paths: upload resume, start from role, start blank
 */

import React, { useState } from 'react';
import { RestoreReview } from '../data/RestoreReview';
import { FileUp, Zap, Edit3, CheckCircle2 } from 'lucide-react';

interface FirstRunWelcomeProps {
  onUpload: (file: File) => void;
  onStartFromRole: () => void;
  onStartBlank: () => void;
  isLoading?: boolean;
}

export const FirstRunWelcome: React.FC<FirstRunWelcomeProps> = ({
  onUpload,
  onStartFromRole,
  onStartBlank,
  isLoading = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [restoreText, setRestoreText] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('word'))) {
      onUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Welcome to ResumeLabs
          </h1>
          <p className="text-lg text-muted-foreground">
            Beautiful, intelligent resumes built 100% in your browser
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-tick" />
            <span>Everything stays private. Nothing leaves your browser.</span>
          </div>
        </div>

        {/* What it does, in three points, and one Start */}
        <section aria-label="What ResumeLabs does" className="mb-8 space-y-4 text-center">
          <ul className="grid gap-2 text-sm text-foreground sm:grid-cols-3">
            <li className="rounded-xl border border-border bg-card p-3">Start from your current resume, a role, or a blank page.</li>
            <li className="rounded-xl border border-border bg-card p-3">See the page as it will be sent, with a health score and plain fixes.</li>
            <li className="rounded-xl border border-border bg-card p-3">Download a PDF that applicant tracking software can read.</li>
          </ul>
          <p className="text-xs text-muted-foreground">Your resumes stay in this browser. There is no account and nothing is uploaded.</p>
          <button
            type="button"
            onClick={() =>
              document.getElementById('start-options')?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start',
              })
            }
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Start
          </button>
        </section>

        {/* Three entry paths */}
        <div id="start-options" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Path 1: Upload Resume */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              dragOver
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
            }`}
          >
            <div className="p-8 text-center">
              <div className="mb-4 inline-block p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition">
                <FileUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Upload my resume</h3>
              <p className="text-sm text-muted-foreground mb-4">
                PDF or Word document
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="resume-upload"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? 'Uploading...' : 'Select file'}
              </label>
              <p className="text-xs text-muted-foreground mt-3">
                or drag & drop here
              </p>
            </div>
          </div>

          {/* Path 2: Start from Role */}
          <div
            onClick={onStartFromRole}
            className="group rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer p-8 text-center"
          >
            <div className="mb-4 inline-block p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Start from a role</h3>
            <p className="text-sm text-muted-foreground mb-6">
              10 curated templates for different positions
            </p>
            <button className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition">
              Browse roles
            </button>
          </div>

          {/* Path 3: Start Blank */}
          <div
            onClick={onStartBlank}
            className="group rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer p-8 text-center"
          >
            <div className="mb-4 inline-block p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition">
              <Edit3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Start blank</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Guided setup with helpful prompts
            </p>
            <button className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition">
              Create new
            </button>
          </div>
        </div>

        {/* Restore: a backup file from earlier, with a preview before anything changes */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {restoreText === null ? (
            <label className="cursor-pointer text-primary underline underline-offset-2">
              Have a backup? Restore it
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Choose a backup file to restore"
                onChange={async (e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f) setRestoreText(await f.text());
                }}
              />
            </label>
          ) : (
            <div className="max-w-md mx-auto text-left bg-card border border-border rounded-2xl p-5">
              <RestoreReview text={restoreText} onCancel={() => setRestoreText(null)} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            💾 Encrypted locally • 🚀 Lightning fast • 🔐 100% private
          </p>
        </div>
      </div>
    </div>
  );
};
