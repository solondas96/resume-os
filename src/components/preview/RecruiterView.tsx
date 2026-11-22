import React from 'react';
import { Edit3, Printer } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { A4Canvas } from './A4Canvas';
import { ResumeLabsLogo } from '../brand/ResumeLabsLogo';

export const RecruiterView: React.FC = () => {
  const { documentTitle, setRecruiterViewMode } = useResumeStoreV2();

  const handlePrint = () => {
    window.print();
  };

  const handleOpenInEditor = () => {
    window.location.hash = '';
    setRecruiterViewMode(false);
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Top Bar for Recruiter */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-card/85 backdrop-blur-md border-b border-border shadow-xs no-print">
        <div className="flex items-center gap-3">
          <ResumeLabsLogo />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-xs font-medium text-foreground truncate max-w-xs sm:max-w-md">
            {documentTitle}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
            Recruiter View
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleOpenInEditor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg transition active:scale-[0.98]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize in Editor</span>
          </button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 overflow-auto flex justify-center p-4 sm:p-8">
        <A4Canvas />
      </main>
    </div>
  );
};
