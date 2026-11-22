// @vitest-environment node
/**
 * Field-level accuracy of PDF import over the fixture corpus.
 * Each resume is extracted with the real pipeline (pdf.js -> layout -> structure -> model)
 * and compared with the expected JSON it was generated from.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTextLines } from '../../src/import/pdfText';
import { structureFromLines } from '../../src/import/structure';
import { markdownToResume, parseDateRange, formatRange } from '../../src/model/serialize';
import { sectionItems } from '../../src/model/resume';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'corpus');
const ids = readdirSync(join(dir, 'expected'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .sort();

/** Canonical form of a date range, so "Jan 2019 – Present" and "01/2019 - now" compare equal */
function canonical(start: string, end?: string): string {
  const range = parseDateRange(end ? `${start} – ${end}` : start);
  return range ? formatRange(range.start, range.end) : `?${start}`;
}

const norm = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const fraction = (hits: number, total: number) => (total === 0 ? 1 : hits / total);

interface Score {
  id: string;
  fields: Record<string, number>;
  overall: number;
}

async function scoreOne(id: string): Promise<Score> {
  const expected = JSON.parse(readFileSync(join(dir, 'expected', `${id}.json`), 'utf8'));
  const data = readFileSync(join(dir, 'pdf', `${id}.pdf`));
  const lines = await extractTextLines(new Uint8Array(data));
  const structure = structureFromLines(lines);
  const resume = markdownToResume(structure.markdown, id);

  const experience = resume.sections.filter((s) => s.kind === 'experience').flatMap((s) => sectionItems(s) as any[]);
  const education = resume.sections.filter((s) => s.kind === 'education').flatMap((s) => sectionItems(s) as any[]);
  const bullets = resume.sections.flatMap((s) => sectionItems(s).flatMap((i: any) => i.bullets.map((b: any) => norm(b.text))));
  const skills = resume.sections.filter((s) => s.kind === 'skills').flatMap((s: any) => s.groups.flatMap((g: any) => g.skills.map(norm)));

  const expBullets = expected.experience.flatMap((e: any) => e.bullets.map(norm));
  const bulletRecall = fraction(expBullets.filter((b: string) => bullets.includes(b)).length, expBullets.length);
  const bulletPrecision = fraction(bullets.filter((b) => expBullets.includes(b)).length, bullets.length);

  const fields: Record<string, number> = {
    name: resume.basics.name === expected.name ? 1 : 0,
    email: resume.basics.email === expected.email ? 1 : 0,
    phone: resume.basics.phone === expected.phone ? 1 : 0,
    sections: fraction(
      expected.sections.filter((t: string) => resume.sections.some((s) => norm(s.title) === norm(t))).length,
      expected.sections.length
    ),
    company: fraction(
      expected.experience.filter((e: any) => experience.some((x) => norm(x.company) === norm(e.company))).length,
      expected.experience.length
    ),
    role: fraction(
      expected.experience.filter((e: any) => experience.some((x) => norm(x.role) === norm(e.role))).length,
      expected.experience.length
    ),
    dates: fraction(
      expected.experience.filter((e: any) =>
        experience.some((x) => x.start && canonical(e.start, e.end) === formatRange(x.start, x.end))
      ).length,
      expected.experience.length
    ),
    school: fraction(
      expected.education.filter((e: any) => education.some((x) => norm(x.school) === norm(e.school))).length,
      expected.education.length
    ),
    bullets: bulletRecall,
    bulletPrecision,
    skills: fraction(expected.skills.filter((s: string) => skills.includes(norm(s))).length, expected.skills.length),
  };
  const overall = Object.values(fields).reduce((a, b) => a + b, 0) / Object.keys(fields).length;
  return { id, fields, overall };
}

describe('PDF import accuracy over the corpus', () => {
  it('scores every fixture and reports field-level accuracy', async () => {
    const scores: Score[] = [];
    for (const id of ids) scores.push(await scoreOne(id));

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
