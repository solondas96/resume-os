/**
 * Zustand store slice: Job application tracker
 */

import { JobApplication, createApplication, calculateStats, ApplicationStats } from '../../model/tracker';
import { saveSetting, loadSetting } from '../../services/persistence';

export interface TrackerSliceState {
  applications: JobApplication[];
  stats: ApplicationStats;

  addApplication: (company: string, role: string) => Promise<void>;
  updateApplication: (id: string, updates: Partial<JobApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  loadApplications: () => Promise<void>;
}

/**
 * Create tracker slice
 */
export function createTrackerSlice(set: any, get: any): TrackerSliceState {
  return {
    applications: [],
    stats: { total: 0, byStatus: { saved: 0, applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 }, thisMonth: 0, conversionRate: 0 },

    /**
     * Add new application
     */
    addApplication: async (company: string, role: string) => {
      const app = createApplication(company, role);
      const { applications } = get();

      const updated = [app, ...applications];
      set({ applications: updated });
      set({ stats: calculateStats(updated) });

      await saveSetting('applications', updated);
    },

    /**
     * Update application
     */
    updateApplication: async (id: string, updates: Partial<JobApplication>) => {
      const { applications } = get();
      const updated = applications.map((app: JobApplication) =>
        app.id === id ? { ...app, ...updates, lastUpdated: Date.now() } : app
      );

      set({ applications: updated });
      set({ stats: calculateStats(updated) });

      await saveSetting('applications', updated);
    },

    /**
     * Delete application
     */
    deleteApplication: async (id: string) => {
      const { applications } = get();
      const updated = applications.filter((app: JobApplication) => app.id !== id);

      set({ applications: updated });
      set({ stats: calculateStats(updated) });

      await saveSetting('applications', updated);
    },

    /**
     * Load applications from storage
     */
    loadApplications: async () => {
      try {
        const apps = await loadSetting('applications');
        if (apps && Array.isArray(apps)) {
          set({ applications: apps });
          set({ stats: calculateStats(apps) });
        }
      } catch (e) {
        console.error('Failed to load applications:', e);
      }
    },
  };
}
