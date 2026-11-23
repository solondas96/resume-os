// @vitest-environment node
/**
 * Field-level accuracy of PDF import over the fixture corpus.
 * Each resume is extracted with the real pipeline (pdf.js -> layout -> structure -> model)
 * and compared with the expected JSON it was generated from.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOne, Score } from './score';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'corpus');
const ids = readdirSync(join(dir, 'expected'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .sort();

describe('PDF import accuracy over the corpus', () => {
  it('scores every fixture and reports field-level accuracy', async () => {
    const scores: Score[] = [];
    for (const id of ids) scores.push(await scoreOne(dir, id));

    const keys = Object.keys(scores[0].fields);
    const pct = (n: number) => `${Math.round(n * 100)}`.padStart(3);
    const header = ['fixture', ...keys, 'overall'].join(' | ');
    const rows = scores.map((s) => [s.id.padEnd(24), ...keys.map((k) => pct(s.fields[k])), pct(s.overall)].join(' | '));
    const mean = scores.reduce((a, s) => a + s.overall, 0) / scores.length;
    const report = [header, ...rows, `mean overall: ${Math.round(mean * 100)}%`].join('\n');
    writeFileSync(join(dir, 'report.txt'), report + '\n');
    console.log(report);

    expect(scores.length).toBe(16);
    // Gate: the measured mean is 99%; a drop below 95% fails the run
    expect(mean).toBeGreaterThanOrEqual(0.95);
  }, 120_000);
});
