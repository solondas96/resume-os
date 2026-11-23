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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILLS as CURATED } from '../src/intelligence/skills';
import { FIELD_SUPPLEMENTS } from '../src/intelligence/fieldSynonyms';

export interface SkillOut {
  c: string; // canonical name
  a: string[]; // aliases (lowercase)
  k: string; // kind: skill, knowledge, technology, tool, activity, field
  o?: string[]; // occupation tags: the most common O*NET major groups (first two digits of the SOC code)
  f?: string; // field tag, for the non-tech field supplements
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

/** The budget for the dataset. SKILLS_MAX_BYTES overrides it, so the split can be tested with a small budget. */
export const MAX_BYTES = Number(process.env.SKILLS_MAX_BYTES) || 1_500_000;
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

/** Generated files stay under this budget; the build fails over it */
export const ESCO_DEFAULT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data', 'esco');

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

/** Occupation major groups kept per skill: enough to tag a skill by job family, short enough to stay small */
const MAJOR_TAGS = 3;

/** The most common O*NET major groups (first two digits of the SOC code) for a name */
export function topMajors(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAJOR_TAGS)
    .map(([major]) => major);
}

export function fromOnet(dir: string): { skills: SkillOut[]; titles: TitleOut[] } {
  // Names from several O*NET files, each with the occupations it appears in
  const tagged = new Map<string, { c: string; k: string; majors: Map<string, number> }>();
  const add = (name: string, kind: string, code: string | undefined, keep: (n: string) => boolean = () => true) => {
    const c = norm(name);
    if (!c || !keep(c)) return;
    const k = key(c);
    let e = tagged.get(k);
    if (!e) {
      e = { c, k: kind, majors: new Map() };
      tagged.set(k, e);
    }
    if (code) {
      const major = code.slice(0, 2);
      e.majors.set(major, (e.majors.get(major) ?? 0) + 1);
    }
  };
  const rows = (file: string) => {
    const text = read(dir, file);
    return text ? parseDelimited(text, '\t') : [];
  };
  for (const r of rows('Skills.txt')) add(r['Element Name'], 'skill', r['O*NET-SOC Code']);
  for (const r of rows('Knowledge.txt')) add(r['Element Name'], 'knowledge', r['O*NET-SOC Code']);
  for (const r of rows('Technology Skills.txt')) add(r['Example'], 'technology', r['O*NET-SOC Code']);
  for (const r of rows('Tools Used.txt')) add(r['Example'], 'tool', r['O*NET-SOC Code'], plainToolName);

  // Detailed work activities (DWAs). A task statement links an occupation to a DWA, so each DWA
  // is tagged with the occupations whose tasks it supports. The task text itself is not stored.
  const dwaTitles = new Map<string, string>();
  for (const r of rows('DWA Reference.txt')) if (r['DWA ID'] && r['DWA Title']) dwaTitles.set(r['DWA ID'], r['DWA Title'].replace(/\.$/, ''));
  for (const r of rows('Tasks to DWAs.txt')) {
    const title = dwaTitles.get(r['DWA ID']);
    if (title) add(title, 'activity', r['O*NET-SOC Code']);
  }

  const skills: SkillOut[] = [...tagged.values()].map((e) => {
    const majors = topMajors(e.majors);
    return majors.length ? { c: e.c, a: [], k: e.k, o: majors } : { c: e.c, a: [], k: e.k };
  });

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

/** Field supplements: project-authored synonyms for non-tech professions */
export function fromFields(): { skills: SkillOut[]; titles: TitleOut[] } {
  const skills: SkillOut[] = [];
  for (const f of FIELD_SUPPLEMENTS) {
    for (const e of f.entries) skills.push({ c: e.canonical, a: e.aliases, k: 'field', f: f.field });
  }
  return { skills, titles: [] };
}

/** ISCO major group (first digit of the 4-digit ISCO code), tagged as "I<digit>" so it is not mistaken for an O*NET group */
const ISCO_TAG = (code: string | undefined): string | null => (code && /^\d/.test(code.trim()) ? `I${code.trim()[0]}` : null);

/**
 * ESCO classification CSVs (English): skills_en.csv (labels and alternative labels), occupations_en.csv
 * (for the ISCO group) and occupationSkillRelations_en.csv (which occupations use which skill).
 * A missing file is skipped; a missing column is named in the log so the file can be checked.
 */
export function fromEsco(dir: string): { skills: SkillOut[]; titles: TitleOut[] } {
  const skills: SkillOut[] = [];
  const titles: TitleOut[] = [];
  const iscoByOccupation = new Map<string, string>();
  const occFile = read(dir, 'occupations_en.csv');
  if (occFile) {
    for (const r of parseDelimited(occFile, ',')) {
      const alts = (r['altLabels'] ?? '').split(/\n/).map(key).filter(Boolean);
      titles.push({ c: norm(r['preferredLabel']), a: alts });
      if (r['conceptUri'] && r['iscoGroup']) iscoByOccupation.set(r['conceptUri'], r['iscoGroup']);
    }
  }
  const skillsByUri = new Map<string, SkillOut>();
  const skillFile = read(dir, 'skills_en.csv');
  if (skillFile) {
    for (const r of parseDelimited(skillFile, ',')) {
      const kind = /knowledge/i.test(r['skillType'] ?? '') ? 'knowledge' : 'skill';
      const alts = (r['altLabels'] ?? '').split(/\n/).map(key).filter(Boolean);
      const entry: SkillOut = { c: norm(r['preferredLabel']), a: alts, k: kind };
      if (!entry.c) continue;
      skills.push(entry);
      if (r['conceptUri']) skillsByUri.set(r['conceptUri'], entry);
    }
  }
  const relFile = read(dir, 'occupationSkillRelations_en.csv');
  if (relFile) {
    const majors = new Map<SkillOut, Map<string, number>>();
    for (const r of parseDelimited(relFile, ',')) {
      const skill = skillsByUri.get(r['skillUri']);
      const tag = ISCO_TAG(iscoByOccupation.get(r['occupationUri']));
      if (!skill || !tag) continue;
      const counts = majors.get(skill) ?? new Map<string, number>();
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      majors.set(skill, counts);
    }
    for (const [skill, counts] of majors) skill.o = topMajors(counts);
  }
  return { skills, titles };
}

/** A label reduced to its words, lowercase, so "Python (programming)" and "python programming" compare equal */
export function normalisedLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();
}

