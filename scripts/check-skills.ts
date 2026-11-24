/**
 * Checks the shipped skills dataset before a release: public/data/skills.json (and skills-esco.json when it is there).
 * Exits 1 when a check fails:
 *   - the file is missing or does not parse
 *   - a skill has no name, or no list of aliases
 *   - a name appears twice (ignoring case)
 *   - a source has no licence or no attribution
 *   - the file is over the size budget (the same budget the build uses)
 * Prints the counts by kind, so a release can be compared with the one before it.
 *   npm run skills:check
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET = 1_500_000;

interface Dataset {
  version: number;
  sources: { name: string; license?: string; attribution?: string }[];
  skills: { c: string; a: string[]; k: string }[];
}

export function checkDataset(data: Dataset, bytes: number): { problems: string[]; kinds: Record<string, number> } {
  const problems: string[] = [];
  if (typeof data.version !== 'number') problems.push('the file has no version number');
  if (!Array.isArray(data.sources) || data.sources.length === 0) problems.push('the file lists no sources');
  for (const s of data.sources ?? []) {
    if (!s.license || !s.attribution) problems.push(`source "${s.name}" has no licence or attribution`);
  }

  const kinds: Record<string, number> = {};
  const seen = new Map<string, number>();
  data.skills.forEach((s, i) => {
    if (!s.c || !s.c.trim()) problems.push(`skill ${i} has no name`);
    if (!Array.isArray(s.a)) problems.push(`skill "${s.c}" has no list of aliases`);
    kinds[s.k] = (kinds[s.k] ?? 0) + 1;
    const key = (s.c ?? '').toLowerCase();
    if (key && seen.has(key)) problems.push(`"${s.c}" appears twice`);
    seen.set(key, i);
  });
  if (bytes > BUDGET) problems.push(`the file is ${bytes} bytes, over the ${BUDGET} byte budget`);
  return { problems, kinds };
}

function main(): number {
  let failed = false;
  for (const name of ['skills.json', 'skills-esco.json']) {
    const path = join(root, 'public', 'data', name);
    if (!existsSync(path)) {
      if (name === 'skills.json') {
        console.error(`MISSING ${name}: run npm run build:skills`);
        failed = true;
      } else {
        console.log(`${name}: not present (the ESCO set is optional)`);
      }
      continue;
    }
    let data: Dataset;
    try {
      data = JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
      console.error(`${name} does not parse: ${e}`);
      failed = true;
      continue;
    }
    const { problems, kinds } = checkDataset(data, statSync(path).size);
    const total = data.skills.length;
    console.log(`${name}: ${total} skills, ${statSync(path).size} bytes`);
    console.log(`  by kind: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}`);
    for (const p of problems) console.error(`  FAIL ${p}`);
    if (problems.length > 0) failed = true;
  }
  console.log(failed ? 'skills:check FAILED' : 'skills:check passed');
  return failed ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main());
