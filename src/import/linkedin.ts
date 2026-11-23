/**
 * Turn LinkedIn's "Get a copy of your data" ZIP into the Markdown dialect the editor reads.
 * The files used: Profile.csv, Email Addresses.csv, Positions.csv, Education.csv, Skills.csv,
 * Certifications.csv, Projects.csv and Languages.csv. Each one is optional except that the ZIP must
 * have Profile.csv or Positions.csv. Everything is read in the browser; nothing is uploaded.
 */

import { unzipSync, strFromU8 } from 'fflate';
import { parseDelimited } from './csv';

type Row = Record<string, string>;

export type LinkedInResult =
  | { ok: true; markdown: string; found: string[]; missing: string[]; warnings: string[] }
  | { ok: false; error: string };

const OPTIONAL_FILES = ['Email Addresses.csv', 'Education.csv', 'Skills.csv', 'Certifications.csv', 'Projects.csv', 'Languages.csv'];

const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** A description becomes bullets: line breaks and bullet characters split it */
export function descriptionBullets(text: string): string[] {
  return text
    .split(/\r?\n|[•·▪◦●]/)
    .map((line) => line.replace(/^[\s\-*–]+/, '').trim())
    .filter((line) => line.length > 0);
}

/** "Mar 2019" to "Present": one date range, or whatever is there */
export function dateRange(start: string, end: string): string {
  const s = clean(start);
  const e = clean(end) || (s ? 'Present' : '');
  if (!s && !e) return '';
  return s ? `${s} – ${e}` : e;
}

/** A meta line in the editor's dialect: *location* | *dates* */
function metaLine(parts: string[]): string {
  const shown = parts.map(clean).filter(Boolean).map((p) => `*${p}*`);
  return shown.join(' | ');
}

export function linkedinToMarkdown(zip: Uint8Array): LinkedInResult {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip);
  } catch {
    return { ok: false, error: 'This file is not a ZIP archive. Choose the ZIP from LinkedIn as it was downloaded.' };
  }
  // LinkedIn may put the files in a folder, so match by file name, ignoring case and folders
  const byName = new Map<string, string>();
  for (const path of Object.keys(entries)) {
    const base = path.split('/').pop()?.toLowerCase() ?? '';
    if (base && !byName.has(base)) byName.set(base, path);
  }
  const read = (name: string): Row[] | null => {
    const path = byName.get(name.toLowerCase());
    if (!path) return null;
    return parseDelimited(strFromU8(entries[path]).replace(/^﻿/, ''), ',');
  };

  const profile = read('Profile.csv');
  const positions = read('Positions.csv');
  if (!profile && !positions) {
    return { ok: false, error: 'This ZIP is not a LinkedIn data export: it has no Profile.csv or Positions.csv.' };
  }

  const found: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];
  const files: Record<string, Row[] | null> = {};
  for (const name of ['Profile.csv', 'Positions.csv', ...OPTIONAL_FILES]) {
    files[name] = read(name);
    (files[name] ? found : missing).push(name);
  }
  for (const name of missing) warnings.push(`${name} is not in this export, so that part is left out.`);

  const lines: string[] = [];
  const p = profile?.[0] ?? {};
  const name = [clean(p['First Name']), clean(p['Last Name'])].filter(Boolean).join(' ');
  lines.push(`# ${name || 'Imported profile'}`);
  const headline = clean(p['Headline']);
  if (headline) lines.push(headline);
  const email = clean(files['Email Addresses.csv']?.find((r) => clean(r['Email Address']))?.['Email Address']);
  const location = clean(p['Geo Location']) || clean(p['Address']);
  const contact = [email, location].filter(Boolean);
  if (contact.length) lines.push(contact.join(' · '));
  lines.push('');

  const summary = clean(p['Summary']);
  if (summary) {
    lines.push('## Summary', summary, '');
  }

  if (positions && positions.length) {
    lines.push('## Work Experience', '');
    for (const r of positions) {
      const company = clean(r['Company Name']);
      const title = clean(r['Title']);
      const header = [company, title].filter(Boolean).join(' — ') || 'Role';
      lines.push(`### ${header}`);
      const meta = metaLine([clean(r['Location']), dateRange(r['Started On'], r['Finished On'])]);
      if (meta) lines.push(meta);
      lines.push('');
      for (const b of descriptionBullets(r['Description'] ?? '')) lines.push(`- ${b}`);
      lines.push('');
    }
  }

  const education = files['Education.csv'];
  if (education && education.length) {
    lines.push('## Education', '');
    for (const r of education) {
      lines.push(`### ${clean(r['School Name']) || 'School'}`);
      const meta = metaLine([clean(r['Degree Name']), dateRange(r['Start Date'], r['End Date'])]);
      if (meta) lines.push(meta);
      lines.push('');
      for (const b of descriptionBullets(r['Notes'] ?? '')) lines.push(`- ${b}`);
      lines.push('');
    }
  }

  const skills = (files['Skills.csv'] ?? []).map((r) => clean(r['Name'])).filter(Boolean);
  if (skills.length) lines.push('## Skills', '', `- **Skills:** ${skills.join(', ')}`, '');

  const certs = files['Certifications.csv'] ?? [];
  if (certs.length) {
    lines.push('## Certifications', '');
    for (const r of certs) {
      const parts = [clean(r['Name']), clean(r['Authority']), dateRange(r['Started On'], r['Finished On'])].filter(Boolean);
      if (parts.length) lines.push(`- ${parts.join(' — ')}`);
    }
    lines.push('');
  }

  const projects = files['Projects.csv'] ?? [];
  if (projects.length) {
    lines.push('## Projects', '');
    for (const r of projects) {
      lines.push(`### ${clean(r['Title']) || 'Project'}`);
      const meta = metaLine([dateRange(r['Started On'], r['Finished On'])]);
      if (meta) lines.push(meta);
      lines.push('');
      for (const b of descriptionBullets(r['Description'] ?? '')) lines.push(`- ${b}`);
      lines.push('');
    }
  }

  const languages = (files['Languages.csv'] ?? []).map((r) => {
    const n = clean(r['Name']);
    const level = clean(r['Proficiency']);
    return n ? (level ? `${n} (${level})` : n) : '';
  }).filter(Boolean);
  if (languages.length) lines.push('## Languages', '', `- ${languages.join(', ')}`, '');

  return { ok: true, markdown: lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', found, missing, warnings };
}

/** True for a file that is a ZIP by name or type (the LinkedIn export) */
export function isZipFile(file: { name: string; type: string }): boolean {
  return /\.zip$/i.test(file.name) || /zip/i.test(file.type);
}
