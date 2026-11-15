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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-sans transition-colors duration-150">
      {/* Top Navbar */}
      <Header />

      {/* Mobile Tab Switcher (Visible on mobile/tablet screens < md) */}
      <div className="md:hidden flex items-center justify-center p-2 bg-muted/60 border-b border-border no-print transition-colors">
        <div className="grid grid-cols-2 w-full max-w-xs bg-muted p-0.5 rounded-lg border border-border text-xs">
          <button
            onClick={() => setMobileTab('editor')}
            className={`py-1.5 rounded-md font-medium transition ${
              mobileTab === 'editor'
                ? 'bg-primary text-primary-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Markdown Editor
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`py-1.5 rounded-md font-medium transition ${
              mobileTab === 'preview'
                ? 'bg-primary text-primary-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground'
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
            className="h-full flex-shrink-0 bg-card border-r border-border"
          >
            <EditorPane />
          </div>

          {/* Resizable Splitter Bar */}
          <div
            onMouseDown={handleMouseDown}
            className="no-print w-1 bg-border hover:bg-brand active:bg-brand cursor-col-resize transition-colors flex items-center justify-center relative group z-20 flex-shrink-0"
            title="Drag to resize editor pane"
          >
            <div className="w-2.5 h-7 bg-muted-foreground/30 group-hover:bg-brand rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-card">
              <div className="w-[1px] h-3.5 bg-background" />
            </div>
          </div>

          {/* Right A4 Canvas Preview */}
          <div className="flex-1 h-full overflow-hidden bg-background transition-colors">
            <A4Canvas />
          </div>
        </div>

        {/* Mobile Single Tab View (< md) */}
        <div className="md:hidden flex-1 w-full h-full overflow-hidden">
          {mobileTab === 'editor' ? (
            <div className="w-full h-full overflow-hidden bg-card">
              <EditorPane />
            </div>
          ) : (
            <div className="w-full h-full overflow-hidden bg-background transition-colors">
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
