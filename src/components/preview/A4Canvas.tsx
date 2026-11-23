import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { useModelMarkdown } from '../../store/useModelMarkdown';
import { parseResumeMarkdown } from '../../parser/markdown';
import { applyPrintPageSize } from '../../utils/pageSizeCss';

// Sheet sizes at 96 DPI: A4 is 210 × 297 mm, US Letter is 8.5 × 11 in
const PAGE_PX = {
  A4: { w: 794, h: 1123 },
  Letter: { w: 816, h: 1056 },
} as const;

export const A4Canvas: React.FC = () => {
  const {
    workspaceMode,
    coverLetterMarkdown,
    theme,
    accentColor,
    compactSpacing,
    onePageMode,
    pageSize,
    fontSize,
    marginSize,
    lineHeight,
    zoom,
    setZoom,
    autoFitZoom,
    setPageCount,
  } = useResumeStoreV2();

  const PAGE = PAGE_PX[pageSize];
  useEffect(() => applyPrintPageSize(pageSize), [pageSize]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState<number>(PAGE.h);

  // Parse active markdown into sanitized HTML with icons and containers
  const modelMarkdown = useModelMarkdown();
  const activeMarkdown = workspaceMode === 'cover-letter' ? coverLetterMarkdown : modelMarkdown;
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
      // Phones always fit the page to the screen, so the preview is never cut off
      const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
      if (!containerRef.current || (!autoFitZoom && !phone)) return;
      const availableWidth = containerRef.current.clientWidth - 48; // padding
      const targetScale = Math.min(1.05, Math.max(phone ? 0.3 : 0.45, availableWidth / PAGE.w));
      setZoom(Number(targetScale.toFixed(2)));
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [autoFitZoom, setZoom, PAGE.w]);

  // Track sheet height to render page-break indicators and update page count in store
  useEffect(() => {
    if (!sheetRef.current) return;
    const observer = new ResizeObserver(() => {
      if (sheetRef.current) {
        const height = sheetRef.current.offsetHeight;
        setSheetHeight(height);
        const calculatedPages = Math.max(1, Math.ceil((height - 20) / PAGE.h));
        setPageCount(calculatedPages);
      }
    });
    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [parsedHtml, compactSpacing, theme, fontSize, marginSize, lineHeight, setPageCount, PAGE.h]);

  // Calculate page break positions
  const numPages = Math.max(1, Math.ceil((sheetHeight - 20) / PAGE.h));
  const pageBreaks = useMemo(() => {
    const breaks = [];
    for (let i = 1; i < numPages; i++) {
      breaks.push(i * PAGE.h);
    }
    return breaks;
  }, [numPages, PAGE.h]);

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
          className={`a4-sheet mx-auto page-${pageSize.toLowerCase()} template-${theme} font-size-${fontSize} margin-${marginSize} line-height-${lineHeight} ${
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
