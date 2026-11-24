// @vitest-environment node
/**
 * Import confidence on the real fixtures: a file that parses well must not be rated low, and a
 * file the scorer rates below 90% must not be rated high. Uses the same import path as the app.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOne } from './score';
import { importResume } from '../../src/services/importResume';

const root = dirname(fileURLToPath(import.meta.url));

async function confidenceOf(dir: string, id: string) {
  const bytes = readFileSync(join(dir, 'pdf', `${id}.pdf`));
  const file = new File([bytes], `${id}.pdf`, { type: 'application/pdf' });
  return importResume(file);
}

describe('import confidence on the fixtures', () => {
  for (const set of ['real', 'corpus', 'heldout']) {
    const dir = join(root, set);
    const ids = readdirSync(join(dir, 'expected'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .filter((id) => existsSync(join(dir, 'pdf', `${id}.pdf`)))
      .filter((id) => JSON.parse(readFileSync(join(dir, 'expected', `${id}.json`), 'utf8')).kind !== 'scanned');

    for (const id of ids) {
      it(`${set}/${id}: a parse scored 90% or more is not rated low; below 90% is not rated high`, async () => {
        const score = await scoreOne(dir, id);
        const result = await confidenceOf(dir, id);
        expect(result.success).toBe(true);
        const level = result.confidence!.level;
        if (score.overall >= 0.9) expect(level, `${id}: ${result.confidence!.reasons.join(' ')}`).not.toBe('low');
        else expect(level, `${id} scored ${Math.round(score.overall * 100)}%`).not.toBe('high');
      }, 60_000);
    }
  }
});
