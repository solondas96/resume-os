import { describe, it, expect } from 'vitest';
import { groupByStatus, sortApplications, STATUS_ORDER, JobApplication } from './tracker';

const app = (id: string, over: Partial<JobApplication> = {}): JobApplication => ({
  id,
  company: id,
  role: 'Engineer',
  status: 'saved',
  lastUpdated: 1,
  ...over,
});

describe('groupByStatus', () => {
  it('positive: every status has a column, and cards go to their status in input order', () => {
    const g = groupByStatus([app('a', { status: 'applied' }), app('b', { status: 'saved' }), app('c', { status: 'applied' })]);
    expect(Object.keys(g)).toEqual(STATUS_ORDER);
    expect(g.applied.map((x) => x.id)).toEqual(['a', 'c']);
    expect(g.saved.map((x) => x.id)).toEqual(['b']);
  });

  it('negative: an empty list gives empty columns, not missing ones', () => {
    const g = groupByStatus([]);
    expect(STATUS_ORDER.every((s) => g[s].length === 0)).toBe(true);
  });
});

describe('sortApplications', () => {
  const list = [app('b', { matchScore: 40, lastUpdated: 3 }), app('a', { matchScore: 90, lastUpdated: 1 }), app('c', { lastUpdated: 2 })];

  it('positive: sorts by match score, descending', () => {
    expect(sortApplications(list, 'matchScore', 'desc').map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('positive: sorts by company, ascending, case-insensitively', () => {
    const mixed = [app('Beta'), app('alpha'), app('Gamma')];
    expect(sortApplications(mixed, 'company', 'asc').map((x) => x.company)).toEqual(['alpha', 'Beta', 'Gamma']);
  });

  it('negative: an application with no match score sorts last in both directions', () => {
    expect(sortApplications(list, 'matchScore', 'asc').map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(sortApplications(list, 'matchScore', 'desc').map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('ties keep their original order (stable)', () => {
    const same = [app('x', { lastUpdated: 5 }), app('y', { lastUpdated: 5 })];
    expect(sortApplications(same, 'lastUpdated', 'desc').map((x) => x.id)).toEqual(['x', 'y']);
  });

  it('does not change the input array', () => {
    const copy = [...list];
    sortApplications(list, 'company', 'asc');
    expect(list).toEqual(copy);
  });
});
