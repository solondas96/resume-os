import React, { useState } from 'react';
import {
  Printer,
  History,
  HelpCircle,
  RotateCcw,
  Palette,
  Layout,
  Upload,
  FileText,
  Sliders,
  ChevronDown,
  Zap
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { ACCENT_COLORS, TEMPLATES } from '../../data/templates';
import { HeadroomStudio } from '../headroom/HeadroomStudio';
import confetti from 'canvas-confetti';

export const Header: React.FC = () => {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    onePageMode,
    setOnePageMode,
    compactSpacing,
    setCompactSpacing,
    setActiveModal,
    resetToSample,
    markdown,
    saveRevision
  } = useResumeStore();

  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [headroomOpen, setHeadroomOpen] = useState(false);

  const handlePrintPdf = () => {
    saveRevision('Pre-export auto-save');
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.1 }
    });
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-${theme}-${Date.now().toString().slice(-4)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="no-print h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none z-40 relative">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm tracking-tighter">
          R<span className="text-blue-200">OS</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-sm tracking-tight">ResumeOS</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-medium">v1.0</span>
          </div>
        </div>
      </div>

      {/* Center Controls: Templates, Colors, Page Guards */}
      <div className="flex items-center gap-2">
        {/* Template Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setTemplateMenuOpen(!templateMenuOpen);
              setColorMenuOpen(false);
              setExportMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-medium text-slate-200 hover:text-white transition"
          >
            <Layout className="w-3.5 h-3.5 text-blue-400" />
            <span>Template: <strong className="capitalize text-slate-100">{theme}</strong></span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {templateMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-lg bg-slate-900 border border-slate-800 shadow-xl p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Choose Theme</div>
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setTemplateMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition text-xs flex flex-col gap-0.5 ${
                    theme === t.id ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[11px] text-slate-400 leading-tight">{t.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Palette Picker */}
        <div className="relative">
          <button
            onClick={() => {
              setColorMenuOpen(!colorMenuOpen);
              setTemplateMenuOpen(false);
              setExportMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-medium text-slate-200 hover:text-white transition"
          >
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: accentColor }} />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {colorMenuOpen && (
            <div className="absolute left-0 mt-2 w-52 rounded-lg bg-slate-900 border border-slate-800 shadow-xl p-2.5 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-1 py-1 uppercase tracking-wider mb-1">Accent Color</div>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    title={c.name}
                    onClick={() => {
                      setAccentColor(c.hex);
                      setColorMenuOpen(false);
                    }}
                    className={`w-9 h-9 rounded-md flex items-center justify-center transition border ${
                      accentColor.toLowerCase() === c.hex.toLowerCase()
                        ? 'border-white scale-110 shadow-md'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compact Spacing toggle */}
        <button
          onClick={() => setCompactSpacing(!compactSpacing)}
          title="Tighter margins and line-height to fit more on a single page"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition ${
            compactSpacing
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
              : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Compact</span>
        </button>

        {/* 1-Page Clamp toggle */}
        <button
          onClick={() => setOnePageMode(!onePageMode)}
          title="Clamp preview strictly to 1 A4 page (1123px)"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition ${
            onePageMode
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>1-Page Fit</span>
        </button>
      </div>

      {/* Right Controls: History, Help, Export */}
      <div className="flex items-center gap-2">
        {/* Headroom AI Studio Button */}
        <button
          onClick={() => setHeadroomOpen(true)}
          title="Headroom AI Context Compression & Optimization Studio"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs shadow-sm shadow-amber-500/10 transition active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Headroom AI</span>
        </button>

        <button
          onClick={() => setActiveModal('shortcuts')}
          title="Markdown & Icon Shortcuts"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveModal('history')}
          title="Revision History"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveModal('import')}
          title="Import Markdown"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (confirm('Reset editor to the standard sample resume? Any unsaved edits will be lost.')) {
              resetToSample();
            }
          }}
          title="Reset to Sample Resume"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Export / Print Button */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-l-md shadow-sm transition shadow-blue-600/30 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => {
                setExportMenuOpen(!exportMenuOpen);
                setColorMenuOpen(false);
                setTemplateMenuOpen(false);
              }}
              className="bg-blue-700 hover:bg-blue-600 text-white px-1.5 py-1.5 rounded-r-md border-l border-blue-500 transition"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-900 border border-slate-800 shadow-xl p-1.5 z-50">
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  handlePrintPdf();
                }}
                className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Save as Vector PDF</span>
              </button>
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  handleDownloadMarkdown();
                }}
                className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download .md Source</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Headroom Studio Modal */}
      <HeadroomStudio
        isOpen={headroomOpen}
        onClose={() => setHeadroomOpen(false)}
      />
    </header>
  );
};
