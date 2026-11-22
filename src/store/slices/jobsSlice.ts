/**
 * Zustand store slice: Job description and tailoring
 * Paste job descriptions, track tailored variants
 */

import { saveSetting } from '../../services/persistence';

export interface JobsSliceState {
  targetJobDescription: string;
  setTargetJobDescription: (jd: string) => Promise<void>;
  tailoredResumes: Record<string, string>; // resumeId -> jobId mapping
  createTailoredVariant: (baseResumeId: string, jobId: string) => Promise<string>;
  getTailoredResume: (resumeId: string) => string | null;
}

/**
 * Create jobs slice
 */
export function createJobsSlice(set: any, get: any): JobsSliceState {
  return {
    targetJobDescription: '',

    /**
     * Update target job description
     */
    setTargetJobDescription: async (jd: string) => {
      set({ targetJobDescription: jd });
      await saveSetting('targetJobDescription', jd);
    },

    tailoredResumes: {},

    /**
     * Create a tailored variant of a resume for a specific job
     */
    createTailoredVariant: async (_baseResumeId: string, jobId: string): Promise<string> => {
      // TODO: Duplicate resume and tag it as tailored variant
      const { currentResume, createResume } = get();
      if (!currentResume) return '';

      const tailoredId = await createResume(`${currentResume.meta.title} - Tailored`);
      const { tailoredResumes } = get();

      set({
        tailoredResumes: {
          ...tailoredResumes,
          [tailoredId]: jobId,
        },
      });

      return tailoredId;
    },

    /**
     * Get the job ID associated with a tailored resume
     */
    getTailoredResume: (resumeId: string) => {
      const { tailoredResumes } = get();
      return tailoredResumes[resumeId] || null;
    },
  };
}
