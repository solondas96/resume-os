// @vitest-environment node
/**
 * Field-level scoring for PDF import, shared by the synthetic corpus and the real-world fixtures.
 * Each PDF is extracted with the real pipeline and compared with its expected JSON.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractTextLines } from '../../src/import/pdfText';
import { structureFromLines } from '../../src/import/structure';
import { markdownToResume, parseDateRange, formatRange } from '../../src/model/serialize';
import { sectionItems } from '../../src/model/resume';

/** Canonical form of a date range, so "Jan 2019 – Present" and "01/2019 - now" compare equal */
function canonical(start: string, end?: string): string {
  const range = parseDateRange(end ? `${start} – ${end}` : start);
  return range ? formatRange(range.start, range.end) : `?${start}`;
}

export const norm = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const fraction = (hits: number, total: number) => (total === 0 ? 1 : hits / total);

export interface Score {
  id: string;
  fields: Record<string, number>;
  overall: number;
}

export async function scoreOne(dir: string, id: string): Promise<Score> {
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

