import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { parseResumeMarkdown } from '../../parser/markdown';

const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI
const A4_WIDTH_PX = 794;   // 210mm at 96 DPI

export const A4Canvas: React.FC = () => {
  const {
    markdown,
    workspaceMode,
    coverLetterMarkdown,
    theme,
    accentColor,
    compactSpacing,
    onePageMode,
    fontSize,
    marginSize,
    lineHeight,
    zoom,
    setZoom,
    autoFitZoom,
    setPageCount,
  } = useResumeStoreV2();

  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX);

  // Parse active markdown into sanitized HTML with icons and containers
  const activeMarkdown = workspaceMode === 'cover-letter' ? coverLetterMarkdown : markdown;
  const parsedHtml = useMemo(() => {
    return parseResumeMarkdown(activeMarkdown);
  }, [activeMarkdown]);

  // Derive light tint of accent color for background accents
  const primaryLightHex = useMemo(() => {
    return accentColor + '18';
  }, [accentColor]);

  // Auto-fit scale listener: automatically syncs scale with store zoom
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !autoFitZoom) return;
      const availableWidth = containerRef.current.clientWidth - 48; // padding
      const targetScale = Math.min(1.05, Math.max(0.45, availableWidth / A4_WIDTH_PX));
      setZoom(Number(targetScale.toFixed(2)));
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [autoFitZoom, setZoom]);

  // Track sheet height to render page-break indicators and update page count in store
  useEffect(() => {
    if (!sheetRef.current) return;
    const observer = new ResizeObserver(() => {
      if (sheetRef.current) {
        const height = sheetRef.current.offsetHeight;
        setSheetHeight(height);
        const calculatedPages = Math.max(1, Math.ceil((height - 20) / A4_HEIGHT_PX));
        setPageCount(calculatedPages);
      }
    });
    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [parsedHtml, compactSpacing, theme, fontSize, marginSize, lineHeight, setPageCount]);

  // Calculate page break positions
  const numPages = Math.max(1, Math.ceil((sheetHeight - 20) / A4_HEIGHT_PX));
  const pageBreaks = useMemo(() => {
    const breaks = [];
    for (let i = 1; i < numPages; i++) {
      breaks.push(i * A4_HEIGHT_PX);
    }
    return breaks;
  }, [numPages]);

  return (
    <div
      ref={containerRef}
      className="a4-canvas-wrapper relative flex flex-col items-center select-text"
      style={
        {
          '--primary-color': accentColor,
          '--primary-light': primaryLightHex,
        } as React.CSSProperties
      }
    >
      {/* A4 Paper Surface */}
      <div
        className="transition-transform duration-100 ease-out origin-top my-4"
        style={{
          transform: `scale(${zoom})`,
          marginBottom: `${Math.max(40, sheetHeight * (zoom - 1) + 40)}px`,
        }}
      >
        <div
          ref={sheetRef}
          className={`a4-sheet template-${theme} font-size-${fontSize} margin-${marginSize} line-height-${lineHeight} ${
            compactSpacing ? 'compact-spacing' : ''
          } ${onePageMode ? 'one-page-clamped' : ''}`}
        >
          {/* Visual dashed lines at each A4 page split */}
          {pageBreaks.map((breakTop, idx) => (
            <div
              key={idx}
              className="page-break-indicator no-print"
              style={{ top: `${breakTop}px` }}
            >
              <div className="page-break-badge">
                Page {idx + 1} of {numPages}
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
