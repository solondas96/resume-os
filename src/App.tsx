import React, { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { FirstRunWelcome } from './components/onboarding/FirstRunWelcome';
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import { BackupReminder } from './components/data/BackupReminder';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { setupUndoRedoKeyBindings } from './services/undoRedo';
import { useResumeStoreV2 } from './store/useResumeStoreV2';

// Loaded when opened, so their code is not in the startup bundle
const TrackerModal = React.lazy(() => import('./components/tracker/TrackerModal').then((m) => ({ default: m.TrackerModal })));
const CoverLetterModal = React.lazy(() => import('./components/cover/CoverLetterModal').then((m) => ({ default: m.CoverLetterModal })));
const ShareModal = React.lazy(() => import('./components/share/ShareModal').then((m) => ({ default: m.ShareModal })));
// The main screen loads after the first screen, so the first screen's download stays small
const Header = React.lazy(() => import('./components/navbar/Header').then((m) => ({ default: m.Header })));
const EditorPane = React.lazy(() => import('./components/editor/EditorPane').then((m) => ({ default: m.EditorPane })));
const A4Canvas = React.lazy(() => import('./components/preview/A4Canvas').then((m) => ({ default: m.A4Canvas })));
const StatusBar = React.lazy(() => import('./components/statusbar/StatusBar').then((m) => ({ default: m.StatusBar })));
const CommandPalette = React.lazy(() => import('./components/palette/CommandPalette').then((m) => ({ default: m.CommandPalette })));
const PresetsModal = React.lazy(() => import('./components/modals/PresetsModal').then((m) => ({ default: m.PresetsModal })));
const ImportModal = React.lazy(() => import('./components/modals/ImportModal').then((m) => ({ default: m.ImportModal })));
const Inspector = React.lazy(() => import('./components/inspector/Inspector').then((m) => ({ default: m.Inspector })));
const RecruiterView = React.lazy(() => import('./components/preview/RecruiterView').then((m) => ({ default: m.RecruiterView })));
const ResumeLibraryModal = React.lazy(() => import('./components/library/ResumeLibraryModal').then((m) => ({ default: m.ResumeLibraryModal })));

export const App: React.FC = () => {
  const initialize = useResumeStoreV2((s) => s.initialize);
  const uiTheme = useResumeStoreV2((s) => s.uiTheme);
  const inspectorTab = useResumeStoreV2((s) => s.inspectorTab);
  const libraryModalOpen = useResumeStoreV2((s) => s.libraryModalOpen);
  const shareModalOpen = useResumeStoreV2((s) => s.shareModalOpen);
  const activeModal = useResumeStoreV2((s) => s.activeModal);
  const commandPaletteOpen = useResumeStoreV2((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useResumeStoreV2((s) => s.setCommandPaletteOpen);

  // Cmd+K / Ctrl+K opens search and commands
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandPaletteOpen, setCommandPaletteOpen]);
  const mobileTab = useResumeStoreV2((s) => s.mobileTab);
  const setMobileTab = useResumeStoreV2((s) => s.setMobileTab);
  const openInspector = useResumeStoreV2((s) => s.openInspector);
  const closeInspector = useResumeStoreV2((s) => s.closeInspector);
  const recruiterViewMode = useResumeStoreV2((s) => s.recruiterViewMode);
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const openSharedView = useResumeStoreV2((s) => s.openSharedView);
  const openImport = useResumeStoreV2((s) => s.openImport);
  const createResume = useResumeStoreV2((s) => s.createResume);
  const setActiveModal = useResumeStoreV2((s) => s.setActiveModal);
  const undo = useResumeStoreV2((s) => s.undo);
  const redo = useResumeStoreV2((s) => s.redo);

  const [ready, setReady] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Startup: open the database, run the v1 -> v2 migration, load resumes
  useEffect(() => {
    let cancelled = false;
    initialize()
      .catch((e) => console.error('Startup failed:', e))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialize]);

  // Undo / redo keyboard shortcuts
  useEffect(() => setupUndoRedoKeyBindings(() => undo(), () => redo()), [undo, redo]);

  useEffect(() => {
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [uiTheme]);

  // Shared recruiter link (#view=...): previewed in memory, nothing is saved
  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    // Only a link with #view= needs the decoder, so it loads on demand
    if (!window.location.hash.startsWith('#view=')) return;
    void import('./utils/shareResume').then(({ parseShareHash }) => {
      const decoded = parseShareHash(window.location.hash);
      if (decoded) openSharedView(decoded);
    });
  }, [ready, openSharedView]);

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

  // If in Recruiter View Mode, render the dedicated public preview view
  if (recruiterViewMode) {
    return (
      <>
        <Suspense fallback={null}><RecruiterView /></Suspense>
        {activeModal === 'import' && <Suspense fallback={null}><ImportModal /></Suspense>}
      </>
    );
  }

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading your resumes…
      </div>
    );
  }

  // First run: no resumes yet
  if (!currentResume) {
    return (
      <>
        <FirstRunWelcome
          onUpload={(file) => openImport(file)}
          onStartFromRole={() => setActiveModal('presets')}
          onStartBlank={() => createResume('Untitled Resume')}
        />
        {activeModal === 'import' && <Suspense fallback={null}><ImportModal /></Suspense>}
        {activeModal === 'presets' && <Suspense fallback={null}><PresetsModal /></Suspense>}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen h-dvh w-screen overflow-hidden bg-desk text-ink font-sans transition-colors duration-150">
      {/* Top Navbar */}
      <ErrorBoundary area="The header" faultId="header" compact><Suspense fallback={null}><Header /></Suspense></ErrorBoundary>

      {/* Small tablets and small windows (640 to 767 px): one view at a time, under the header */}
      <div className="hidden sm:flex md:hidden items-center justify-center p-2 bg-surface border-b border-rule no-print">
        <div role="tablist" aria-label="Views" className="grid grid-cols-3 w-full max-w-sm bg-muted p-0.5 rounded-lg border border-rule text-xs">
          {(['editor', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={mobileTab === tab && !inspectorTab}
              onClick={() => {
                closeInspector();
                setMobileTab(tab);
              }}
              className={`min-h-[44px] rounded-md font-medium transition ${mobileTab === tab && !inspectorTab ? 'bg-pencil text-on-pencil' : 'text-graphite hover:text-ink'}`}
            >
              {tab === 'editor' ? 'Write' : 'Page'}
            </button>
          ))}
          <button
            role="tab"
            aria-selected={!!inspectorTab}
            onClick={() => (inspectorTab ? closeInspector() : openInspector('health'))}
            className={`min-h-[44px] rounded-md font-medium transition ${inspectorTab ? 'bg-pencil text-on-pencil' : 'text-graphite hover:text-ink'}`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Side-by-Side Split View (md and up). Only one layout is mounted at a time,
            so the editor is never duplicated in the DOM. */}
        {isDesktop && (
        <div className="flex w-full h-full overflow-hidden">
          {/* Left Editor */}
          <div
            style={{ width: `${editorWidth}px` }}
            className="no-print h-full shrink-0 bg-card border-r border-border"
          >
            <ErrorBoundary area="The editor" faultId="editor" compact><Suspense fallback={null}><EditorPane /></Suspense></ErrorBoundary>
          </div>

          {/* Resizable Splitter Bar */}
          <div
            onMouseDown={handleMouseDown}
            className="no-print w-1 bg-border hover:bg-brand active:bg-brand cursor-col-resize transition-colors flex items-center justify-center relative group z-20 shrink-0"
            title="Drag to resize editor pane"
          >
            <div className="w-2.5 h-7 bg-muted-foreground/30 group-hover:bg-brand rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-card">
              <div className="w-[1px] h-3.5 bg-background" />
            </div>
          </div>

          {/* Right A4 Canvas Preview */}
          <div className="flex-1 h-full overflow-hidden bg-background transition-colors">
            <ErrorBoundary area="The preview" faultId="preview" compact><Suspense fallback={null}><A4Canvas /></Suspense></ErrorBoundary>
          </div>
        </div>

        )}

        {/* Mobile Single Tab View (< md) */}
        {!isDesktop && (
        <div className="flex-1 w-full h-full overflow-hidden">
          {mobileTab === 'editor' ? (
            <div className="w-full h-full overflow-hidden bg-card">
              <ErrorBoundary area="The editor" faultId="editor" compact><Suspense fallback={null}><EditorPane /></Suspense></ErrorBoundary>
            </div>
          ) : (
            <div className="w-full h-full overflow-hidden bg-background transition-colors">
              <ErrorBoundary area="The preview" faultId="preview" compact><Suspense fallback={null}><A4Canvas /></Suspense></ErrorBoundary>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Bottom Unified Status Bar */}
      <div className="hidden sm:block">
        <ErrorBoundary area="The status bar" faultId="status" compact><Suspense fallback={null}><StatusBar /></Suspense></ErrorBoundary>
      </div>

      {/* Phones: the thumb-reach tab bar (Write, Page, Notes) */}
      <nav aria-label="Views" className="sm:hidden no-print shrink-0 bg-surface border-t border-rule pb-[env(safe-area-inset-bottom)]">
        <div role="tablist" className="grid grid-cols-3">
          {([
            { id: 'editor', label: 'Write' },
            { id: 'preview', label: 'Page' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={mobileTab === tab.id && !inspectorTab}
              onClick={() => {
                closeInspector();
                setMobileTab(tab.id);
              }}
              className={`min-h-[56px] text-sm font-medium transition ${mobileTab === tab.id && !inspectorTab ? 'text-pencil' : 'text-graphite'}`}
            >
              {tab.label}
            </button>
          ))}
          <button
            role="tab"
            aria-selected={!!inspectorTab}
            onClick={() => (inspectorTab ? closeInspector() : openInspector('health'))}
            className={`min-h-[56px] text-sm font-medium transition ${inspectorTab ? 'text-pencil' : 'text-graphite'}`}
          >
            Notes
          </button>
        </div>
      </nav>


      <BackupReminder />

      {/* The one inspector: Health, Match, Design, History */}
      {inspectorTab && (
        <ErrorBoundary area="The inspector" faultId="inspector" compact>
          <Suspense fallback={null}>
            <Inspector />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Modals & Command Palette */}
      {libraryModalOpen && (
        <Suspense fallback={null}>
          <ResumeLibraryModal />
        </Suspense>
      )}
      {shareModalOpen && (
        <Suspense fallback={null}>
          <ShareModal />
        </Suspense>
      )}
      <ShortcutsModal />
      <OnboardingTour />
      {activeModal === 'import' && <Suspense fallback={null}><ImportModal /></Suspense>}
      {activeModal === 'presets' && <Suspense fallback={null}><PresetsModal /></Suspense>}
      {activeModal === 'tracker' && (
        <Suspense fallback={null}>
          <TrackerModal />
        </Suspense>
      )}
      {activeModal === 'cover-letter' && (
        <Suspense fallback={null}>
          <CoverLetterModal />
        </Suspense>
      )}
      {commandPaletteOpen && <Suspense fallback={null}><CommandPalette /></Suspense>}
    </div>
  );
};

export default App;
