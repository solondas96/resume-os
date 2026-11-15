import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { parseResumeMarkdown } from '../../parser/markdown';
import { ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';

const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI
const A4_WIDTH_PX = 794;   // 210mm at 96 DPI

export const A4Canvas: React.FC = () => {
  const {
    markdown,
    theme,
    accentColor,
    compactSpacing,
    onePageMode,
    zoom,
    setZoom,
    autoFitZoom,
    setAutoFitZoom,
  } = useResumeStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX);
  const [calculatedScale, setCalculatedScale] = useState(1.0);

  // Parse markdown into sanitized HTML with icons and containers
  const parsedHtml = useMemo(() => {
    return parseResumeMarkdown(markdown);
  }, [markdown]);

  // Derive light tint of accent color for background accents
  const primaryLightHex = useMemo(() => {
    // Generate subtle 10% opacity tint
    return accentColor + '18';
  }, [accentColor]);

  // Auto-fit scale listener
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !autoFitZoom) return;
      const availableWidth = containerRef.current.clientWidth - 48; // padding
      const targetScale = Math.min(1.05, Math.max(0.45, availableWidth / A4_WIDTH_PX));
      setCalculatedScale(targetScale);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [autoFitZoom]);

  // Track sheet height to render page-break indicators
  useEffect(() => {
    if (!sheetRef.current) return;
    const observer = new ResizeObserver(() => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.offsetHeight);
      }
    });
    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [parsedHtml, compactSpacing, theme]);

  const activeScale = autoFitZoom ? calculatedScale : zoom;

  // Calculate page break positions
  const numPages = Math.ceil(sheetHeight / A4_HEIGHT_PX);
  const pageBreaks = useMemo(() => {
    const breaks = [];
    for (let i = 1; i < numPages; i++) {
      breaks.push(i * A4_HEIGHT_PX);
    }
    return breaks;
  }, [numPages]);

  const isOverflowingOnePage = sheetHeight > A4_HEIGHT_PX + 20;

  return (
    <div
      ref={containerRef}
      className="a4-canvas-wrapper relative flex flex-col items-center"
      style={
        {
          '--primary-color': accentColor,
          '--primary-light': primaryLightHex,
        } as React.CSSProperties
      }
    >
      {/* Floating Canvas Controls (Zoom & Overflow Warning) */}
      <div className="no-print sticky top-3 z-30 flex items-center gap-3">
        {/* Overflow alert if user turned on 1-Page mode or wants to know */}
        {isOverflowingOnePage && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 text-amber-950 font-semibold text-xs rounded-full shadow-lg backdrop-blur border border-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-950" />
            <span>Spills onto Page 2 ({sheetHeight}px / {A4_HEIGHT_PX}px)</span>
          </div>
        )}

        {/* Zoom Bar */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-full px-2 py-1 shadow-xl text-slate-300 text-xs">
          <button
            onClick={() => {
              setAutoFitZoom(false);
              setZoom(Math.max(0.4, Number((activeScale - 0.1).toFixed(2))));
            }}
            title="Zoom Out"
            className="p-1 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="w-12 text-center font-mono text-[11px] font-semibold text-slate-200">
            {Math.round(activeScale * 100)}%
          </span>

          <button
            onClick={() => {
              setAutoFitZoom(false);
              setZoom(Math.min(1.5, Number((activeScale + 0.1).toFixed(2))));
            }}
            title="Zoom In"
            className="p-1 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />

          <button
            onClick={() => setAutoFitZoom(true)}
            title="Auto-Fit Width"
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition ${
              autoFitZoom ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Fit
          </button>
        </div>
      </div>

      {/* A4 Paper Surface */}
      <div
        className="transition-transform duration-100 ease-out origin-top my-4"
        style={{
          transform: `scale(${activeScale})`,
          marginBottom: `${Math.max(40, (sheetHeight * (activeScale - 1)) + 40)}px`,
        }}
      >
        <div
          ref={sheetRef}
          className={`a4-sheet template-${theme} ${compactSpacing ? 'compact-spacing' : ''} ${
            onePageMode ? 'one-page-clamped' : ''
          }`}
        >
          {/* Visual dashed lines at each A4 page split */}
          {pageBreaks.map((breakTop, idx) => (
            <div
              key={idx}
              className="page-break-indicator no-print"
              style={{ top: `${breakTop}px` }}
            >
              <div className="page-break-badge">
                A4 Page {idx + 1} Cutoff
              </div>
            </div>
          ))}

          {/* Rendered HTML */}
          <div
            className="resume-content-root"
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
        </div>
      </div>
    </div>
  );
};
