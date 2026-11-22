/**
 * Zustand store slice: History management
 * Revisions/snapshots and undo/redo on the model
 */

import { Resume } from '../../model/resume';
import { ResumeRevision } from '../../types';
import { saveRevision, loadRevisions } from '../../services/persistence';
import { undoRedoManager } from '../../services/undoRedo';

export interface HistorySliceState {
  // Revisions (named snapshots)
  revisions: ResumeRevision[];
  saveRevision: (title?: string) => Promise<void>;
  restoreRevision: (revision: ResumeRevision) => void;
  deleteRevision: (id: string) => void;
  loadRevisionHistory: (resumeId: string) => Promise<void>;

  // Undo/Redo (model history)
  pushModelState: (resume: Resume, label?: string) => void;
  undo: (currentResume: Resume) => Resume | null;
  redo: (currentResume: Resume) => Resume | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

/**
 * Create history slice
 */
export function createHistorySlice(set: any, get: any): HistorySliceState {
  return {
    revisions: [],

    /**
     * Save a named snapshot
     */
    saveRevision: async (title = 'Snapshot') => {
      const { currentResume, revisions } = get();
      if (!currentResume) return;

      const revision: ResumeRevision = {
        id: `rev-${Date.now()}`,
        timestamp: Date.now(),
        title,
        markdown: '', // TODO: convert from resume model
        theme: currentResume.design.template as any,
        accentColor: currentResume.design.accent,
      };

      const updated = [...revisions, revision];
      set({ revisions: updated });

      await saveRevision(currentResume.id, revision);
    },

    /**
     * Restore a snapshot
     */
    restoreRevision: (revision: ResumeRevision) => {
      // TODO: Convert markdown back to model and load
      console.log('Restoring revision:', revision.id);
    },

    /**
     * Delete a revision
     */
    deleteRevision: (id: string) => {
      const { revisions } = get();
      set({ revisions: revisions.filter((r: ResumeRevision) => r.id !== id) });
    },

    /**
     * Load all revisions for a resume
     */
    loadRevisionHistory: async (resumeId: string) => {
      try {
        const revisions = await loadRevisions(resumeId);
        set({ revisions });
      } catch (e) {
        console.error('Failed to load revisions:', e);
      }
    },

    /**
     * Push current model state to undo stack
     */
    pushModelState: (resume: Resume, label?: string) => {
      undoRedoManager.pushState(resume, label);
    },

    /**
     * Undo last action
     */
    undo: (currentResume: Resume): Resume | null => {
      if (!undoRedoManager.canUndo()) return null;

      // Push current to redo stack before undoing
      undoRedoManager.pushToRedoStack(currentResume, 'Redo');

      return undoRedoManager.undo();
    },

    /**
     * Redo last undone action
     */
    redo: (currentResume: Resume): Resume | null => {
      if (!undoRedoManager.canRedo()) return null;

      // Push current to undo stack before redoing
      undoRedoManager.pushState(currentResume, 'Undo');

      return undoRedoManager.redo();
    },

    /**
     * Check if undo available
     */
    canUndo: () => undoRedoManager.canUndo(),

    /**
     * Check if redo available
     */
    canRedo: () => undoRedoManager.canRedo(),

    /**
     * Clear all history
     */
    clearHistory: () => {
      undoRedoManager.clear();
      set({ revisions: [] });
    },
  };
}
