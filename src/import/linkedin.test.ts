// @vitest-environment node
/**
 * LinkedIn's "Get a copy of your data" export, built as a made-up ZIP with LinkedIn's column names.
 * Checks the converted Markdown by reading it back with the editor's own parser.
 */
import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { linkedinToMarkdown, descriptionBullets, dateRange } from './linkedin';
import { markdownToResume } from '../model/serialize';
import { sectionItems } from '../model/resume';

const zip = (files: Record<string, string>) =>
  zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));

const PROFILE = `First Name,Last Name,Headline,Summary,Geo Location
Zoë,Müller,"Data engineer, Berlin","Builds data tools.
Loves tea, cycling and ""clean"" code.",Berlin, Germany
`;
const EMAILS = `Email Address,Confirmed,Primary
zoe.mueller@example.com,Yes,Yes
`;
const POSITIONS = `Company Name,Title,Description,Location,Started On,Finished On
Northwind Data,Senior Data Engineer,"• Built a nightly pipeline, cutting delay to 40 minutes
• Mentored four engineers; ran the review process",Berlin,Mar 2020,
Hollis Retail,Data Analyst,"Automated weekly stock reports",Hamburg,Jun 2016,Feb 2020
,Freelance Consultant,,,2014,2016
`;
const EDUCATION = `School Name,Start Date,End Date,Notes,Degree Name
Universität Leipzig,2010,2014,"Thesis on ""time series"", graded 1.3",BSc Computer Science
`;
const SKILLS = `Name
Python
SQL

`;
const CERTS = `Name,Url,Authority,Started On,Finished On,License Number
Certified Kubernetes Administrator,,CNCF,Jan 2023,,
`;
const LANGUAGES = `Name,Proficiency
German,Native or bilingual
English,
`;

const FULL = zip({
  'Profile.csv': PROFILE,
  'Email Addresses.csv': EMAILS,
  'Positions.csv': POSITIONS,
  'Education.csv': EDUCATION,
  'Skills.csv': SKILLS,
  'Certifications.csv': CERTS,
  'Languages.csv': LANGUAGES,
});

describe('LinkedIn export: a full made-up export', () => {
  const result = linkedinToMarkdown(FULL);

  it('positive: the name is read with its non-ASCII letters, and the headline and contact line are kept', () => {
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.markdown.startsWith('# Zoë Müller\n')).toBe(true);
    expect(result.markdown).toContain('Data engineer, Berlin');
    expect(result.markdown).toContain('zoe.mueller@example.com');
  });

  it('positive: the editor reads the converted text back as the same positions, bullets and dates', () => {
    if (!result.ok) throw new Error('expected ok');
    const resume = markdownToResume(result.markdown, 'LinkedIn');
    expect(resume.basics.name).toBe('Zoë Müller');
    const exp = resume.sections.find((s) => s.kind === 'experience');
    expect(exp && exp.kind === 'experience' ? sectionItems(exp).length : 0).toBe(3);
    const first = exp && exp.kind === 'experience' ? sectionItems(exp)[0] as { company: string; role: string; bullets: { text: string }[] } : null;
    expect(first?.company).toBe('Northwind Data');
    expect(first?.role).toBe('Senior Data Engineer');
    expect(first?.bullets.map((b) => b.text)).toEqual([
      'Built a nightly pipeline, cutting delay to 40 minutes',
      'Mentored four engineers; ran the review process',
    ]);
  });

  it('positive: an empty end date means the job is current ("Present")', () => {
    if (!result.ok) return;
    expect(result.markdown).toContain('*Berlin* | *Mar 2020 – Present*');
  });

  it('positive: a position with no company shows its title alone, and the dates are kept', () => {
    if (!result.ok) return;
    expect(result.markdown).toContain('### Freelance Consultant');
    expect(result.markdown).toContain('2014 – 2016');
  });

  it('positive: skills, certifications and languages are listed; empty lines are ignored', () => {
    if (!result.ok) return;
    expect(result.markdown).toContain('- **Skills:** Python, SQL');
    expect(result.markdown).toContain('Certified Kubernetes Administrator — CNCF — Jan 2023 – Present');
    expect(result.markdown).toContain('German (Native or bilingual), English');
  });

  it('positive: the files that are there are listed as found, and nothing is missing', () => {
    if (!result.ok) return;
    expect(result.missing).toEqual(['Projects.csv']);
  });
});

describe('LinkedIn export: missing files, empty fields and a folder', () => {
  it('negative: a file that is not in the export is left out with a warning, and the rest still converts', () => {
    const r = linkedinToMarkdown(zip({ 'Profile.csv': PROFILE, 'Positions.csv': POSITIONS }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.missing).toContain('Education.csv');
    expect(r.warnings).toContain('Education.csv is not in this export, so that part is left out.');
    expect(r.markdown).not.toContain('## Education');
  });

  it('positive: files inside a folder are found by name, ignoring case', () => {
    const r = linkedinToMarkdown(zip({ 'Basic_LinkedInDataExport/profile.CSV': PROFILE, 'Basic_LinkedInDataExport/Positions.csv': POSITIONS }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.markdown).toContain('# Zoë Müller');
  });

  it('positive: a byte-order mark at the start of a file does not break the first column', () => {
    const r = linkedinToMarkdown(zip({ 'Profile.csv': '﻿' + PROFILE }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.markdown.startsWith('# Zoë Müller')).toBe(true);
  });
});

describe('LinkedIn export: refused files, with a reason', () => {
  it('negative: a file that is not a ZIP is refused', () => {
    const r = linkedinToMarkdown(strToU8('Jane Doe, not a zip'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('not a ZIP archive');
  });

  it('negative: a ZIP without LinkedIn files is refused', () => {
    const r = linkedinToMarkdown(zip({ 'notes.txt': 'hello' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('not a LinkedIn data export');
  });
});

describe('the small helpers', () => {
  it('description text becomes one bullet per line, bullets removed', () => {
    expect(descriptionBullets('• one\n- two\n\n  three ')).toEqual(['one', 'two', 'three']);
    expect(descriptionBullets('')).toEqual([]);
  });

  it('dates: an open end is "Present"; no dates gives nothing', () => {
    expect(dateRange('Mar 2019', '')).toBe('Mar 2019 – Present');
    expect(dateRange('', '')).toBe('');
    expect(dateRange('2016', '2018')).toBe('2016 – 2018');
  });
});

describe('importResume takes the LinkedIn ZIP like any other file', () => {
  it('positive: a ZIP file gives the same review result: a name, sections and bullets', async () => {
    const { importResume } = await import('../services/importResume');
    const file = new File([FULL], 'linkedin-export.zip', { type: 'application/zip' });
    const result = await importResume(file);
    expect(result.success).toBe(true);
    expect(result.resume?.basics.name).toBe('Zoë Müller');
    expect(result.text).toContain('## Work Experience');
    expect(result.detectedSections.map((s) => s.title)).toEqual(expect.arrayContaining(['Work Experience', 'Skills']));
  });

  it('negative: a ZIP that is not a LinkedIn export gives an error and no resume', async () => {
    const { importResume } = await import('../services/importResume');
    const result = await importResume(new File([zip({ 'notes.txt': 'hi' })], 'other.zip', { type: 'application/zip' }));
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('not a LinkedIn data export');
  });
});
