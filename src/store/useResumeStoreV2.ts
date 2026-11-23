/**
 * The single app store.
 *
 * Source of truth: `currentResume` (structured Resume model).
 * The editor works on `markdown`, the raw text buffer. Every text edit is parsed
 * into the model, and every model change keeps `markdown` in step with it.
 * Design settings (template, accent, typography, spacing) live on the model.
 * UI state and the job tracker are global.
 *
 * All persistence goes through services/persistence.ts (IndexedDB, localStorage fallback).
 */

import { create } from 'zustand';
import { Resume, createResume, cloneResume, newResumeId } from '../model/resume';
import { markdownToResume, resumeToMarkdown } from '../model/serialize';
import { runMigrationOnStartup } from '../model/migrate';
import { JobApplication, ApplicationStats, createApplication, calculateStats } from '../model/tracker';
import {
  ResumeRevision,
  TemplateId,
  FontSizeOption,
  MarginOption,
  LineHeightOption,
  UiTheme,
  EditorViewMode,
  MobileViewTab,
  WorkspaceMode,
  ActiveSidePanel,
} from '../types';
import {
  initializePersistence,
  saveResume,
  deleteResume as deleteResumeRecord,
  loadAllResumes,
  saveSetting,
  loadSetting,
  saveRevision as persistRevision,
  loadRevisions,
  deleteRevision as deleteRevisionRecord,
} from '../services/persistence';
import { undoRedoManager } from '../services/undoRedo';
import { jobIdOf } from '../intelligence/tailor';
import { SAMPLE_RESUME } from '../data/sampleResume';
import { SAMPLE_COVER_LETTER } from '../data/sampleCoverLetter';

export type ModalName = 'history' | 'shortcuts' | 'import' | 'presets' | 'tracker' | 'cover-letter' | null;

export const EMPTY_STATS: ApplicationStats = {
  total: 0,
  byStatus: { saved: 0, applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 },
  thisMonth: 0,
  conversionRate: 0,
};

/** Mirror fields derived from the current model, read by the components */
interface DerivedFields {
  documentTitle: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
  compactSpacing: boolean;
  onePageMode: boolean;
}

function deriveFields(resume: Resume | null): Partial<DerivedFields> {
  if (!resume) {
    return { documentTitle: '', markdown: '' };
  }
  return {
    documentTitle: resume.meta.title,
    markdown: resumeToMarkdown(resume),
    theme: resume.design.template as TemplateId,
    accentColor: resume.design.accent,
    fontSize: resume.design.fontSize as FontSizeOption,
    marginSize: resume.design.margin as MarginOption,
    lineHeight: resume.design.lineHeight as LineHeightOption,
    compactSpacing: !!resume.design.compactSpacing,
    onePageMode: !!resume.design.onePageMode,
  };
}

export interface ResumeStoreV2 extends DerivedFields {
  // Documents
  resumes: Resume[];
  activeResumeId: string;
  currentResume: Resume | null;
  isSaving: boolean;
  lastSavedAt: number | null;
  loadResumes: () => Promise<void>;
  switchResume: (id: string) => void;
  createResume: (title?: string, templateMarkdown?: string, targetRole?: string) => string;
  duplicateResume: (id: string) => string;
  renameResume: (id: string, title: string) => void;
  deleteResume: (id: string) => void;
  setDocumentTitle: (title: string) => void;

  // Editing
  /** Apply a change made in the form editor (undoable; the text view is re-derived) */
  updateModel: (mutate: (resume: Resume) => Resume) => void;
  setMarkdown: (markdown: string) => void;
  setTheme: (theme: TemplateId) => void;
  setAccentColor: (accent: string) => void;
  setFontSize: (size: FontSizeOption) => void;
  setLineHeight: (height: LineHeightOption) => void;
  setMarginSize: (margin: MarginOption) => void;
  setCompactSpacing: (compact: boolean) => void;
  setOnePageMode: (onePage: boolean) => void;
  fitToOnePage: () => void;
  resetToSample: () => void;

