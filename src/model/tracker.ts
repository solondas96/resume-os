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

/** Board column order */
export const STATUS_ORDER: ApplicationStatus[] = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];

/** Applications grouped by status, in board order; each group keeps the input order */
export function groupByStatus(applications: JobApplication[]): Record<ApplicationStatus, JobApplication[]> {
  const groups = Object.fromEntries(STATUS_ORDER.map((s) => [s, [] as JobApplication[]])) as Record<ApplicationStatus, JobApplication[]>;
  for (const app of applications) groups[app.status].push(app);
  return groups;
}

export type SortKey = 'company' | 'role' | 'status' | 'matchScore' | 'lastUpdated';

/**
 * Sort applications by a column. Ties keep the original order (stable), and a missing match
 * score sorts last whichever way the column is sorted.
 */
export function sortApplications(applications: JobApplication[], key: SortKey, direction: 'asc' | 'desc'): JobApplication[] {
  const value = (a: JobApplication): string | number | undefined => {
    switch (key) {
      case 'company':
        return a.company.toLowerCase();
      case 'role':
        return a.role.toLowerCase();
      case 'status':
        return STATUS_ORDER.indexOf(a.status);
      case 'matchScore':
        return a.matchScore;
      case 'lastUpdated':
        return a.lastUpdated;
    }
  };
  const sign = direction === 'asc' ? 1 : -1;
  return applications
    .map((app, index) => ({ app, index, v: value(app) }))
    .sort((x, y) => {
      if (x.v === undefined && y.v === undefined) return x.index - y.index;
      if (x.v === undefined) return 1;
      if (y.v === undefined) return -1;
      const cmp = x.v < y.v ? -1 : x.v > y.v ? 1 : 0;
      return cmp * sign || x.index - y.index;
    })
    .map((x) => x.app);
}
