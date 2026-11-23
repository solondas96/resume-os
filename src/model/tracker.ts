/**
 * Job application tracking model
 */

export type ApplicationStatus = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  link?: string;
  status: ApplicationStatus;
  appliedAt?: number;
  lastUpdated: number;
  notes?: string;
  tailoredResumeId?: string;
  matchScore?: number;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  thisMonth: number;
  conversionRate: number;
}

/**
 * Create new application
 */
export function createApplication(company: string, role: string): JobApplication {
  return {
    id: `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    company,
    role,
    status: 'saved',
    lastUpdated: Date.now(),
  };
}

/**
 * Calculate stats
 */
export function calculateStats(applications: JobApplication[]): ApplicationStats {
  const stats: ApplicationStats = {
    total: applications.length,
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
  };

  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  applications.forEach((app) => {
    stats.byStatus[app.status]++;

    if ((app.appliedAt || app.lastUpdated) > monthAgo) {
      stats.thisMonth++;
    }
  });

  // Calculate conversion rate (interviews / applied)
  const applied = stats.byStatus.applied + stats.byStatus.screening + stats.byStatus.interview + stats.byStatus.offer;
  const interviews = stats.byStatus.interview + stats.byStatus.offer;
  stats.conversionRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  return stats;
}