/** Words of a label, as a set */
const tokensOf = (label: string): Set<string> => new Set(normalisedLabel(label).split(' ').filter(Boolean));

/**
 * Drop the ESCO entries that duplicate something already in the dataset: the same normalised label,
 * the same words in another order, or a token overlap of at least 80% (Jaccard) with one entry.
 * Returns the entries kept and how many were dropped.
 */
export function dedupeAgainst(existing: SkillOut[], incoming: SkillOut[]): { kept: SkillOut[]; dropped: SkillOut[] } {
  const byLabel = new Set<string>();
  const byTokens = new Set<string>();
  const index = new Map<string, number[]>(); // token -> indexes into `sets`
  const sets: Set<string>[] = [];
  const add = (label: string) => {
    const set = tokensOf(label);
    if (set.size === 0) return;
    const id = sets.length;
    sets.push(set);
    byLabel.add(normalisedLabel(label));
    byTokens.add([...set].sort().join(' '));
    for (const t of set) index.set(t, [...(index.get(t) ?? []), id]);
  };
  for (const e of existing) {
    add(e.c);
    for (const a of e.a) add(a);
  }
  const kept: SkillOut[] = [];
  const dropped: SkillOut[] = [];
  for (const s of incoming) {
    const set = tokensOf(s.c);
    if (set.size === 0) {
      dropped.push(s);
      continue;
    }
    const sortedKey = [...set].sort().join(' ');
    if (byLabel.has(normalisedLabel(s.c)) || byTokens.has(sortedKey)) {
      dropped.push(s);
      continue;
    }
    // Candidates share at least one word; compare the sets directly
    const candidates = new Set<number>();
    for (const t of set) for (const id of index.get(t) ?? []) candidates.add(id);
    let near = false;
    for (const id of candidates) {
      const other = sets[id];
      const inter = [...set].filter((t) => other.has(t)).length;
      const union = set.size + other.size - inter;
      if (union > 0 && inter / union >= 0.8) {
        near = true;
        break;
      }
    }
    if (near) {
      dropped.push(s);
      continue;
    }
    kept.push(s);
    add(s.c);
  }
  return { kept, dropped };
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
        if (!existing.o && s.o) existing.o = s.o;
        if (!existing.f && s.f) existing.f = s.f;
      } else {
        const entry: SkillOut = { c: s.c, a: [...new Set(s.a)].filter((a) => a !== k).slice(0, MAX_ALIASES), k: s.k };
        if (s.o) entry.o = s.o;
        if (s.f) entry.f = s.f;
        seen.set(k, entry);
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
  // Priority, as documented in scripts/README.md: curated, fields, ESCO, O*NET
  const merged = merge([curatedSource(), fromFields(), ...sources.map((s) => s.data)]);
  return {
    version: 1,
    generated: new Date().toISOString().slice(0, 10),
    sources: [
      { name: 'Curated tech supplement', license: 'Project-authored', attribution: 'ResumeLabs' },
      { name: 'Field synonym supplements (12 non-tech fields)', license: 'Project-authored', attribution: 'ResumeLabs' },
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
  const escoArg = arg('esco');
  const escoDir = escoArg ?? (existsSync(ESCO_DEFAULT_DIR) ? ESCO_DEFAULT_DIR : undefined);
  const onetSource = onet
    ? [{
        name: 'O*NET 29.1 Database',
        license: 'CC BY 4.0',
        attribution: 'Based on O*NET 29.1 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), licensed CC BY 4.0. https://www.onetcenter.org/license_db.html',
        data: fromOnet(onet),
      }]
    : [];
  if (!onet) console.log('O*NET: skipped (no --onet folder given).');

  // The core: curated, field supplements and O*NET. ESCO is added after, and only where it adds something.
  const core = build(onetSource);
  const escoPresent = !!escoDir && existsSync(join(escoDir, 'skills_en.csv'));
  let escoSource: Parameters<typeof build>[0] = [];
  let escoOnly: { skills: SkillOut[]; titles: TitleOut[] } | null = null;
  if (escoPresent && escoDir) {
    const raw = fromEsco(escoDir);
    const { kept, dropped } = dedupeAgainst(core.skills, raw.skills);
    console.log(`ESCO: ${raw.skills.length} skills read, ${dropped.length} duplicates of curated, field or O*NET names dropped, ${kept.length} added.`);
    for (const d of dropped) console.log(`  dropped (duplicate): ${d.c}`);
    escoOnly = { skills: kept, titles: raw.titles };
    escoSource = [{
      name: 'ESCO classification (European Skills, Competences, Qualifications and Occupations)',
      license: 'CC BY 4.0',
      attribution: 'ESCO, European Commission. Licensed CC BY 4.0. https://esco.ec.europa.eu/en/use-esco/download',
      data: escoOnly,
    }];
  } else {
    console.log(`ESCO: skipped (no skills_en.csv in ${escoDir ?? ESCO_DEFAULT_DIR}). Place the ESCO CSVs there to include them.`);
  }

  const full = build([...onetSource, ...escoSource]);
  const out = arg('out') ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
  mkdirSync(out, { recursive: true });
  const fullJson = JSON.stringify(full);
  let written = 'skills.json';
  // SKILLS_FORCE_SPLIT=1 writes the split even when the full set fits (used by the tests)
  const forceSplit = process.env.SKILLS_FORCE_SPLIT === '1';
  if (!forceSplit && (fullJson.length <= MAX_BYTES || !escoOnly)) {
    writeFileSync(join(out, 'skills.json'), fullJson);
    console.log(`skills: ${full.skills.length} (activities ${full.skills.filter((x) => x.k === 'activity').length}, tagged ${full.skills.filter((x) => x.o).length}), titles: ${full.titles.length}, ${(fullJson.length / 1024).toFixed(0)} KB`);
  } else {
    // Over the budget: the core loads first, and the ESCO entries load after it (src/intelligence/skillsData.ts)
    const coreJson = JSON.stringify(core);
    const escoDataset = build(escoSource);
    const escoJson = JSON.stringify({ ...escoDataset, skills: escoOnly?.skills ?? [], titles: [] });
    writeFileSync(join(out, 'skills.json'), coreJson);
    writeFileSync(join(out, 'skills-esco.json'), escoJson);
    written = 'skills.json + skills-esco.json';
    const why = fullJson.length > MAX_BYTES ? 'the full set was over the budget' : 'split forced by SKILLS_FORCE_SPLIT';
    console.log(`Split: core ${(coreJson.length / 1024).toFixed(0)} KB, ESCO ${(escoJson.length / 1024).toFixed(0)} KB (${why}; the full set is ${(fullJson.length / 1024).toFixed(0)} KB).`);
    if (coreJson.length > MAX_BYTES || escoJson.length > MAX_BYTES) {
      console.error('A split file is still over the budget.');
      process.exit(1);
    }
  }
  console.log(`wrote ${written}`);
  if (fullJson.length > MAX_BYTES && escoOnly === null) {
    console.error(`Dataset is ${fullJson.length} bytes, over the ${MAX_BYTES} byte budget`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
