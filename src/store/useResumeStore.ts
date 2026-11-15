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
  ResumeProfile,
  WorkspaceMode,
  ActiveSidePanel,
} from '../types';
import { SAMPLE_RESUME } from '../data/sampleResume';
import { SAMPLE_COVER_LETTER } from '../data/sampleCoverLetter';
import { ACCENT_COLORS } from '../data/templates';

const STORAGE_KEY = 'resumeos_state_v1';
const HISTORY_KEY = 'resumeos_history_v1';
const PROFILES_KEY = 'resumeos_profiles_v1';
const COVER_LETTER_KEY = 'resumeos_cover_letter_v1';
const JOB_DESC_KEY = 'resumeos_job_desc_v1';

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
    accentColor: ACCENT_COLORS[0].hex, // Terracotta (#c96442)
    onePageMode: false,
    compactSpacing: false,
    uiTheme: 'dark',
    fontSize: 'medium',
    marginSize: 'normal',
    lineHeight: 'normal',
  };
}

function loadInitialProfiles(initialState: StoredState): { profiles: ResumeProfile[]; activeId: string } {
  try {
    const saved = localStorage.getItem(PROFILES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { profiles: parsed, activeId: parsed[0].id };
      }
    }
  } catch (e) {
    console.error('Failed to load profiles:', e);
  }
  const defaultProfile: ResumeProfile = {
    id: 'default-1',
    title: 'Alex Morgan - Staff Engineer',
    targetRole: 'Staff Software Engineer',
    markdown: initialState.markdown,
    theme: initialState.theme,
    accentColor: initialState.accentColor,
    fontSize: initialState.fontSize,
    marginSize: initialState.marginSize,
    lineHeight: initialState.lineHeight,
    updatedAt: Date.now(),
  };
  return { profiles: [defaultProfile], activeId: defaultProfile.id };
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
  // Profiles & Library
  resumes: ResumeProfile[];
  activeResumeId: string;
  createResume: (title?: string, templateMarkdown?: string, targetRole?: string) => string;
  switchResume: (id: string) => void;
  duplicateResume: (id: string) => string;
  deleteResume: (id: string) => void;
  renameResume: (id: string, title: string) => void;
  syncActiveProfileWithStore: () => void;

  // Workspace Mode & Cover Letter
  workspaceMode: WorkspaceMode;
  coverLetterMarkdown: string;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setCoverLetterMarkdown: (md: string) => void;

  // Side Panels (Job Tailor & Bullet Linter)
  activeSidePanel: ActiveSidePanel;
  targetJobDescription: string;
  setActiveSidePanel: (panel: ActiveSidePanel) => void;
  setTargetJobDescription: (jd: string) => void;

  // Modals & Panels
  libraryModalOpen: boolean;
  shareModalOpen: boolean;
  recruiterViewMode: boolean;
  setLibraryModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setRecruiterViewMode: (mode: boolean) => void;

  // Page Budget & Auto-Fit
  fitToOnePage: () => void;

  // Standard Canvas & Editor state
  zoom: number;
  autoFitZoom: boolean;
  history: ResumeRevision[];
  activeModal: 'history' | 'shortcuts' | 'import' | 'ats' | 'presets' | null;
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
  setActiveModal: (modal: 'history' | 'shortcuts' | 'import' | 'ats' | 'presets' | null) => void;
}

