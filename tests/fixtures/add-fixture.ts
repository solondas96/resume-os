/**
 * Adds one PDF to the fixtures, with an expected file to fill in by hand.
 *
 *   npm run fixtures:add -- <id> <file.pdf>            your own résumé: goes to private/ (git-ignored)
 *   npm run fixtures:add -- <id> <file.pdf> --public   a file made up for the project: goes to real/
 *
 * The expected file is written as an empty skeleton. The importer's output is never copied into it,
 * because the expected file is the truth the importer is scored against.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function run(args: string[]): number {
  const [id, src, flag] = args;
  if (!id || !src || (flag !== undefined && flag !== '--public')) {
    console.error('Usage: npm run fixtures:add -- <id> <file.pdf> [--public]');
    return 2;
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    console.error(`The id "${id}" must be lower case letters, digits and dashes (for example "my-cv").`);
    return 2;
  }
  const source = resolve(src);
  if (!existsSync(source)) {
    console.error(`No file at ${source}`);
    return 2;
  }
  if (!readFileSync(source).subarray(0, 5).toString('latin1').startsWith('%PDF')) {
    console.error(`${src} is not a PDF (it does not start with %PDF).`);
    return 2;
  }

  const dir = join(here, flag === '--public' ? 'real' : 'private');
  const pdfTarget = join(dir, 'pdf', `${id}.pdf`);
  const expectedTarget = join(dir, 'expected', `${id}.json`);
  if (existsSync(pdfTarget) || existsSync(expectedTarget)) {
    console.error(`${id} already exists in ${dir}. Choose another id; nothing was changed.`);
    return 1;
  }

  mkdirSync(join(dir, 'pdf'), { recursive: true });
  mkdirSync(join(dir, 'expected'), { recursive: true });
  copyFileSync(source, pdfTarget);
  const skeleton = {
    id,
    kind: 'text',
    _fill_in:
      'Write what the file says, by hand: name, email, phone, sections, experience (company, role, start, end, bullets), education and skills. Do not copy the importer output. Set kind to "scanned" for an image-only PDF.',
    name: '',
    email: '',
    phone: '',
    sections: [],
    experience: [],
    education: [],
    skills: [],
  };
  writeFileSync(expectedTarget, JSON.stringify(skeleton, null, 2) + '\n');

  console.log(`Added ${id}:`);
  console.log(`  ${pdfTarget}`);
  console.log(`  ${expectedTarget}  (an empty skeleton)`);
  console.log('Next:');
  console.log(`  1. Fill in ${expectedTarget} by hand, from the file.`);
  if (flag === '--public') {
    console.log('  2. Run npx vitest run tests/fixtures/real.test.ts. It will fail until the new file has a baseline.');
    console.log('  3. Run npm run fixtures:baseline, and commit the PDF, the expected file and the baseline together.');
  } else {
    console.log('  2. Run npm run fixtures:private to see the score. Private files are git-ignored and never committed.');
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(run(process.argv.slice(2)));
