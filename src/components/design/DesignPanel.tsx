import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
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
  } = useResumeStoreV2();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Drawer Panel */}
      <aside className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-card border-l border-border shadow-lifted z-50 flex flex-col transition-all duration-200 ease-out select-none">
        {/* Panel Header */}
        <div className="h-14 px-5 bg-card border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent text-accent-foreground border border-brand/20">
              <Palette className="w-4 h-4 text-brand-text" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Design & Layout</h2>
              <p className="text-[11px] text-muted-foreground">Templates, colors, and typography</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-foreground">
          {/* 1. Templates Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground uppercase tracking-wider text-[11px]">
                Resume Template
              </label>
              <span className="text-[10px] text-brand-text font-mono">Live Preview</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setTheme(tmpl.id)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col gap-1 ${
                    theme === tmpl.id
                      ? 'bg-accent/40 border-brand/50 shadow-card'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-xs">{tmpl.name}</span>
                    {theme === tmpl.id && (
                      <span className="flex items-center gap-1 text-[10px] text-brand-text font-medium bg-accent px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">{tmpl.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>Font: {tmpl.fontFamily.split(',')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Accent Color Palette */}
          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground uppercase tracking-wider text-[11px]">
                Accent Color
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">{accentColor}</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {ACCENT_COLORS.map((col) => {
                const isSelected = accentColor.toLowerCase() === col.hex.toLowerCase();
                return (
                  <button
                    key={col.id}
                    onClick={() => setAccentColor(col.hex)}
                    title={col.name}
                    className={`h-10 rounded-lg flex items-center justify-center transition border relative ${
                      isSelected
                        ? 'border-foreground scale-105 shadow-card ring-2 ring-brand/40'
                        : 'border-border hover:border-foreground/40 hover:scale-102'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Typography & Spacing Sliders */}
          <div className="space-y-4 border-t border-border pt-5">
            <label className="font-medium text-foreground uppercase tracking-wider text-[11px] block">
              Typography & Spacing Controls
            </label>

            {/* Font Size */}
            <div className="bg-muted/40 border border-border p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-brand-text" />
                  Base Font Size
                </span>
                <span className="text-[10px] text-muted-foreground font-mono capitalize">{fontSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border text-[11px]">
                {(['small', 'medium', 'large'] as FontSizeOption[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`py-1 rounded font-medium capitalize transition ${
                      fontSize === size
                        ? 'bg-primary text-primary-foreground shadow-card'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Margins */}
            <div className="bg-muted/40 border border-border p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-brand-text" />
                  Page Margins
                </span>
                <span className="text-[10px] text-muted-foreground font-mono capitalize">{marginSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border text-[11px]">
                {(['narrow', 'normal', 'relaxed'] as MarginOption[]).map((margin) => (
                  <button
                    key={margin}
                    onClick={() => setMarginSize(margin)}
                    className={`py-1 rounded font-medium capitalize transition ${
                      marginSize === margin
                        ? 'bg-primary text-primary-foreground shadow-card'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {margin}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="bg-muted/40 border border-border p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <AlignJustify className="w-3.5 h-3.5 text-brand-text" />
                  Line Height
                </span>
                <span className="text-[10px] text-muted-foreground font-mono capitalize">{lineHeight}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border text-[11px]">
                {(['tight', 'normal', 'relaxed'] as LineHeightOption[]).map((lh) => (
                  <button
                    key={lh}
                    onClick={() => setLineHeight(lh)}
                    className={`py-1 rounded font-medium capitalize transition ${
                      lineHeight === lh
                        ? 'bg-primary text-primary-foreground shadow-card'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lh}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Spacing & Page Fit Controls */}
          <div className="space-y-4 border-t border-border pt-5">
            <label className="font-medium text-foreground uppercase tracking-wider text-[11px] block">
              Layout Density & Constraints
            </label>

            {/* Density Toggle */}
            <div className="bg-muted/40 border border-border p-3 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-brand-text" />
                  <span>Compact Spacing</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Tighter line-heights and section margins</p>
              </div>
              <button
                onClick={() => setCompactSpacing(!compactSpacing)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  compactSpacing ? 'bg-brand' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-card transform transition-transform ${
                    compactSpacing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 1-Page Constraint Toggle */}
            <div className="bg-muted/40 border border-border p-3 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-text" />
                  <span>1-Page Fit Mode</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Strictly clamps canvas to 1123px A4 height</p>
              </div>
              <button
                onClick={() => setOnePageMode(!onePageMode)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  onePageMode ? 'bg-brand' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-card transform transition-transform ${
                    onePageMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Changes reflect immediately</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:opacity-90 active:scale-[0.99] transition"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
};