  // Undo / redo (model level, coalesced while typing)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Named revisions (snapshots)
  revisions: ResumeRevision[];
  loadRevisionHistory: () => Promise<void>;
  saveRevision: (title?: string) => void;
  restoreRevision: (revision: ResumeRevision) => void;
  deleteRevision: (id: string) => void;

  // UI
  uiTheme: UiTheme;
  setUiTheme: (theme: UiTheme) => void;
  toggleUiTheme: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  autoFitZoom: boolean;
  setAutoFitZoom: (autoFit: boolean) => void;
  editorViewMode: EditorViewMode;
  setEditorViewMode: (mode: EditorViewMode) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  mobileTab: MobileViewTab;
  setMobileTab: (tab: MobileViewTab) => void;
  recruiterViewMode: boolean;
  setRecruiterViewMode: (mode: boolean) => void;
  libraryModalOpen: boolean;
  setLibraryModalOpen: (open: boolean) => void;
  shareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
  activeModal: ModalName;
  setActiveModal: (modal: ModalName) => void;
  activeSidePanel: ActiveSidePanel;
  setActiveSidePanel: (panel: ActiveSidePanel) => void;
  pageCount: number;
  setPageCount: (count: number) => void;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  // Cover letter
  coverLetterMarkdown: string;
  setCoverLetterMarkdown: (md: string) => void;

  // Job target
  targetJobDescription: string;
  setTargetJobDescription: (jd: string) => void;

  // Job tracker
  applications: JobApplication[];
  stats: ApplicationStats;
  addApplication: (company: string, role: string) => string;
  updateApplication: (id: string, updates: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;

  // Bullet builder seed: "Improve" on a bullet opens the inspector with its text
  bulletSeed: string;
  openBulletBuilder: (text: string) => void;

  // Tailoring: a linked copy for one job description
  tailorFor: (jobDescription: string) => string;

  // Import (file or pasted text, reviewed before it becomes a resume)
  pendingImportFile: File | null;
  openImport: (file?: File | null) => void;

  // Shared recruiter links (#view=...): in memory until the user keeps them
  openSharedView: (shared: SharedResumeView) => void;
  keepSharedResume: () => void;

  // Lifecycle
  initialize: () => Promise<void>;
}

export interface SharedResumeView {
  title: string;
  markdown: string;
  theme: TemplateId;
  accentColor: string;
  fontSize: FontSizeOption;
  marginSize: MarginOption;
  lineHeight: LineHeightOption;
}

// ---- persistence helpers -------------------------------------------------

let pendingSave: Resume | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

let initPromise: Promise<void> | null = null;

const DEBOUNCE_MS = 400;
const COALESCE_MS = 800;
let lastRecordAt = 0;

async function persistNow(resume: Resume, set: (p: Partial<ResumeStoreV2>) => void) {
  set({ isSaving: true });
  try {
    const ok = await saveResume(resume);
    if (ok) set({ lastSavedAt: Date.now() });
  } finally {
    set({ isSaving: false });
  }
}

function persistDebounced(resume: Resume, set: (p: Partial<ResumeStoreV2>) => void) {
  pendingSave = resume;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const toSave = pendingSave;
    pendingSave = null;
    saveTimer = null;
    if (toSave) void persistNow(toSave, set);
  }, DEBOUNCE_MS);
}

type LegacyResume = Resume & { source?: string };

/**
 * Records saved before the model was authoritative carry the editor text as `source`.
 * Re-parse that text once with the current parser, so the model has everything it can hold.
 */
function upgradeLegacyRecord(record: Resume): { resume: Resume; changed: boolean } {
  const legacy = record as LegacyResume;
  if (typeof legacy.source !== 'string') return { resume: record, changed: false };
  const parsed = markdownToResume(legacy.source, record.meta.title);
  return {
    resume: { ...parsed, id: record.id, meta: record.meta, design: record.design, schemaVersion: 2 },
    changed: true,
  };
}

function stamp(resume: Resume): Resume {
  return { ...resume, meta: { ...resume.meta, updatedAt: Date.now() } };
}

const SETTING_KEYS = {
  uiTheme: 'uiTheme',
  workspaceMode: 'workspaceMode',
  coverLetter: 'coverLetterMarkdown',
  targetJob: 'targetJobDescription',
  applications: 'applications',
} as const;

