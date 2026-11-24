import React, { useState } from 'react';
import { Printer, ChevronDown, Edit3, Download, FolderGit2 } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { useModelMarkdown } from '../../store/useModelMarkdown';
import { ResumeLabsLogo } from '../brand/ResumeLabsLogo';
import { exportPlainText, exportJsonResume } from '../../utils/exportHelpers';
import { downloadResumePdf } from '../../services/pdfDownload';

const celebrate = async (opts: Record<string, unknown>) => {
  const { default: confetti } = await import('canvas-confetti');
  confetti(opts);
};

/**
 * The header has four controls: the resume library, Download PDF, More, and (on phones) the
 * title. Everything else lives in More, so the header stays calm at every width. The budget is
 * tested in tests/e2e/header-controls.spec.ts.
 */
export const Header: React.FC = () => {
  const {
    currentResume,
    pageSize,
    setActiveModal,
    documentTitle,
    setDocumentTitle,
    saveRevision,
    uiTheme,
    toggleUiTheme,
    setCommandPaletteOpen,
    resumes,
    setLibraryModalOpen,
    workspaceMode,
    setWorkspaceMode,
    inspectorTab,
    openInspector,
    closeInspector,
    setShareModalOpen,
    coverLetterMarkdown,
  } = useResumeStoreV2();

  const [moreOpen, setMoreOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const modelMarkdown = useModelMarkdown();
  const activeContent = workspaceMode === 'cover-letter' ? coverLetterMarkdown : modelMarkdown;
  const fileStem = documentTitle.replace(/\s+/g, '-').toLowerCase() || 'document';

  const handlePrintPdf = () => {
    saveRevision('Pre-export auto-save');
    void celebrate({ particleCount: 50, spread: 50, origin: { y: 0.1 } });
    window.print();
  };

  // A real text-based PDF, generated in the browser. Print stays available as a secondary option.
  const handleDirectPdf = async () => {
    saveRevision('Pre-export auto-save');
    setIsExportingPdf(true);
    try {
      if (currentResume) await downloadResumePdf(currentResume, pageSize);
      void celebrate({ particleCount: 60, spread: 60, origin: { y: 0.2 } });
    } catch (e) {
      console.error('PDF generation failed, offering print instead:', e);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([activeContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileStem}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPlainText = () => exportPlainText(activeContent, `${fileStem}.txt`);
  const handleExportJson = () => exportJsonResume(activeContent, `${fileStem}.json`);

  const toggleNotes = () => (inspectorTab ? closeInspector() : openInspector('health'));

  // Everything that is not one of the four header controls
  const moreItems: { label: string; run: () => void }[] = [
    { label: workspaceMode === 'cover-letter' ? 'Show the resume' : 'Show the cover letter', run: () => setWorkspaceMode(workspaceMode === 'cover-letter' ? 'resume' : 'cover-letter') },
    { label: 'Notes: checks, job match, design, versions', run: toggleNotes },
    { label: 'Search and commands (Cmd+K)', run: () => setCommandPaletteOpen(true) },
    { label: 'Start from a role', run: () => setActiveModal('presets') },
    { label: 'Application tracker', run: () => setActiveModal('tracker') },
    { label: 'Share a web link', run: () => setShareModalOpen(true) },
    { label: 'Import a file', run: () => setActiveModal('import') },
    { label: 'Print…', run: handlePrintPdf },
    { label: 'Download the Markdown source', run: handleDownloadMarkdown },
    { label: 'Export clean text (.txt)', run: handleExportPlainText },
    { label: 'Export JSON resume (.json)', run: handleExportJson },
    { label: 'Keyboard shortcuts and help', run: () => setActiveModal('shortcuts') },
    { label: uiTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', run: toggleUiTheme },
  ];

  return (
    <header className={`no-print h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-surface border-b border-rule flex items-center justify-between gap-2 px-3 sm:px-4 select-none relative transition-colors duration-150 ${moreOpen ? 'z-[70]' : 'z-30'}`}>
      {/* Left: the logo, the resume's name and the library */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <ResumeLabsLogo size={28} showText={true} />

        <div className="h-4 w-px bg-rule mx-0.5 hidden md:block" />

        <button
          onClick={() => setLibraryModalOpen(true)}
          title="Open the resume library: switch or manage your resumes"
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 min-h-[44px] lg:min-h-[32px] text-xs font-medium text-ink bg-muted hover:bg-muted/80 rounded-lg border border-rule transition min-w-0"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-pencil shrink-0" />
          <span className="truncate max-w-[120px] lg:max-w-[160px]">{documentTitle}</span>
          <span className="tabular-nums text-[10px] text-graphite bg-desk px-1 rounded border border-rule">{resumes.length}</span>
        </button>

        {/* Phones: the title is editable in place */}
        <div className="sm:hidden flex items-center gap-1 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              aria-label="Resume name"
              className="bg-paper border border-pencil rounded px-2 py-0.5 text-base text-ink font-medium focus:outline-hidden w-36"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 text-xs font-medium text-ink px-1.5 min-h-[44px] lg:min-h-0 lg:py-1 rounded hover:bg-muted transition max-w-[160px] truncate"
              title="Rename this resume"
            >
              <span className="truncate">{documentTitle}</span>
              <Edit3 className="w-2.5 h-2.5 text-graphite shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Download PDF and More */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDirectPdf}
          disabled={isExportingPdf || !currentResume}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-button text-on-pencil text-xs font-medium hover:bg-brand-hover disabled:opacity-40 transition active:scale-[0.98] min-h-[44px] lg:min-h-[36px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">{isExportingPdf ? 'Preparing…' : (<><span className="sm:hidden">PDF</span><span className="hidden sm:inline">Download PDF</span></>)}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-rule text-xs font-medium text-ink transition min-h-[44px] lg:min-h-[36px]"
          >
            <span>More</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-[65]" onClick={() => setMoreOpen(false)} />
              <div
                role="menu"
                aria-label="More"
                className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-[calc(3.5rem+env(safe-area-inset-top)+4px)] sm:top-full sm:mt-1 z-[70] sm:w-72 max-h-[70dvh] overflow-y-auto bg-surface border border-rule rounded-xl shadow-lifted p-1.5 space-y-0.5"
              >
                {moreItems.map((item) => (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      item.run();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-muted transition min-h-[40px]"
                  >
                    {item.label}
                  </button>
                ))}
                <p className="px-3 pt-2 pb-1 text-xs text-graphite flex items-center gap-1.5">
                  <Printer className="w-3 h-3" aria-hidden="true" />
                  Print and text exports are in this menu.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
