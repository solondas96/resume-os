// @vitest-environment node
/**
 * The developer's own resume, kept out of git. Put a PDF and its expected JSON in tests/fixtures/private/
 * (both git-ignored). The test skips when the folder is empty.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOne } from './score';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'private');
const ids = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).filter((id) => existsSync(join(dir, 'pdf', `${id}.pdf`)))
  : [];

describe.skipIf(ids.length === 0)('private fixtures (the developer\'s own resume)', () => {
  for (const id of ids) {
    it(`${id} scores at least 80% overall`, async () => {
      const score = await scoreOne(dir, id);
      expect(score.overall).toBeGreaterThanOrEqual(0.8);
    });
  }
});
