// @vitest-environment node
/**
 * Records the current scores as the baselines. Run after an intended change:
 *   npm run fixtures:baseline
 * It prints the changes first, so the commit can say what moved.
 */
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOne, Score } from './score';
import { readBaseline, writeBaseline, compareToBaseline, formatChanges } from './baseline';

const here = dirname(fileURLToPath(import.meta.url));

async function run(dir: string, baselinePath: string, onlyWithPdf: boolean) {
  const ids = readdirSync(join(dir, 'expected'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .filter((id) => !onlyWithPdf || existsSync(join(dir, 'pdf', `${id}.pdf`)))
    .sort();
  const scores: Score[] = [];
  for (const id of ids) scores.push(await scoreOne(dir, id));
  const before = readBaseline(baselinePath);
  const { changes, missing } = compareToBaseline(scores, before);
  const note = Object.keys(before).length === 0 ? 'first baseline: every fixture is new' : formatChanges(changes);
  console.log(`\n${baselinePath}\n${note}${missing.length ? `\nnew fixtures: ${missing.join(', ')}` : ''}`);
  writeBaseline(baselinePath, scores);
  console.log(`wrote ${scores.length} fixtures`);
}

await run(join(here, 'corpus'), join(here, 'corpus', 'baseline.json'), false);
await run(join(here, 'real'), join(here, 'real', 'baseline.json'), true);
