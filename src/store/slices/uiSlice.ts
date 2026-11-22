/**
 * Zustand store slice: UI state management
 * Theme, zoom, modals, tabs, etc.
 */

import { UiTheme, MobileViewTab, EditorViewMode, ActiveSidePanel } from '../../types';
import { saveSetting } from '../../services/persistence';

export interface UISliceState {
  // Theme & appearance
  uiTheme: UiTheme;
  setUiTheme: (theme: UiTheme) => Promise<void>;
  toggleUiTheme: () => Promise<void>;

  // Canvas
  zoom: number;
  setZoom: (zoom: number) => Promise<void>;
  autoFitZoom: boolean;
  setAutoFitZoom: (autoFit: boolean) => Promise<void>;

  // Modals & side panels
  libraryModalOpen: boolean;
  setLibraryModalOpen: (open: boolean) => void;
  shareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
  activeModal: 'history' | 'shortcuts' | 'import' | 'ats' | 'presets' | null;
  setActiveModal: (modal: any) => void;
  activeSidePanel: ActiveSidePanel;
  setActiveSidePanel: (panel: ActiveSidePanel) => void;

  // Editor
  editorViewMode: EditorViewMode;
  setEditorViewMode: (mode: EditorViewMode) => Promise<void>;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Mobile
  mobileTab: MobileViewTab;
  setMobileTab: (tab: MobileViewTab) => void;

  // Recruiter view
  recruiterViewMode: boolean;
  setRecruiterViewMode: (mode: boolean) => void;

  // Misc
  pageCount: number;
  setPageCount: (count: number) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

/**
 * Create UI slice
 */
export function createUISlice(set: any, get: any): UISliceState {
  return {
    uiTheme: 'dark',
    setUiTheme: async (theme: UiTheme) => {
      set({ uiTheme: theme });
      await saveSetting('uiTheme', theme);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    },

    toggleUiTheme: async () => {
      const { uiTheme } = get();
      const nextTheme = uiTheme === 'dark' ? 'light' : 'dark';
      await get().setUiTheme(nextTheme);
    },

    zoom: 1,
    setZoom: async (zoom: number) => {
      set({ zoom });
      await saveSetting('zoom', zoom);
    },

    autoFitZoom: false,
    setAutoFitZoom: async (autoFit: boolean) => {
      set({ autoFitZoom: autoFit });
      await saveSetting('autoFitZoom', autoFit);
    },

    libraryModalOpen: false,
    setLibraryModalOpen: (open: boolean) => {
      set({ libraryModalOpen: open });
    },

    shareModalOpen: false,
    setShareModalOpen: (open: boolean) => {
      set({ shareModalOpen: open });
    },

    activeModal: null,
    setActiveModal: (modal: any) => {
      set({ activeModal: modal });
    },

    activeSidePanel: 'none',
    setActiveSidePanel: (panel: ActiveSidePanel) => {
      set({ activeSidePanel: panel });
    },

    editorViewMode: 'markdown',
    setEditorViewMode: async (mode: EditorViewMode) => {
      set({ editorViewMode: mode });
      await saveSetting('editorViewMode', mode);
    },

    commandPaletteOpen: false,
    setCommandPaletteOpen: (open: boolean) => {
      set({ commandPaletteOpen: open });
    },

    mobileTab: 'editor',
    setMobileTab: (tab: MobileViewTab) => {
      set({ mobileTab: tab });
    },

    recruiterViewMode: false,
    setRecruiterViewMode: (mode: boolean) => {
      set({ recruiterViewMode: mode });
    },

    pageCount: 1,
    setPageCount: (count: number) => {
      set({ pageCount: count });
    },

    isSaving: false,
    setIsSaving: (saving: boolean) => {
      set({ isSaving: saving });
    },
  };
}
