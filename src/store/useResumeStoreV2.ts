/**
 * Combined Zustand store (v2 architecture)
 * Integrates all slices: documents, design, UI, history, jobs, tracker
 */

import { create } from 'zustand';

import { createDocumentsSlice, DocumentsSliceState } from './slices/documentsSlice';
import { createDesignSlice, DesignSliceState } from './slices/designSlice';
import { createUISlice, UISliceState } from './slices/uiSlice';
import { createHistorySlice, HistorySliceState } from './slices/historySlice';
import { createJobsSlice, JobsSliceState } from './slices/jobsSlice';
import { createTrackerSlice, TrackerSliceState } from './slices/trackerSlice';
import { initializePersistence } from '../services/persistence';

/**
 * Combined store state type
 */
export type ResumeStoreV2 = DocumentsSliceState &
  DesignSliceState &
  UISliceState &
  HistorySliceState &
  JobsSliceState &
  TrackerSliceState & {
    // Additional convenience methods
    initialize: () => Promise<void>;
    reset: () => void;
  };

/**
 * Create combined store
 */
export const useResumeStoreV2 = create<ResumeStoreV2>((set, get) => ({
  // Slice 1: Documents
  ...createDocumentsSlice(set, get),

  // Slice 2: Design
  ...createDesignSlice(set, get),

  // Slice 3: UI
  ...createUISlice(set, get),

  // Slice 4: History
  ...createHistorySlice(set, get),

  // Slice 5: Jobs
  ...createJobsSlice(set, get),

  // Slice 6: Tracker
  ...createTrackerSlice(set, get),

  // Global helpers
  initialize: async () => {
    await initializePersistence();
    await get().loadResumes();
    await get().loadRevisionHistory(get().activeResumeId);
    await get().loadApplications();
  },

  reset: () => {
    set({
      resumes: [],
      activeResumeId: '',
      currentResume: null,
      theme: 'modern',
      accentColor: '#c96442',
      fontSize: 'medium',
      marginSize: 'normal',
      lineHeight: 'normal',
      compactSpacing: false,
      onePageMode: false,
      uiTheme: 'dark',
      zoom: 1,
      autoFitZoom: false,
      editorViewMode: 'markdown',
      revisions: [],
      applications: [],
      stats: {
        total: 0,
        byStatus: {
          saved: 0,
          applied: 0,
          screening: 0,
          interview: 0,
          offer: 0,
          rejected: 0,
          withdrawn: 0,
        },
        thisMonth: 0,
        conversionRate: 0,
      },
    });
  },
}));

// Hook for compatibility with existing code
export const useResumeStore = useResumeStoreV2;
