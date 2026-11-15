import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { TEMPLATES, ACCENT_COLORS } from '../../data/templates';
import { FontSizeOption, MarginOption, LineHeightOption } from '../../types';
import {
  X,
  Palette,
  Sliders,
  FileText,
  Check,
  Type,
  Maximize2,
  AlignJustify
} from 'lucide-react';

interface DesignPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignPanel: React.FC<DesignPanelProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    compactSpacing,
    setCompactSpacing,
    onePageMode,
    setOnePageMode,
    fontSize,
    setFontSize,
    marginSize,
    setMarginSize,
    lineHeight,
    setLineHeight,
  } = useResumeStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Drawer Panel */}
      <aside className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-200 ease-out select-none">
        {/* Panel Header */}
        <div className="h-14 px-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Design & Layout</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Templates, colors, and typography</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {/* 1. Templates Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Resume Template
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Live Preview</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setTheme(tmpl.id)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col gap-1 ${
                    theme === tmpl.id
                      ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-500/60 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{tmpl.name}</span>
                    {theme === tmpl.id && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{tmpl.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    <span>Font: {tmpl.fontFamily.split(',')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Accent Color Palette */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Accent Color
              </label>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{accentColor}</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setAccentColor(col.hex)}
                  title={col.name}
                  className={`h-11 rounded-lg flex flex-col items-center justify-center transition border relative ${
                    accentColor.toLowerCase() === col.hex.toLowerCase()
                      ? 'border-slate-900 dark:border-white scale-105 shadow-md shadow-black/20'
                      : 'border-slate-300 dark:border-slate-800 hover:border-slate-500 hover:scale-102'
                  }`}
                  style={{ backgroundColor: col.hex }}
                >
                  {accentColor.toLowerCase() === col.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Typography & Spacing Sliders */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
            <label className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
              Typography & Spacing Controls
            </label>

            {/* Font Size */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Base Font Size
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">{fontSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                {(['small', 'medium', 'large'] as FontSizeOption[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`py-1 rounded font-medium capitalize transition ${
                      fontSize === size
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Margins */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Page Margins
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">{marginSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                {(['narrow', 'normal', 'relaxed'] as MarginOption[]).map((margin) => (
                  <button
                    key={margin}
                    onClick={() => setMarginSize(margin)}
                    className={`py-1 rounded font-medium capitalize transition ${
                      marginSize === margin
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {margin}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <AlignJustify className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Line Height
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">{lineHeight}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                {(['tight', 'normal', 'relaxed'] as LineHeightOption[]).map((lh) => (
                  <button
                    key={lh}
                    onClick={() => setLineHeight(lh)}
                    className={`py-1 rounded font-medium capitalize transition ${
                      lineHeight === lh
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {lh}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Spacing & Page Fit Controls */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
            <label className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
              Layout Density & Constraints
            </label>

            {/* Density Toggle */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Compact Spacing</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tighter line-heights and section margins</p>
              </div>
              <button
                onClick={() => setCompactSpacing(!compactSpacing)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  compactSpacing ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    compactSpacing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 1-Page Constraint Toggle */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>1-Page Fit Mode</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Strictly clamps canvas to 1123px A4 height</p>
              </div>
              <button
                onClick={() => setOnePageMode(!onePageMode)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  onePageMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    onePageMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Changes reflect immediately</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
};
