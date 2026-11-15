import { create } from 'zustand';
import {
  ResumeRevision,
  TemplateId,
  UiTheme,
  EditorViewMode,
  FontSizeOption,
  MarginOption,
  LineHeightOption,
  MobileViewTab,
} from '../types';
import { SAMPLE_RESUME } from '../data/sampleResume';
import { ACCENT_COLORS } from '../data/templates';

const STORAGE_KEY = 'resumeos_state_v1';
const HISTORY_KEY = 'resumeos_history_v1';

interface StoredState {
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  onePageMode: boolean;
  compactSpacing: boolean;
  uiTheme: UiTheme;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
}

function loadInitialState(): StoredState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        uiTheme: parsed.uiTheme || 'dark',
        fontSize: parsed.fontSize || 'medium',
        marginSize: parsed.marginSize || 'normal',
        lineHeight: parsed.lineHeight || 'normal',
      };
    }
  } catch (e) {
    console.error('Failed to load saved resume state:', e);
  }
  return {
    markdown: SAMPLE_RESUME,
    theme: 'modern',
    accentColor: ACCENT_COLORS[1].hex, // Pacific Blue
    onePageMode: false,
    compactSpacing: false,
    uiTheme: 'dark',
    fontSize: 'medium',
    marginSize: 'normal',
    lineHeight: 'normal',
  };
}

function loadInitialHistory(): ResumeRevision[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
  return [];
}

interface ResumeStoreState extends StoredState {
  zoom: number;
  autoFitZoom: boolean;
  history: ResumeRevision[];
  activeModal: 'history' | 'shortcuts' | 'import' | 'ats' | 'presets' | 'headroom' | null;
  pageCount: number;
  isSaving: boolean;
  documentTitle: string;
  editorViewMode: EditorViewMode;
  commandPaletteOpen: boolean;
  mobileTab: MobileViewTab;

  setMarkdown: (markdown: string) => void;
  setTheme: (theme: TemplateId) => void;
  setAccentColor: (accentColor: string) => void;
  setZoom: (zoom: number) => void;
  setAutoFitZoom: (autoFit: boolean) => void;
  setOnePageMode: (onePage: boolean) => void;
  setCompactSpacing: (compact: boolean) => void;
  setFontSize: (fontSize: FontSizeOption) => void;
  setMarginSize: (marginSize: MarginOption) => void;
  setLineHeight: (lineHeight: LineHeightOption) => void;
  setMobileTab: (tab: MobileViewTab) => void;
  setPageCount: (count: number) => void;
  setIsSaving: (isSaving: boolean) => void;
  setDocumentTitle: (title: string) => void;
  setUiTheme: (theme: UiTheme) => void;
  toggleUiTheme: () => void;
  setEditorViewMode: (mode: EditorViewMode) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  saveRevision: (title?: string) => void;
  restoreRevision: (revision: ResumeRevision) => void;
  resetToSample: () => void;
  setActiveModal: (modal: 'history' | 'shortcuts' | 'import' | 'ats' | 'presets' | 'headroom' | null) => void;
}

const initial = loadInitialState();

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  ...initial,
  zoom: 1.0,
  autoFitZoom: true,
  history: loadInitialHistory(),
  activeModal: null,
  pageCount: 1,
  isSaving: false,
  documentTitle: 'Alex Morgan - Resume',
  editorViewMode: 'markdown',
  commandPaletteOpen: false,
  mobileTab: 'editor',

  setUiTheme: (uiTheme) => {
    set({ uiTheme });
    persistCurrentState({ ...get(), uiTheme });
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleUiTheme: () => {
    const next = get().uiTheme === 'dark' ? 'light' : 'dark';
    get().setUiTheme(next);
  },

  setEditorViewMode: (editorViewMode) => set({ editorViewMode }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setMobileTab: (mobileTab) => set({ mobileTab }),

  setMarkdown: (markdown) => {
    set({ markdown, isSaving: true });
    persistCurrentState({ ...get(), markdown });
    setTimeout(() => {
      set({ isSaving: false });
    }, 400);
  },

  setTheme: (theme) => {
    set({ theme });
    persistCurrentState({ ...get(), theme });
  },

  setAccentColor: (accentColor) => {
    set({ accentColor });
    persistCurrentState({ ...get(), accentColor });
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    persistCurrentState({ ...get(), fontSize });
  },

  setMarginSize: (marginSize) => {
    set({ marginSize });
    persistCurrentState({ ...get(), marginSize });
  },

  setLineHeight: (lineHeight) => {
    set({ lineHeight });
    persistCurrentState({ ...get(), lineHeight });
  },

  setZoom: (zoom) => set({ zoom, autoFitZoom: false }),
  setAutoFitZoom: (autoFitZoom) => set({ autoFitZoom }),

  setOnePageMode: (onePageMode) => {
    set({ onePageMode });
    persistCurrentState({ ...get(), onePageMode });
  },

  setCompactSpacing: (compactSpacing) => {
    set({ compactSpacing });
    persistCurrentState({ ...get(), compactSpacing });
  },

  setPageCount: (pageCount) => set({ pageCount }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setDocumentTitle: (documentTitle) => set({ documentTitle }),

  saveRevision: (title) => {
    const { markdown, theme, accentColor, history } = get();
    const newRev: ResumeRevision = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: title || `Revision ${new Date().toLocaleTimeString()}`,
      markdown,
      theme,
      accentColor,
    };
    // Keep max 20 revisions
    const updatedHistory = [newRev, ...history.slice(0, 19)];
    set({ history: updatedHistory });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save revision to localStorage:', e);
    }
  },

  restoreRevision: (revision) => {
    set({
      markdown: revision.markdown,
      theme: revision.theme,
      accentColor: revision.accentColor,
    });
    persistCurrentState({
      ...get(),
      markdown: revision.markdown,
      theme: revision.theme,
      accentColor: revision.accentColor,
    });
  },

  resetToSample: () => {
    const sampleState = {
      markdown: SAMPLE_RESUME,
      theme: 'modern' as TemplateId,
      accentColor: ACCENT_COLORS[1].hex,
      onePageMode: false,
      compactSpacing: false,
      uiTheme: get().uiTheme,
      fontSize: 'medium' as FontSizeOption,
      marginSize: 'normal' as MarginOption,
      lineHeight: 'normal' as LineHeightOption,
    };
    set(sampleState);
    persistCurrentState({ ...get(), ...sampleState });
  },

  setActiveModal: (activeModal) => set({ activeModal }),
}));

function persistCurrentState(state: StoredState) {
  try {
    const payload = {
      markdown: state.markdown,
      theme: state.theme,
      accentColor: state.accentColor,
      onePageMode: state.onePageMode,
      compactSpacing: state.compactSpacing,
      uiTheme: state.uiTheme,
      fontSize: state.fontSize,
      marginSize: state.marginSize,
      lineHeight: state.lineHeight,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to persist resume state:', e);
  }
}