// ---- store ---------------------------------------------------------------

export const useResumeStoreV2 = create<ResumeStoreV2>((set, get) => {
  /**
   * The one place where the model changes.
   * - `markdown` is kept as given (the editor buffer) or derived from the model.
   * - Undo records the previous state, coalesced while typing.
   * - Persistence is debounced for typing and immediate for everything else.
   */
  const commit = (
    next: Resume,
    opts: { markdown?: string; record?: boolean; debounce?: boolean } = {}
  ) => {
    const state = get();
    const prev = state.currentResume;

    if (prev && opts.record !== false) {
      const now = Date.now();
      if (now - lastRecordAt > COALESCE_MS) undoRedoManager.record({ resume: prev, text: state.markdown });
      lastRecordAt = now;
    }

    const text = opts.markdown ?? resumeToMarkdown(next);
    const stamped = stamp(next);
    set({
      currentResume: stamped,
      activeResumeId: stamped.id,
      resumes: state.resumes.some((r) => r.id === stamped.id)
        ? state.resumes.map((r) => (r.id === stamped.id ? stamped : r))
        : [stamped, ...state.resumes],
      ...deriveFields(stamped),
      markdown: text,
    });

    if (opts.debounce) persistDebounced(stamped, set);
    else void persistNow(stamped, set);
  };

  const requireResume = (): Resume | null => get().currentResume;

  // Design changes keep the text exactly as it is
  const setDesign = (patch: Partial<Resume['design']>) => {
    const cur = requireResume();
    if (!cur) return;
    commit({ ...cur, design: { ...cur.design, ...patch } }, { markdown: get().markdown });
  };

  return {
    // ---- documents --------------------------------------------------------
    resumes: [],
    activeResumeId: '',
    currentResume: null,
    isSaving: false,
    lastSavedAt: null,
    bulletSeed: '',
    openBulletBuilder: (text) => set({ activeSidePanel: 'linter', bulletSeed: text }),
    tailorFor: (jobDescription) => {
      const cur = requireResume();
      if (!cur) return '';
      const jobId = jobIdOf(jobDescription);
      // Already a copy for this job: keep it
      if (cur.meta.targetJobId === jobId) return cur.id;
      const copyId = get().duplicateResume(cur.id);
      get().renameResume(copyId, `${cur.meta.title} (tailored)`);
      get().updateModel((r) => ({ ...r, meta: { ...r.meta, targetJobId: jobId } }));
      get().setTargetJobDescription(jobDescription);
      return copyId;
    },
    documentTitle: '',
    markdown: '',
    theme: 'modern',
    accentColor: '#c96442',
    fontSize: 'medium',
    marginSize: 'normal',
    lineHeight: 'normal',
    compactSpacing: false,
    onePageMode: false,

    loadResumes: async () => {
      const loaded = await loadAllResumes();
      // Re-parse records saved with the old editor-text field, and persist the result once
      const upgraded = loaded.map(upgradeLegacyRecord);
      for (const u of upgraded) if (u.changed) void saveResume(u.resume);
      const resumes = upgraded.map((u) => u.resume);
      const sorted = [...resumes].sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);
      const first = sorted[0] ?? null;
      set({
        resumes: sorted,
        activeResumeId: first?.id ?? '',
        currentResume: first,
        ...deriveFields(first),
      });
    },

    switchResume: (id) => {
      const target = get().resumes.find((r) => r.id === id);
      if (!target) return;
      lastRecordAt = 0;
      set({ activeResumeId: id, currentResume: target, ...deriveFields(target) });
      void get().loadRevisionHistory();
    },

    createResume: (title = 'Untitled Resume', templateMarkdown, targetRole) => {
      const base = templateMarkdown
        ? markdownToResume(templateMarkdown, title)
        : createResume(title, { targetRole });
      const resume: Resume = {
        ...base,
        meta: { ...base.meta, title, targetRole: targetRole ?? base.meta.targetRole },
      };
      lastRecordAt = 0;
      set({ resumes: [resume, ...get().resumes] });
      commit(resume, { markdown: templateMarkdown ?? resumeToMarkdown(resume), record: false });
      void get().loadRevisionHistory();
      return resume.id;
    },

    duplicateResume: (id) => {
      const source = get().resumes.find((r) => r.id === id);
      if (!source) return '';
      const copy = cloneResume(source);
      lastRecordAt = 0;
      set({ resumes: [copy, ...get().resumes] });
      commit(copy, { record: false });
      return copy.id;
    },

    renameResume: (id, title) => {
      const target = get().resumes.find((r) => r.id === id);
      if (!target) return;
      const renamed: Resume = { ...target, meta: { ...target.meta, title } };
      if (get().activeResumeId === id) {
        commit(renamed, { record: false });
      } else {
        const stamped = stamp(renamed);
        set({ resumes: get().resumes.map((r) => (r.id === id ? stamped : r)) });
        void persistNow(stamped, set);
      }
    },

    deleteResume: (id) => {
      const { resumes, activeResumeId } = get();
      const remaining = resumes.filter((r) => r.id !== id);
      const nextActive =
        activeResumeId === id ? remaining[0] ?? null : remaining.find((r) => r.id === activeResumeId) ?? null;
      lastRecordAt = 0;
      undoRedoManager.clear();
      set({
        resumes: remaining,
        activeResumeId: nextActive?.id ?? '',
        currentResume: nextActive,
        ...deriveFields(nextActive),
      });
      void deleteResumeRecord(id);
    },

    setDocumentTitle: (title) => {
      const cur = requireResume();
      if (!cur) return;
      commit({ ...cur, meta: { ...cur.meta, title } });
    },

    // ---- editing ----------------------------------------------------------
    updateModel: (mutate) => {
      const cur = requireResume();
      if (!cur) return;
      commit(mutate(cur));
    },

    setMarkdown: (markdown) => {
      const cur = requireResume();
      if (!cur) {
        set({ markdown });
        return;
      }
      // Parse the text into the model. Keep identity, title and design.
      const parsed = markdownToResume(markdown, cur.meta.title);
      commit(
        {
          ...parsed,
          id: cur.id,
          schemaVersion: 2,
          meta: cur.meta,
          design: cur.design,
        },
        { markdown, debounce: true }
      );
    },

    setTheme: (theme) => setDesign({ template: theme }),
    setAccentColor: (accent) => setDesign({ accent }),
    setFontSize: (fontSize) => setDesign({ fontSize }),
    setLineHeight: (lineHeight) => setDesign({ lineHeight }),
    setMarginSize: (margin) => setDesign({ margin }),
    setCompactSpacing: (compactSpacing) => setDesign({ compactSpacing }),
    setOnePageMode: (onePageMode) => setDesign({ onePageMode }),

    fitToOnePage: () => {
      const cur = requireResume();
      if (!cur) return;
      get().saveRevision('Pre-fit Snapshot');

      const d = cur.design;
      const margin: MarginOption = d.margin === 'relaxed' ? 'normal' : 'narrow';
      const lineHeight: LineHeightOption = d.lineHeight === 'relaxed' ? 'normal' : 'tight';
      const fontSize: FontSizeOption = d.fontSize === 'large' ? 'medium' : 'small';

      commit({
        ...cur,
        design: { ...d, compactSpacing: true, margin, lineHeight, fontSize, onePageMode: true },
      });
      get().saveRevision('Auto-fitted to 1 Page');
    },

    resetToSample: () => {
      const cur = requireResume();
      if (!cur) return;
      const parsed = markdownToResume(SAMPLE_RESUME, cur.meta.title);
      commit({
        ...parsed,
        id: cur.id,
        schemaVersion: 2,
        meta: cur.meta,
        design: {
          template: 'modern',
          accent: '#c96442',
          fontSize: 'medium',
          margin: 'normal',
          lineHeight: 'normal',
          compactSpacing: false,
          onePageMode: false,
        },
      });
    },

    // ---- undo / redo ------------------------------------------------------
    undo: () => {
      const cur = requireResume();
      if (!cur) return;
      const previous = undoRedoManager.undo({ resume: cur, text: get().markdown });
      if (!previous) return;
      lastRecordAt = 0;
      commit(previous.resume, { markdown: previous.text, record: false });
    },

    redo: () => {
      const cur = requireResume();
      if (!cur) return;
      const next = undoRedoManager.redo({ resume: cur, text: get().markdown });
      if (!next) return;
      lastRecordAt = 0;
      commit(next.resume, { markdown: next.text, record: false });
    },

    canUndo: () => undoRedoManager.canUndo(),
    canRedo: () => undoRedoManager.canRedo(),

    // ---- revisions --------------------------------------------------------
    revisions: [],

    loadRevisionHistory: async () => {
      const id = get().activeResumeId;
      if (!id) {
        set({ revisions: [] });
        return;
      }
      const revisions = (await loadRevisions(id)) as ResumeRevision[];
      // Only apply if the user has not switched documents meanwhile
      if (get().activeResumeId === id) {
        set({ revisions: revisions.sort((a, b) => b.timestamp - a.timestamp) });
      }
    },

    saveRevision: (title = 'Snapshot') => {
      const cur = requireResume();
      if (!cur) return;
      const revision: ResumeRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        title,
        markdown: get().markdown,
        theme: cur.design.template as TemplateId,
        accentColor: cur.design.accent,
      };
      const all = [revision, ...get().revisions];
      set({ revisions: all.slice(0, 20) });
      void persistRevision(cur.id, revision);
      // Keep storage bounded: drop anything beyond the 20 most recent
      all.slice(20).forEach((r) => void deleteRevisionRecord(r.id, cur.id));
    },

    restoreRevision: (revision) => {
      const cur = requireResume();
      if (!cur) return;
      get().saveRevision(`Before restoring "${revision.title}"`);
      const parsed = markdownToResume(revision.markdown, cur.meta.title);
      commit(
        {
          ...parsed,
          id: cur.id,
          schemaVersion: 2,
          meta: cur.meta,
          design: {
            ...cur.design,
            template: revision.theme,
            accent: revision.accentColor,
          },
        },
        { markdown: revision.markdown }
      );
    },

    deleteRevision: (id) => {
      const cur = requireResume();
      set({ revisions: get().revisions.filter((r) => r.id !== id) });
      if (cur) void deleteRevisionRecord(id, cur.id);
    },

    // ---- UI ---------------------------------------------------------------
    uiTheme: 'dark',
    setUiTheme: (uiTheme) => {
      set({ uiTheme });
      void saveSetting(SETTING_KEYS.uiTheme, uiTheme);
    },
    toggleUiTheme: () => get().setUiTheme(get().uiTheme === 'dark' ? 'light' : 'dark'),

    zoom: 1,
    setZoom: (zoom) => set({ zoom, autoFitZoom: false }),
    autoFitZoom: false,
    setAutoFitZoom: (autoFitZoom) => set({ autoFitZoom }),

    editorViewMode: 'form',
    setEditorViewMode: (editorViewMode) => set({ editorViewMode }),
    commandPaletteOpen: false,
    setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
    mobileTab: 'editor',
    setMobileTab: (mobileTab) => set({ mobileTab }),
    recruiterViewMode: false,
    setRecruiterViewMode: (recruiterViewMode) => set({ recruiterViewMode }),
    libraryModalOpen: false,
    setLibraryModalOpen: (libraryModalOpen) => set({ libraryModalOpen }),
    shareModalOpen: false,
    setShareModalOpen: (shareModalOpen) => set({ shareModalOpen }),
    activeModal: null,
    setActiveModal: (activeModal) => set({ activeModal }),
    activeSidePanel: 'none',
    setActiveSidePanel: (activeSidePanel) => set({ activeSidePanel }),
    pageCount: 1,
    setPageCount: (pageCount) => set({ pageCount }),
    workspaceMode: 'resume',
    setWorkspaceMode: (workspaceMode) => {
      set({ workspaceMode });
      void saveSetting(SETTING_KEYS.workspaceMode, workspaceMode);
    },

    // ---- cover letter -----------------------------------------------------
    coverLetterMarkdown: SAMPLE_COVER_LETTER,
    setCoverLetterMarkdown: (coverLetterMarkdown) => {
      set({ coverLetterMarkdown });
      void saveSetting(SETTING_KEYS.coverLetter, coverLetterMarkdown);
    },

    // ---- job target -------------------------------------------------------
    targetJobDescription: '',
    setTargetJobDescription: (targetJobDescription) => {
      set({ targetJobDescription });
      void saveSetting(SETTING_KEYS.targetJob, targetJobDescription);
    },

    // ---- tracker ----------------------------------------------------------
    applications: [],
    stats: EMPTY_STATS,

    addApplication: (company, role) => {
      const app = createApplication(company, role);
      const updated = [app, ...get().applications];
      set({ applications: updated, stats: calculateStats(updated) });
      void saveSetting(SETTING_KEYS.applications, updated);
      return app.id;
    },

    updateApplication: (id, updates) => {
      const updated = get().applications.map((a) =>
        a.id === id ? { ...a, ...updates, lastUpdated: Date.now() } : a
      );
      set({ applications: updated, stats: calculateStats(updated) });
      void saveSetting(SETTING_KEYS.applications, updated);
    },

    deleteApplication: (id) => {
      const updated = get().applications.filter((a) => a.id !== id);
      set({ applications: updated, stats: calculateStats(updated) });
      void saveSetting(SETTING_KEYS.applications, updated);
    },

    // ---- import -----------------------------------------------------------
    pendingImportFile: null,
    openImport: (file = null) => set({ activeModal: 'import', pendingImportFile: file }),

    // ---- shared recruiter view -------------------------------------------
    openSharedView: (shared) => {
      const resume = markdownToResume(shared.markdown, shared.title);
      const view: Resume = {
        ...resume,
        id: 'shared-view',
        schemaVersion: 2,
        meta: { ...resume.meta, title: shared.title },
        design: {
          template: shared.theme,
          accent: shared.accentColor,
          fontSize: shared.fontSize,
          margin: shared.marginSize,
          lineHeight: shared.lineHeight,
        },
      };
      // Not added to `resumes` and not persisted: viewing a link saves nothing
      set({
        currentResume: view,
        activeResumeId: '',
        recruiterViewMode: true,
        ...deriveFields(view),
      });
    },

    keepSharedResume: () => {
      const cur = requireResume();
      if (!cur) return;
      const kept: Resume = { ...cur, id: newResumeId(), meta: { ...cur.meta, createdAt: Date.now() } };
      set({ resumes: [kept, ...get().resumes], recruiterViewMode: false });
      commit(kept, { record: false });
    },

    // ---- lifecycle --------------------------------------------------------
    initialize: () => {
      // Guard: React StrictMode and remounts must not run startup twice
      if (!initPromise) initPromise = runInitialize(set, get);
      return initPromise;
    },
  };
});

async function runInitialize(
  set: (p: Partial<ResumeStoreV2>) => void,
  get: () => ResumeStoreV2
): Promise<void> {
  await initializePersistence();
  await runMigrationOnStartup();

  const [uiTheme, workspaceMode, coverLetter, targetJob, applications] = await Promise.all([
    loadSetting(SETTING_KEYS.uiTheme),
    loadSetting(SETTING_KEYS.workspaceMode),
    loadSetting(SETTING_KEYS.coverLetter),
    loadSetting(SETTING_KEYS.targetJob),
    loadSetting(SETTING_KEYS.applications),
  ]);

  const apps: JobApplication[] = Array.isArray(applications) ? applications : [];
  set({
    uiTheme: uiTheme === 'light' ? 'light' : 'dark',
    workspaceMode: workspaceMode === 'cover-letter' ? 'cover-letter' : 'resume',
    coverLetterMarkdown: typeof coverLetter === 'string' ? coverLetter : SAMPLE_COVER_LETTER,
    targetJobDescription: typeof targetJob === 'string' ? targetJob : '',
    applications: apps,
    stats: calculateStats(apps),
  });

  await get().loadResumes();
  await get().loadRevisionHistory();
}
