// @vitest-environment node
/**
 * Accuracy baselines. Each fixture's per-field score is recorded in baseline.json. The tests compare
 * against it, and the baseline is a ratchet:
 *  - a field below its baseline fails (a regression);
 *  - a field above its baseline also fails, until the baseline is updated with `npm run fixtures:baseline`
 *    in the same commit (so an improvement is recorded, never silently kept);
 *  - a fixture with no baseline entry fails, for the same reason.
 * Every change is printed as a table: fixture, field, before → after.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { Score } from './score';

export interface Baseline {
  [fixture: string]: { [field: string]: number };
}

export interface Change {
  fixture: string;
  field: string;
  before: number | null;
  after: number;
}

const round = (n: number) => Math.round(n * 10000) / 10000;

/** The scores as a baseline (fields and the overall, as fractions to four decimals) */
export function toBaseline(scores: Score[]): Baseline {
  const out: Baseline = {};
  for (const s of scores) {
    out[s.id] = { ...Object.fromEntries(Object.entries(s.fields).map(([k, v]) => [k, round(v)])), overall: round(s.overall) };
  }
  return out;
}

export function readBaseline(path: string): Baseline {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

export function writeBaseline(path: string, scores: Score[]): void {
  const sorted = toBaseline(scores);
  const ordered = Object.fromEntries(Object.keys(sorted).sort().map((k) => [k, sorted[k]]));
  writeFileSync(path, JSON.stringify(ordered, null, 2) + '\n');
}

/** Every difference from the baseline, and the fixtures that have no entry */
export function compareToBaseline(scores: Score[], baseline: Baseline): { changes: Change[]; missing: string[] } {
  const changes: Change[] = [];
  const missing: string[] = [];
  for (const s of scores) {
    const base = baseline[s.id];
    if (!base) {
      missing.push(s.id);
      continue;
    }
    const now = { ...s.fields, overall: s.overall };
    for (const field of Object.keys(now)) {
      const after = round(now[field]);
      const before = base[field] ?? null;
      if (before === null || Math.abs(after - before) > 1e-9) changes.push({ fixture: s.id, field, before, after });
    }
  }
  return { changes, missing };
}

/** A table of changes, for the test output */
export function formatChanges(changes: Change[]): string {
  if (changes.length === 0) return 'no change from the baseline';
  const pct = (n: number | null) => (n === null ? '  new' : `${Math.round(n * 100)}%`.padStart(5));
  const rows = changes.map((c) => `${c.fixture.padEnd(28)} ${c.field.padEnd(15)} ${pct(c.before)} → ${pct(c.after)}`);
  return ['fixture                      field           before → after', ...rows].join('\n');
}
