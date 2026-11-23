import React, { useState } from 'react';
import {
  Printer,
  FileText,
  ChevronDown,
  Edit3,
  Command,
  Sparkles,
  Download,
  FileCode,
  FileSpreadsheet,
  Loader2,
  FolderGit2,
  Mail
} from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { useModelMarkdown } from '../../store/useModelMarkdown';
import { ResumeLabsLogo } from '../brand/ResumeLabsLogo';
import { exportPlainText, exportJsonResume } from '../../utils/exportHelpers';
import { downloadResumePdf } from '../../services/pdfDownload';
import confetti from 'canvas-confetti';

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

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const modelMarkdown = useModelMarkdown();
  const activeContent = workspaceMode === 'cover-letter' ? coverLetterMarkdown : modelMarkdown;

  const handlePrintPdf = () => {
    saveRevision('Pre-export auto-save');
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.1 }
    });
    window.print();
  };

  // A real text-based PDF, generated in the browser. Print stays available as a secondary option.
  const handleDirectPdf = async () => {
    saveRevision('Pre-export auto-save');
    setIsExportingPdf(true);
    try {
      if (currentResume) await downloadResumePdf(currentResume, pageSize);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.2 }
      });
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
    link.download = `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'document'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPlainText = () => {
    exportPlainText(activeContent, `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'document'}.txt`);
  };

  const handleExportJson = () => {
    exportJsonResume(activeContent, `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'document'}.json`);
  };

  return (
    <header className="no-print h-14 bg-card/95 border-b border-border flex items-center justify-between px-3 sm:px-4 select-none z-30 relative transition-colors duration-150 backdrop-blur-xs">
      {/* Left: Brand logo & Editable Document Title & Library Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <ResumeLabsLogo size={28} showText={true} />

        <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1 hidden md:block" />

        {/* Library Switcher Button */}
        <button
          onClick={() => setLibraryModalOpen(true)}
          title="Open Resume Library (Switch & Manage Multiple Resumes)"
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border transition active:scale-[0.98]"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-brand-text" />
          <span className="truncate max-w-[100px] lg:max-w-[140px]">{documentTitle}</span>
          <span className="text-[10px] font-mono text-muted-foreground bg-background px-1 rounded border border-border">
            {resumes.length}
          </span>
        </button>

        {/* Editable Title for mobile/inline */}
        <div className="sm:hidden flex items-center gap-1 group">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="bg-muted border border-brand/60 focus:ring-2 focus:ring-brand/30 rounded px-2 py-0.5 text-xs text-foreground font-medium focus:outline-hidden w-36 shadow-xs"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 text-xs font-medium text-foreground/90 hover:text-foreground px-1.5 py-1 rounded hover:bg-muted transition max-w-[120px] truncate"
              title="Click to rename document"
            >
              <span className="truncate">{documentTitle}</span>
              <Edit3 className="w-2.5 h-2.5 text-muted-foreground opacity-60" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Mode Switcher (Resume vs Cover Letter). On phones it moves to More, so the header stays on one line */}
      <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
        {/* Workspace Mode Segmented Control */}
        <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border text-xs font-medium">
          <button
            onClick={() => setWorkspaceMode('resume')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              workspaceMode === 'resume'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3 h-3 text-brand-text" />
            <span>Resume</span>
          </button>
          <button
            onClick={() => setWorkspaceMode('cover-letter')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              workspaceMode === 'cover-letter'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="w-3 h-3 text-brand-text" />
            <span>Cover Letter</span>
          </button>
        </div>

      </div>

      {/* Right controls: the inspector, search, and everything less common under More */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* The one inspector: Health, Match, Design, History */}
        <button
          onClick={() => (inspectorTab ? closeInspector() : openInspector('health'))}
          aria-expanded={!!inspectorTab}
          title="Inspector: health, job match, design and saved versions"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition active:scale-[0.98] ${
            inspectorTab ? 'bg-accent text-accent-foreground border-brand/40' : 'bg-muted hover:bg-muted/80 border-border text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-text" />
          <span className="hidden sm:inline">Inspector</span>
        </button>

        {/* Search and commands (Cmd+K / Ctrl+K) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Search and commands (Cmd+K / Ctrl+K)"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition text-xs font-mono"
        >
          <Command className="w-3 h-3" />
          <span className="text-[11px]">Cmd+K</span>
        </button>

        {/* Less common actions */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            title="More: templates, library, share, import, help"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <span>More</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
              <div role="menu" className="absolute right-0 top-full mt-1 z-50 w-64 bg-card border border-border rounded-xl shadow-lifted p-1.5 space-y-0.5">
                {[
                  { label: 'Start from a role', run: () => setActiveModal('presets') },
                  { label: 'Resume library', run: () => setLibraryModalOpen(true) },
                  { label: 'Application tracker', run: () => setActiveModal('tracker') },
                  { label: 'Cover letter', run: () => setActiveModal('cover-letter') },
                  { label: 'Share a web link', run: () => setShareModalOpen(true) },
                  { label: 'Import a file', run: () => setActiveModal('import') },
                  { label: 'Keyboard shortcuts and help', run: () => setActiveModal('shortcuts') },
                  { label: uiTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', run: toggleUiTheme },
                ].map((item) => (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      item.run();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main action: a real PDF download */}
        <button
          type="button"
          onClick={handleDirectPdf}
          disabled={isExportingPdf || !currentResume}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-button text-white text-xs font-medium hover:opacity-90 disabled:opacity-40 transition active:scale-[0.98] min-h-[36px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">{isExportingPdf ? 'Preparing…' : (<><span className="sm:hidden">PDF</span><span className="hidden sm:inline">Download PDF</span></>)}</span>
        </button>

        {/* Export Dropdown Trigger (on phones, Download PDF covers the common case) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:opacity-90 transition active:scale-[0.98] shadow-xs"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Export Dropdown Menu */}
          {exportMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setExportMenuOpen(false)}
            >
              <div className="pb-1 space-y-0.5">
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleDirectPdf();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-brand-text" />
                    <span className="font-medium">Download PDF</span>
                  </div>
                  <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-mono font-medium">
                    Fast
                  </span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handlePrintPdf();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-center gap-2 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Print… (secondary)</span>
                </button>
              </div>

              <div className="pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleDownloadMarkdown();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-center gap-2 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Download .md Source</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportPlainText();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-center gap-2 transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Export Clean Text (.txt)</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportJson();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Export JSON Resume (.json)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </header>
  );
};
