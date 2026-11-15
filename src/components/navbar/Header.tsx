import React, { useState } from 'react';
import {
  Printer,
  History,
  HelpCircle,
  Palette,
  Upload,
  FileText,
  ChevronDown,
  Zap,
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
import { HeadroomStudio } from '../headroom/HeadroomStudio';
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
  const [headroomOpen, setHeadroomOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrintPdf = () => {
    saveRevision('Pre-export auto-save');
    confetti({
      particleCount: 75,
      spread: 60,
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
          particleCount: 90,
          spread: 70,
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
    <header className="no-print h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none z-30 relative">
      {/* Left: Brand logo & Editable Document Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm tracking-tighter">
            R<span className="text-blue-200">OS</span>
          </div>
          <span className="font-bold text-slate-100 text-sm tracking-tight hidden sm:inline">ResumeOS</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

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
              className="bg-slate-900 border border-blue-500 rounded px-2 py-0.5 text-xs text-white font-medium focus:outline-none w-48 sm:w-60"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-900 transition max-w-[200px] sm:max-w-xs truncate"
              title="Click to rename document"
            >
              <span className="truncate">{documentTitle}</span>
              <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Consolidated Action Buttons (Presets, ATS Scan, Design & Headroom AI) */}
      <div className="flex items-center gap-2">
        {/* Starter Role Presets */}
        <button
          onClick={() => setActiveModal('presets')}
          title="Browse Professional Starter Presets"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">Presets</span>
        </button>

        {/* ATS Job Matcher Scanner */}
        <button
          onClick={() => setActiveModal('ats')}
          title="ATS Keyword Scanner & Job Description Matcher"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition active:scale-95 shadow-xs"
        >
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">ATS Scan</span>
        </button>

        {/* Consolidated Design Panel Trigger */}
        <button
          onClick={() => setDesignOpen(true)}
          title="Open Design & Layout Settings"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white shadow-sm transition active:scale-95"
        >
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>Design</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700/80 px-1.5 py-0.5 rounded capitalize font-mono font-medium">
            {theme}
          </span>
        </button>

        {/* Headroom AI Studio Trigger */}
        <button
          onClick={() => setHeadroomOpen(true)}
          title="Headroom AI Context Compression & Optimization Studio"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs shadow-sm shadow-amber-500/10 transition active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="hidden sm:inline">Headroom AI</span>
          <span className="sm:hidden">AI</span>
        </button>
      </div>

      {/* Right Controls: Palette, Theme, History, Help, Import & Prominent Export */}
      <div className="flex items-center gap-2">
        {/* Cmd+K Quick Search Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Cmd+K / Ctrl+K)"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition text-xs font-mono"
        >
          <Command className="w-3 h-3 text-slate-500" />
          <span>Cmd+K</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleUiTheme}
          title={`Switch to ${uiTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
        >
          {uiTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        <button
          onClick={() => setActiveModal('shortcuts')}
          title="Markdown & Icon Shortcuts (?)"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveModal('history')}
          title="Revision History"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveModal('import')}
          title="Import Markdown"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Prominent Print / PDF Button with split dropdown */}
        <div className="relative">
          <div className="flex items-center shadow-md shadow-blue-600/20">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-l-lg transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1.5 rounded-r-lg border-l border-blue-500 transition"
              title="More export options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 divide-y divide-slate-800/60">
              <div className="pb-1">
                <button
                  onClick={handleDirectPdf}
                  disabled={isExportingPdf}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-2">
                    {isExportingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span className="font-medium">1-Click Direct PDF</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                    Instant
                  </span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handlePrintPdf();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print Dialog / Vector PDF</span>
                </button>
              </div>

              <div className="pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleDownloadMarkdown();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .md Source</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportPlainText();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Clean Text (.txt for ATS)</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportJson();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
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

      {/* Headroom Studio Modal */}
      <HeadroomStudio
        isOpen={headroomOpen}
        onClose={() => setHeadroomOpen(false)}
      />
    </header>
  );
};
