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
  Loader2
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
    setCommandPaletteOpen
  } = useResumeStore();

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
    setExportMenuOpen(false);

    try {
      const target = document.querySelector('.a4-sheet') as HTMLElement;
      const success = await exportDirectPdf(target, `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'resume'}.pdf`);
      if (success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.1 }
        });
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'resume'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPlainText = () => {
    exportPlainText(markdown, `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'resume'}.txt`);
  };

  const handleExportJson = () => {
    exportJsonResume(markdown, `${documentTitle.replace(/\s+/g, '-').toLowerCase() || 'resume'}.json`);
  };

  return (
    <header className="no-print h-14 bg-card/95 border-b border-border flex items-center justify-between px-4 select-none z-30 relative transition-colors duration-150 backdrop-blur-xs">
      {/* Left: Brand logo & Editable Document Title */}
      <div className="flex items-center gap-3">
        <ResumeLabsLogo size={28} showText={true} />

        <div className="h-4 w-[1px] bg-border mx-1 hidden md:block" />

        {/* Editable Title */}
        <div className="flex items-center gap-1.5 group">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="bg-muted border border-brand/60 focus:ring-2 focus:ring-brand/30 rounded px-2.5 py-1 text-xs text-foreground font-medium focus:outline-hidden w-44 sm:w-60 shadow-xs"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-foreground/90 hover:text-foreground px-2 py-1 rounded hover:bg-muted transition max-w-[160px] sm:max-w-xs truncate"
              title="Click to rename document"
            >
              <span className="truncate">{documentTitle}</span>
              <Edit3 className="w-3 h-3 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Quiet Action Buttons (Presets, ATS Scan, Design) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Starter Role Presets */}
        <button
          onClick={() => setActiveModal('presets')}
          title="Browse Professional Starter Presets"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span className="hidden lg:inline">Presets</span>
        </button>

        {/* ATS Job Matcher Scanner */}
        <button
          onClick={() => setActiveModal('ats')}
          title="ATS Keyword Scanner & Job Description Matcher"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition active:scale-[0.98]"
        >
          <Target className="w-3.5 h-3.5 text-brand" />
          <span className="hidden sm:inline">ATS Scan</span>
        </button>

        {/* Consolidated Design Panel Trigger */}
        <button
          onClick={() => setDesignOpen(true)}
          title="Open Design & Layout Settings"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition active:scale-[0.98]"
        >
          <Palette className="w-3.5 h-3.5 text-brand" />
          <span>Design</span>
          <span className="text-[10px] bg-background text-muted-foreground border border-border px-1.5 py-0.5 rounded capitalize font-mono">
            {theme}
          </span>
        </button>
      </div>

      {/* Right Controls: Palette, Theme, History, Help, Import & Prominent Export */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Cmd+K Quick Search Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Cmd+K / Ctrl+K)"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition text-xs font-mono"
        >
          <Command className="w-3 h-3 text-muted-foreground" />
          <span>Cmd+K</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleUiTheme}
          title={`Switch to ${uiTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
        >
          {uiTheme === 'dark' ? <Sun className="w-4 h-4 text-brand" /> : <Moon className="w-4 h-4 text-brand" />}
        </button>

        <button
          onClick={() => setActiveModal('shortcuts')}
          title="Markdown & Icon Shortcuts (?)"
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveModal('history')}
          title="Revision History"
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveModal('import')}
          title="Import Resume"
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Prominent Print / PDF Button with split dropdown */}
        <div className="relative ml-1">
          <div className="flex items-center shadow-card rounded-lg overflow-hidden">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-medium text-xs px-3.5 py-1.5 hover:opacity-90 transition active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="bg-primary text-primary-foreground px-2 py-1.5 border-l border-primary-foreground/15 hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-hidden"
              title="More export options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-lifted p-1.5 z-50 divide-y divide-border animate-in fade-in zoom-in-95 duration-100">
              <div className="pb-1">
                <button
                  onClick={handleDirectPdf}
                  disabled={isExportingPdf}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-2">
                    {isExportingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-brand" />
                    )}
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
