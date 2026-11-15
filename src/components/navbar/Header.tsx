import React, { useState } from 'react';
import {
  Printer,
  History,
  HelpCircle,
  Palette,
  Upload,
  FileText,
  ChevronDown,
  Edit3,
  Sun,
  Moon,
  Command,
  Target,
  Sparkles,
  Download,
  FileCode,
  FileSpreadsheet,
  Loader2,
  FolderGit2,
  Share2,
  Mail
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { ResumeLabsLogo } from '../brand/ResumeLabsLogo';
import { DesignPanel } from '../design/DesignPanel';
import { exportDirectPdf, exportPlainText, exportJsonResume } from '../../utils/exportHelpers';
import confetti from 'canvas-confetti';

export const Header: React.FC = () => {
  const {
    theme,
    setActiveModal,
    markdown,
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
    activeSidePanel,
    setActiveSidePanel,
    setShareModalOpen,
    coverLetterMarkdown,
  } = useResumeStore();

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const activeContent = workspaceMode === 'cover-letter' ? coverLetterMarkdown : markdown;

  const handlePrintPdf = () => {
    saveRevision('Pre-export auto-save');
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.1 }
    });
    window.print();
  };

  const handleDirectPdf = async () => {
    saveRevision('Pre-export auto-save');
    setIsExportingPdf(true);
    try {
      const fileName = `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'resume'}.pdf`;
      const targetElement = document.querySelector('.a4-sheet') as HTMLElement;
      await exportDirectPdf(targetElement, fileName);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.2 }
      });
    } catch (e) {
      console.error('Direct PDF export failed, fallback to print:', e);
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
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <ResumeLabsLogo size={28} showText={true} />

        <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1 hidden md:block" />

        {/* Library Switcher Button */}
        <button
          onClick={() => setLibraryModalOpen(true)}
          title="Open Resume Library (Switch & Manage Multiple Resumes)"
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border transition active:scale-[0.98]"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-brand" />
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

      {/* Center: Mode Switcher (Resume vs Cover Letter) & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
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
            <FileText className="w-3 h-3 text-brand" />
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
            <Mail className="w-3 h-3 text-brand" />
            <span>Cover Letter</span>
          </button>
        </div>

        {/* Starter Role Presets */}
        <button
          onClick={() => setActiveModal('presets')}
          title="Browse Professional Starter Presets"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span className="hidden lg:inline">Presets</span>
        </button>

        {/* Job Tailor Panel Toggle */}
        <button
          onClick={() => setActiveSidePanel(activeSidePanel === 'tailor' ? 'none' : 'tailor')}
          title="Job Description Keyword Tailor"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition active:scale-[0.98] ${
            activeSidePanel === 'tailor'
              ? 'bg-accent text-accent-foreground border-brand/40 shadow-xs'
              : 'bg-muted hover:bg-muted/80 border-border text-foreground'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-brand" />
          <span className="hidden sm:inline">Tailor</span>
        </button>

        {/* Bullet Linter Panel Toggle */}
        {workspaceMode === 'resume' && (
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'linter' ? 'none' : 'linter')}
            title="Bullet Point Action Verb & STAR Linter"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition active:scale-[0.98] ${
              activeSidePanel === 'linter'
                ? 'bg-accent text-accent-foreground border-brand/40 shadow-xs'
                : 'bg-muted hover:bg-muted/80 border-border text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="hidden lg:inline">Linter</span>
          </button>
        )}

        {/* Consolidated Design Panel Trigger */}
        <button
          onClick={() => setDesignOpen(true)}
          title="Open Design & Layout Settings"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition active:scale-[0.98]"
        >
          <Palette className="w-3.5 h-3.5 text-brand" />
          <span>Design</span>
          <span className="text-[10px] bg-background text-muted-foreground border border-border px-1.5 py-0.5 rounded capitalize font-mono hidden sm:inline">
            {theme}
          </span>
        </button>
      </div>

      {/* Right Controls: Share, Palette, Theme, History, Export */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* 1-Click Share Web Resume Link */}
        <button
          onClick={() => setShareModalOpen(true)}
          title="Share Web Resume (Recruiter Direct View Link)"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition text-xs font-medium active:scale-[0.98]"
        >
          <Share2 className="w-3.5 h-3.5 text-brand" />
          <span className="hidden md:inline">Share</span>
        </button>

        {/* Cmd+K Quick Search Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Cmd+K / Ctrl+K)"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition text-xs font-mono"
        >
          <Command className="w-3 h-3" />
          <span className="text-[11px]">Cmd+K</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleUiTheme}
          title={`Switch to ${uiTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
        >
          {uiTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Revision History Trigger */}
        <button
          onClick={() => setActiveModal('history')}
          title="Revision History & Snapshots"
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition hidden sm:inline-flex"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Shortcuts / Help */}
        <button
          onClick={() => setActiveModal('shortcuts')}
          title="Keyboard Shortcuts & Markdown Reference"
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition hidden sm:inline-flex"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Import Trigger */}
        <button
          onClick={() => setActiveModal('import')}
          title="Import Resume (.md, .txt, JSON Resume)"
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition hidden md:inline-flex"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Export Dropdown Trigger */}
        <div className="relative">
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
                    <Download className="w-3.5 h-3.5 text-brand" />
                    <span className="font-medium">1-Click Direct PDF</span>
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
                  <span>Print Dialog / Vector PDF</span>
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

      {/* Slide-over Design Panel */}
      <DesignPanel
        isOpen={designOpen}
        onClose={() => setDesignOpen(false)}
      />
    </header>
  );
};
