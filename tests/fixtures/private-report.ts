/**
 * Scores the private fixtures (your own résumé, in tests/fixtures/private/) and prints the field table.
 * Nothing is written to git: the folder is git-ignored, and the report goes into it too.
 *   npm run fixtures:private
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOne, Score } from './score';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'private');

export async function report(): Promise<string[]> {
  const expectedDir = join(dir, 'expected');
  const ids = existsSync(expectedDir)
    ? readdirSync(expectedDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
        .filter((id) => existsSync(join(dir, 'pdf', `${id}.pdf`)))
        .sort()
    : [];
  if (ids.length === 0) {
    return ['No private fixtures yet. Add one with: npm run fixtures:add -- <id> <file.pdf>'];
  }
  // A skeleton from fixtures:add is not a truth to score against yet
  const unfilled = ids.filter((id) => '_fill_in' in JSON.parse(readFileSync(join(expectedDir, `${id}.json`), 'utf8')));
  if (unfilled.length > 0) {
    return [`Fill in these expected files by hand first (they are still empty skeletons): ${unfilled.join(', ')}`];
  }
  const scores: Score[] = [];
  for (const id of ids) scores.push(await scoreOne(dir, id));
  const keys = Object.keys(scores[0].fields);
  const pct = (n: number) => `${Math.round(n * 100)}`.padStart(3);
  const lines = [
    ['fixture'.padEnd(24), ...keys, 'overall'].join(' | '),
    ...scores.map((s) => [s.id.padEnd(24), ...keys.map((k) => pct(s.fields[k])), pct(s.overall)].join(' | ')),
    `mean overall: ${Math.round((scores.reduce((a, s) => a + s.overall, 0) / scores.length) * 100)}% (${scores.length} file${scores.length === 1 ? '' : 's'})`,
  ];
  return lines;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lines = await report();
  console.log(lines.join('\n'));
  if (existsSync(dir)) writeFileSync(join(dir, 'report.txt'), lines.join('\n') + '\n');
}
