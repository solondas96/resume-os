/**
 * Build public/data/skills.json from open datasets.
 *
 *   npx tsx scripts/build-skills.ts --onet <dir> [--esco <dir>]
 *
 * --onet  folder of an extracted O*NET text database (e.g. db_29_1_text), CC BY 4.0
 * --esco  folder with ESCO CSV files (skills_en.csv, occupations_en.csv), CC BY 4.0
 *
 * Raw downloads are never committed; only the generated JSON is. See scripts/README.md.
 * Priority when a name appears in more than one source: curated (src/intelligence/skills.ts)
 * > ESCO > O*NET.
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILLS as CURATED } from '../src/intelligence/skills';

export interface SkillOut {
  c: string; // canonical name
  a: string[]; // aliases (lowercase)
  k: string; // kind: skill, knowledge, technology, tool
}
export interface TitleOut {
  c: string;
  a: string[];
}
export interface DatasetOut {
  version: 1;
  generated: string;
  sources: { name: string; license: string; attribution: string }[];
  skills: SkillOut[];
  titles: TitleOut[];
}

export const MAX_BYTES = 1_500_000;
const MAX_ALIASES = 6;

/** Parse a delimited file, honouring quoted fields (ESCO uses commas, O*NET tabs) */
export function parseDelimited(text: string, delimiter: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
      if (ch === '\r') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  if (!header) return [];
  return body
    .filter((r) => r.some((c) => c.trim().length))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const key = (s: string) => norm(s).toLowerCase();

/** Tool names from O*NET are noisy; keep short plain names only */
export function plainToolName(name: string): boolean {
  const words = name.split(/\s+/);
  return words.length <= 3 && !/\d/.test(name) && name.length >= 3 && name.length <= 40;
}

function read(dir: string, file: string): string | null {
  const path = join(dir, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

export function fromOnet(dir: string): { skills: SkillOut[]; titles: TitleOut[] } {
  const skills: SkillOut[] = [];
  const add = (names: Iterable<string>, kind: string, keep: (n: string) => boolean = () => true) => {
    for (const n of names) if (n && keep(n)) skills.push({ c: norm(n), a: [], k: kind });
  };
  const column = (file: string, col: string) => {
    const text = read(dir, file);
    return text ? parseDelimited(text, '\t').map((r) => r[col]).filter(Boolean) : [];
  };
  add(new Set(column('Skills.txt', 'Element Name')), 'skill');
  add(new Set(column('Knowledge.txt', 'Element Name')), 'knowledge');
  add(new Set(column('Technology Skills.txt', 'Example')), 'technology');
  add(new Set(column('Tools Used.txt', 'Example')), 'tool', plainToolName);

  const occupations = read(dir, 'Occupation Data.txt');
  const alternates = read(dir, 'Alternate Titles.txt');
  const titles: TitleOut[] = [];
  const byCode = new Map<string, TitleOut>();
  if (occupations) {
    for (const r of parseDelimited(occupations, '\t')) {
      const t = { c: norm(r['Title']), a: [] as string[] };
      byCode.set(r['O*NET-SOC Code'], t);
      titles.push(t);
    }
  }
  if (alternates) {
    for (const r of parseDelimited(alternates, '\t')) {
      const t = byCode.get(r['O*NET-SOC Code']);
      if (t && t.a.length < 3 && r['Alternate Title']) t.a.push(key(r['Alternate Title']));
    }
  }
  return { skills, titles };
}

export function fromEsco(dir: string): { skills: SkillOut[]; titles: TitleOut[] } {
  const skills: SkillOut[] = [];
  const titles: TitleOut[] = [];
  const skillFile = read(dir, 'skills_en.csv');
  if (skillFile) {
    for (const r of parseDelimited(skillFile, ',')) {
      const kind = /knowledge/i.test(r['skillType'] ?? '') ? 'knowledge' : 'skill';
      const alts = (r['altLabels'] ?? '').split(/\n/).map(key).filter(Boolean);
      skills.push({ c: norm(r['preferredLabel']), a: alts, k: kind });
    }
  }
  const occFile = read(dir, 'occupations_en.csv');
  if (occFile) {
    for (const r of parseDelimited(occFile, ',')) {
      const alts = (r['altLabels'] ?? '').split(/\n/).map(key).filter(Boolean);
      titles.push({ c: norm(r['preferredLabel']), a: alts });
    }
  }
  return { skills, titles };
}

/** Merge sources in priority order; the first source to name a skill keeps its canonical form */
export function merge(sources: { skills: SkillOut[]; titles: TitleOut[] }[]): { skills: SkillOut[]; titles: TitleOut[] } {
  const seen = new Map<string, SkillOut>();
  const titleSeen = new Map<string, TitleOut>();
  for (const src of sources) {
    for (const s of src.skills) {
      const k = key(s.c);
      if (!k) continue;
      const existing = seen.get(k);
      if (existing) {
        for (const a of s.a) if (!existing.a.includes(a) && a !== k) existing.a.push(a);
        existing.a = existing.a.slice(0, MAX_ALIASES);
      } else {
        seen.set(k, { c: s.c, a: [...new Set(s.a)].filter((a) => a !== k).slice(0, MAX_ALIASES), k: s.k });
      }
    }
    for (const t of src.titles) {
      const k = key(t.c);
      if (!k || titleSeen.has(k)) continue;
      titleSeen.set(k, { c: t.c, a: [...new Set(t.a)].filter((a) => a !== k).slice(0, 3) });
    }
  }
  return { skills: [...seen.values()], titles: [...titleSeen.values()] };
}

/** The curated dictionary goes first so its names and synonyms win */
export function curatedSource(): { skills: SkillOut[]; titles: TitleOut[] } {
  return {
    skills: CURATED.map((e) => ({ c: e.canonical, a: e.aliases, k: e.category === 'language' ? 'skill' : e.category })),
    titles: [],
  };
}

export function build(sources: { name: string; license: string; attribution: string; data: { skills: SkillOut[]; titles: TitleOut[] } }[]): DatasetOut {
  const merged = merge([curatedSource(), ...sources.map((s) => s.data)]);
  return {
    version: 1,
    generated: new Date().toISOString().slice(0, 10),
    sources: [
      { name: 'Curated tech supplement', license: 'Project-authored', attribution: 'ResumeLabs' },
      ...sources.map((s) => ({ name: s.name, license: s.license, attribution: s.attribution })),
    ],
    skills: merged.skills,
    titles: merged.titles,
  };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main() {
  const onet = arg('onet');
  const esco = arg('esco');
  if (!onet && !esco) {
    console.error('Usage: npx tsx scripts/build-skills.ts --onet <dir> [--esco <dir>]');
    process.exit(1);
  }
  const sources: Parameters<typeof build>[0] = [];
  if (onet) {
    sources.push({
      name: 'O*NET 29.1 Database',
      license: 'CC BY 4.0',
      attribution: 'Based on O*NET 29.1 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), licensed CC BY 4.0. https://www.onetcenter.org/license_db.html',
      data: fromOnet(onet),
    });
  }
  if (esco) {
    sources.push({
      name: 'ESCO classification (European Skills, Competences, Qualifications and Occupations)',
      license: 'CC BY 4.0',
      attribution: 'ESCO, European Commission. Licensed CC BY 4.0. https://esco.ec.europa.eu/en/use-esco/download',
      data: fromEsco(esco),
    });
  }
  const dataset = build(sources);
  const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'skills.json');
  mkdirSync(dirname(out), { recursive: true });
  const json = JSON.stringify(dataset);
  writeFileSync(out, json);
  const bytes = statSync(out).size;
  console.log(`skills: ${dataset.skills.length}, titles: ${dataset.titles.length}, ${(bytes / 1024).toFixed(0)} KB`);
  if (bytes > MAX_BYTES) {
    console.error(`Dataset is ${bytes} bytes, over the ${MAX_BYTES} byte budget`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
