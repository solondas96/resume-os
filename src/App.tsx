import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/navbar/Header';
import { EditorPane } from './components/editor/EditorPane';
import { A4Canvas } from './components/preview/A4Canvas';
import { HistoryModal } from './components/modals/HistoryModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { ImportModal } from './components/modals/ImportModal';
import { PresetsModal } from './components/modals/PresetsModal';
import { AtsMatcherModal } from './components/ats/AtsMatcherModal';
import { StatusBar } from './components/statusbar/StatusBar';
import { CommandPalette } from './components/palette/CommandPalette';
import { useResumeStore } from './store/useResumeStore';

export const App: React.FC = () => {
  const { uiTheme, mobileTab, setMobileTab } = useResumeStore();

  useEffect(() => {
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [uiTheme]);

  const [editorWidth, setEditorWidth] = useState<number>(() => {
    // Default to 45% of screen width or minimum 450px
    if (typeof window !== 'undefined') {
      return Math.max(420, Math.floor(window.innerWidth * 0.44));
    }
    return 500;
  });

  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.max(340, Math.min(window.innerWidth - 450, moveEvent.clientX));
      setEditorWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Top Navbar */}
      <Header />

      {/* Mobile Tab Switcher (Visible on mobile/tablet screens < md) */}
      <div className="md:hidden flex items-center justify-center p-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 no-print transition-colors">
        <div className="grid grid-cols-2 w-full max-w-xs bg-slate-200/80 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 text-xs">
          <button
            onClick={() => setMobileTab('editor')}
            className={`py-1.5 rounded-md font-semibold transition ${
              mobileTab === 'editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Markdown Editor
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`py-1.5 rounded-md font-semibold transition ${
              mobileTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            A4 Live Preview
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Side-by-Side Split View (md and up) */}
        <div className="hidden md:flex w-full h-full overflow-hidden">
          {/* Left Editor */}
          <div
            style={{ width: `${editorWidth}px` }}
            className="h-full flex-shrink-0"
          >
            <EditorPane />
          </div>

          {/* Resizable Splitter Bar */}
          <div
            onMouseDown={handleMouseDown}
            className="no-print w-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-colors flex items-center justify-center relative group z-20 flex-shrink-0"
            title="Drag to resize editor pane"
          >
            <div className="w-3 h-8 bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">
              <div className="w-[1px] h-4 bg-slate-500 dark:bg-white/60" />
            </div>
          </div>

          {/* Right A4 Canvas Preview */}
          <div className="flex-1 h-full overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors">
            <A4Canvas />
          </div>
        </div>

        {/* Mobile Single Tab View (< md) */}
        <div className="md:hidden flex-1 w-full h-full overflow-hidden">
          {mobileTab === 'editor' ? (
            <div className="w-full h-full overflow-hidden">
              <EditorPane />
            </div>
          ) : (
            <div className="w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors">
              <A4Canvas />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Unified Status Bar */}
      <StatusBar />

      {/* Modals & Command Palette */}
      <HistoryModal />
      <ShortcutsModal />
      <ImportModal />
      <PresetsModal />
      <AtsMatcherModal />
      <CommandPalette />
    </div>
  );
};

export default App;
