/**
 * Zustand store slice: Document/Resume management
 * Handles resume CRUD, switching between resumes, and sync to persistence
 */

import { Resume, createResume, cloneResume } from '../../model/resume';
import { saveResume, loadAllResumes, deleteResume } from '../../services/persistence';

export interface DocumentsSliceState {
  // Document state
  resumes: Resume[];
  activeResumeId: string;
  currentResume: Resume | null;

  // Document actions
  loadResumes: () => Promise<void>;
  switchResume: (id: string) => Promise<void>;
  createResume: (title?: string, template?: string) => Promise<string>;
  duplicateResume: (id: string) => Promise<string>;
  renameResume: (id: string, title: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  updateResumeModel: (resume: Resume) => Promise<void>;
  syncToStorage: () => Promise<void>;
}

/**
 * Create documents slice
 */
export function createDocumentsSlice(set: any, get: any): DocumentsSliceState {
  return {
    resumes: [],
    activeResumeId: '',
    currentResume: null,

    /**
     * Load all resumes from persistence
     */
    loadResumes: async () => {
      try {
        const resumes = await loadAllResumes();
        set({
          resumes,
          activeResumeId: resumes.length > 0 ? resumes[0].id : '',
          currentResume: resumes.length > 0 ? resumes[0] : null,
        });
      } catch (e) {
        console.error('Failed to load resumes:', e);
      }
    },

    /**
     * Switch active resume
     */
    switchResume: async (id: string) => {
      const { resumes } = get();
      const target = resumes.find((r: Resume) => r.id === id);

      if (!target) {
        console.error('Resume not found:', id);
        return;
      }

      set({
        activeResumeId: id,
        currentResume: target,
      });
    },

    /**
     * Create a new resume
     */
    createResume: async (title = 'Untitled Resume', template = 'modern'): Promise<string> => {
      const resume = createResume(title, { template });
      const { resumes } = get();

      const updated = [resume, ...resumes];
      set({
        resumes: updated,
        activeResumeId: resume.id,
        currentResume: resume,
      });

      await saveResume(resume);
      return resume.id;
    },

    /**
     * Duplicate a resume
     */
    duplicateResume: async (id: string): Promise<string> => {
      const { resumes } = get();
      const source = resumes.find((r: Resume) => r.id === id);

      if (!source) {
        console.error('Resume not found:', id);
        return '';
      }

      const copy = cloneResume(source);
      const updated = [copy, ...resumes];

      set({
        resumes: updated,
        activeResumeId: copy.id,
        currentResume: copy,
      });

      await saveResume(copy);
      return copy.id;
    },

    /**
     * Rename a resume
     */
    renameResume: async (id: string, title: string) => {
      const { resumes } = get();
      const updated = resumes.map((r: Resume) =>
        r.id === id ? { ...r, meta: { ...r.meta, title, updatedAt: Date.now() } } : r
      );

      set({ resumes: updated });

      const resume = updated.find((r: Resume) => r.id === id);
      if (resume) {
        await saveResume(resume);
      }
    },

    /**
     * Delete a resume
     */
    deleteResume: async (id: string) => {
      const { resumes, activeResumeId } = get();
      const updated = resumes.filter((r: Resume) => r.id !== id);

      let nextActive = activeResumeId;
      if (activeResumeId === id && updated.length > 0) {
        nextActive = updated[0].id;
      }

      set({
        resumes: updated,
        activeResumeId: nextActive,
        currentResume: updated.find((r: Resume) => r.id === nextActive) || null,
      });

      await deleteResume(id);
    },

    /**
     * Update the current resume model (from edited data)
     */
    updateResumeModel: async (resume: Resume) => {
      const { resumes } = get();
      const updated = resumes.map((r: Resume) => (r.id === resume.id ? resume : r));

      set({
        resumes: updated,
        currentResume: resume,
      });

      await saveResume(resume);
    },

    /**
     * Sync current resume to storage (called periodically or on save)
     */
    syncToStorage: async () => {
      const { currentResume } = get();
      if (currentResume) {
        await saveResume(currentResume);
      }
    },
  };
}
