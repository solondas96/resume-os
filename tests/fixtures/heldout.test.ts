// @vitest-environment node
/**
 * Held-out résumés: written once, in layouts the parser was not tuned on (see tests/fixtures/heldout/src).
 * They are scored and reported on their own. They are not in the baseline and are not used for tuning.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOne, Score } from './score';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'heldout');

describe('held-out PDFs', () => {
  it('scores each held-out PDF and writes the report', async () => {
    const ids = readdirSync(join(dir, 'expected')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
    const scores: Score[] = [];
    for (const id of ids) scores.push(await scoreOne(dir, id));
    const keys = Object.keys(scores[0].fields);
    const pct = (n: number) => `${Math.round(n * 100)}`.padStart(3);
    const lines = [
      `held-out PDFs scored: ${scores.length}`,
      ['fixture'.padEnd(24), ...keys, 'overall'].join(' | '),
      ...scores.map((s) => [s.id.padEnd(24), ...keys.map((k) => pct(s.fields[k])), pct(s.overall)].join(' | ')),
      `mean overall: ${Math.round((scores.reduce((a, s) => a + s.overall, 0) / scores.length) * 100)}%`,
    ];
    writeFileSync(join(dir, 'report.txt'), lines.join('\n') + '\n');
    console.log(lines.join('\n'));
    expect(scores.length).toBe(4);
    expect(readFileSync(join(dir, 'report.txt'), 'utf8')).toContain('mean overall');
  }, 120_000);
});
