import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/navbar/Header';
import { EditorPane } from './components/editor/EditorPane';
import { A4Canvas } from './components/preview/A4Canvas';
import { HistoryModal } from './components/modals/HistoryModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { ImportModal } from './components/modals/ImportModal';
import { StatusBar } from './components/statusbar/StatusBar';

export const App: React.FC = () => {
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Navbar */}
      <Header />

      {/* Main Workspace (Editor + Split Divider + A4 Preview) */}
      <div className="flex-1 flex overflow-hidden relative">
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
          className="no-print w-1 bg-slate-800 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-colors flex items-center justify-center relative group z-20 flex-shrink-0"
          title="Drag to resize editor pane"
        >
          <div className="w-3 h-8 bg-slate-700 group-hover:bg-blue-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">
            <div className="w-[1px] h-4 bg-white/60" />
          </div>
        </div>

        {/* Right A4 Canvas Preview */}
        <div className="flex-1 h-full overflow-hidden bg-slate-900">
          <A4Canvas />
        </div>
      </div>

      {/* Bottom Unified Status Bar */}
      <StatusBar />

      {/* Modals */}
      <HistoryModal />
      <ShortcutsModal />
      <ImportModal />
    </div>
  );
};

export default App;