const initial = loadInitialState();
const initialProfilesData = loadInitialProfiles(initial);

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  ...initial,

  // Profiles
  resumes: initialProfilesData.profiles,
  activeResumeId: initialProfilesData.activeId,

  // Workspace Mode & Cover Letter
  workspaceMode: 'resume',
  coverLetterMarkdown: (typeof localStorage !== 'undefined' && localStorage.getItem(COVER_LETTER_KEY)) || SAMPLE_COVER_LETTER,

  // Side Panels
  activeSidePanel: 'none',
  targetJobDescription: (typeof localStorage !== 'undefined' && localStorage.getItem(JOB_DESC_KEY)) || '',

  // Modals
  libraryModalOpen: false,
  shareModalOpen: false,
  recruiterViewMode: false,

  setLibraryModalOpen: (libraryModalOpen) => set({ libraryModalOpen }),
  setShareModalOpen: (shareModalOpen) => set({ shareModalOpen }),
  setRecruiterViewMode: (recruiterViewMode) => set({ recruiterViewMode }),

  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
  setCoverLetterMarkdown: (coverLetterMarkdown) => {
    set({ coverLetterMarkdown, isSaving: true });
    try {
      localStorage.setItem(COVER_LETTER_KEY, coverLetterMarkdown);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => set({ isSaving: false }), 300);
  },

  setActiveSidePanel: (activeSidePanel) => set({ activeSidePanel }),
  setTargetJobDescription: (targetJobDescription) => {
    set({ targetJobDescription });
    try {
      localStorage.setItem(JOB_DESC_KEY, targetJobDescription);
    } catch (e) {
      console.error(e);
    }
  },

  // Auto-fit to 1 page
  fitToOnePage: () => {
    const current = get();
    current.saveRevision('Pre-fit Snapshot');

    const nextMargin: MarginOption = current.marginSize === 'relaxed' ? 'normal' : 'narrow';
    const nextLineHeight: LineHeightOption = current.lineHeight === 'relaxed' ? 'normal' : 'tight';
    const nextFontSize: FontSizeOption = current.fontSize === 'large' ? 'medium' : current.fontSize === 'medium' ? 'small' : 'small';

    const updates = {
      compactSpacing: true,
      marginSize: nextMargin,
      lineHeight: nextLineHeight,
      fontSize: nextFontSize,
      onePageMode: true,
    };

    set(updates);
    persistCurrentState({ ...current, ...updates });
    get().syncActiveProfileWithStore();
    get().saveRevision('Auto-fitted to 1 Page');
  },

  // Profile Methods
  syncActiveProfileWithStore: () => {
    const { activeResumeId, resumes, markdown, theme, accentColor, fontSize, marginSize, lineHeight, documentTitle } = get();
    const updated = resumes.map((r) => {
      if (r.id === activeResumeId) {
        return {
          ...r,
          title: documentTitle || r.title,
          markdown,
          theme,
          accentColor,
          fontSize,
          marginSize,
          lineHeight,
          updatedAt: Date.now(),
        };
      }
      return r;
    });
    set({ resumes: updated });
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  },

  createResume: (title = 'Untitled Resume', templateMarkdown = SAMPLE_RESUME, targetRole = 'Target Role') => {
    const newId = `resume-${Date.now()}`;
    const newProfile: ResumeProfile = {
      id: newId,
      title,
      targetRole,
      markdown: templateMarkdown,
      theme: get().theme,
      accentColor: get().accentColor,
      fontSize: get().fontSize,
      marginSize: get().marginSize,
      lineHeight: get().lineHeight,
      updatedAt: Date.now(),
    };
    const updated = [newProfile, ...get().resumes];
    set({
      resumes: updated,
      activeResumeId: newId,
      documentTitle: title,
      markdown: templateMarkdown,
    });
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    persistCurrentState({ ...get(), markdown: templateMarkdown });
    get().saveRevision(`Created ${title}`);
    return newId;
  },

  switchResume: (id) => {
    const target = get().resumes.find((r) => r.id === id);
    if (!target) return;
    // Save current before switching
    get().syncActiveProfileWithStore();

    set({
      activeResumeId: id,
      documentTitle: target.title,
      markdown: target.markdown,
      theme: target.theme,
      accentColor: target.accentColor,
      fontSize: target.fontSize,
      marginSize: target.marginSize,
      lineHeight: target.lineHeight,
    });
    persistCurrentState({
      ...get(),
      markdown: target.markdown,
      theme: target.theme,
      accentColor: target.accentColor,
      fontSize: target.fontSize,
      marginSize: target.marginSize,
      lineHeight: target.lineHeight,
    });
  },

  duplicateResume: (id) => {
    const source = get().resumes.find((r) => r.id === id) || get().resumes[0];
    const newId = `resume-${Date.now()}`;
    const newTitle = `${source.title} (Copy)`;
    const newProfile: ResumeProfile = {
      ...source,
      id: newId,
      title: newTitle,
      updatedAt: Date.now(),
    };
    const updated = [newProfile, ...get().resumes];
    set({
      resumes: updated,
      activeResumeId: newId,
      documentTitle: newTitle,
      markdown: newProfile.markdown,
      theme: newProfile.theme,
      accentColor: newProfile.accentColor,
      fontSize: newProfile.fontSize,
      marginSize: newProfile.marginSize,
      lineHeight: newProfile.lineHeight,
    });
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    persistCurrentState({ ...get(), markdown: newProfile.markdown });
    get().saveRevision(`Cloned from ${source.title}`);
    return newId;
  },

  deleteResume: (id) => {
    const { resumes, activeResumeId } = get();
    if (resumes.length <= 1) return; // Keep at least one
    const updated = resumes.filter((r) => r.id !== id);
    const nextActive = activeResumeId === id ? updated[0] : resumes.find((r) => r.id === activeResumeId)!;
    set({
      resumes: updated,
      activeResumeId: nextActive.id,
      documentTitle: nextActive.title,
      markdown: nextActive.markdown,
      theme: nextActive.theme,
      accentColor: nextActive.accentColor,
      fontSize: nextActive.fontSize,
      marginSize: nextActive.marginSize,
      lineHeight: nextActive.lineHeight,
    });
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    persistCurrentState({ ...get(), markdown: nextActive.markdown });
  },

  renameResume: (id, title) => {
    const updated = get().resumes.map((r) => (r.id === id ? { ...r, title, updatedAt: Date.now() } : r));
    set({ resumes: updated });
    if (get().activeResumeId === id) {
      set({ documentTitle: title });
    }
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  },

  // Standard Canvas & Editor
  zoom: 1.0,
  autoFitZoom: true,
  history: loadInitialHistory(),
  activeModal: null,
  pageCount: 1,
  isSaving: false,
  documentTitle: initialProfilesData.profiles[0]?.title || 'Alex Morgan - Resume',
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
    get().syncActiveProfileWithStore();
    setTimeout(() => {
      set({ isSaving: false });
    }, 350);
  },

  setTheme: (theme) => {
    set({ theme });
    persistCurrentState({ ...get(), theme });
    get().syncActiveProfileWithStore();
  },

  setAccentColor: (accentColor) => {
    set({ accentColor });
    persistCurrentState({ ...get(), accentColor });
    get().syncActiveProfileWithStore();
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    persistCurrentState({ ...get(), fontSize });
    get().syncActiveProfileWithStore();
  },

  setMarginSize: (marginSize) => {
    set({ marginSize });
    persistCurrentState({ ...get(), marginSize });
    get().syncActiveProfileWithStore();
  },

  setLineHeight: (lineHeight) => {
    set({ lineHeight });
    persistCurrentState({ ...get(), lineHeight });
    get().syncActiveProfileWithStore();
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
  setDocumentTitle: (documentTitle) => {
    set({ documentTitle });
    get().syncActiveProfileWithStore();
  },

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
    get().syncActiveProfileWithStore();
  },

  resetToSample: () => {
    const sampleState = {
      markdown: SAMPLE_RESUME,
      theme: 'modern' as TemplateId,
      accentColor: ACCENT_COLORS[0].hex,
      onePageMode: false,
      compactSpacing: false,
      uiTheme: get().uiTheme,
      fontSize: 'medium' as FontSizeOption,
      marginSize: 'normal' as MarginOption,
      lineHeight: 'normal' as LineHeightOption,
    };
    set(sampleState);
    persistCurrentState({ ...get(), ...sampleState });
    get().syncActiveProfileWithStore();
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
