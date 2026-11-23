import { describe, it, expect } from 'vitest';
import { splitDate, splitEntryHeader, moveLineToSection } from './structure';

describe('splitDate', () => {
  it('positive: a range at the end of a line is removed from the text and normalised', () => {
    expect(splitDate('Acme Corp — Engineer Jan 2019 – Present')).toEqual({ rest: 'Acme Corp — Engineer', dates: 'Jan 2019 – Present' });
  });
  it('positive: "2020 to date" counts as a date', () => {
    expect(splitDate('Account Executive Mar 2017 – 2020 to date').dates).toBeDefined();
    expect(splitDate('Designer 2020 to date').dates).toBe('2020 – Present');
  });
  it('positive: numeric month and "now"', () => {
    expect(splitDate('Designer 03/2020 - now').dates).toBe('Mar 2020 – Present');
  });
  it('negative: a word before a year is not a date range (Science 2012 – 2016 keeps Science)', () => {
    const r = splitDate('BSc Computer Science 2012 – 2016');
    expect(r.rest).toBe('BSc Computer Science');
    expect(r.dates).toBe('2012 – 2016');
  });
  it('positive: a date in parentheses at the end of the line is found (common in DOCX exports)', () => {
    expect(splitDate('Senior Software Engineer — Acme Corp (2019 – Present)')).toEqual({ rest: 'Senior Software Engineer — Acme Corp', dates: '2019 – Present' });
    expect(splitDate('Software Engineer — Globex (2016 – 2019)').dates).toBe('2016 – 2019');
  });
  it('negative: plain text with no date is left alone', () => {
    expect(splitDate('Led the migration')).toEqual({ rest: 'Led the migration' });
  });
});

describe('splitEntryHeader', () => {
  it('dashes read "Company — Role" by default', () => {
    expect(splitEntryHeader('Desert Power Systems — Project Foreman', 'experience')).toMatchObject({ head: 'Desert Power Systems', detail: 'Project Foreman', confident: true });
  });
  it('dashes read "Role — Company" when only the second part is a company', () => {
    expect(splitEntryHeader('Project Foreman — Desert Power Systems', 'experience')).toMatchObject({ head: 'Desert Power Systems', detail: 'Project Foreman' });
  });
  it('commas read "Role, Company"', () => {
    expect(splitEntryHeader('Senior Associate, Whitmore & Dale LLP', 'experience')).toMatchObject({ head: 'Whitmore & Dale LLP', detail: 'Senior Associate' });
  });
  it('a comma inside the role is handled by splitting at the last comma before a company', () => {
    expect(splitEntryHeader('Charge Nurse, ICU, St. Mary Medical Center', 'experience')).toMatchObject({ head: 'St. Mary Medical Center', detail: 'Charge Nurse, ICU' });
  });
  it('education: the school is the part with a school word', () => {
    expect(splitEntryHeader('BSc Computer Science, State University', 'education')).toMatchObject({ head: 'State University', detail: 'BSc Computer Science' });
  });
  it('a role word decides which part is the role, even when both parts look like companies', () => {
    expect(splitEntryHeader('Senior Software Engineer — Acme Corp', 'experience')).toMatchObject({ head: 'Acme Corp', detail: 'Senior Software Engineer' });
    expect(splitEntryHeader('Acme Corp — Senior Software Engineer', 'experience')).toMatchObject({ head: 'Acme Corp', detail: 'Senior Software Engineer' });
  });
  it('negative: an unrecognised pair is marked not confident', () => {
    expect(splitEntryHeader('Alpha — Beta', 'experience').confident).toBe(false);
  });
});

describe('moveLineToSection', () => {
  const md = '# A\n\n## Experience\n- Led things\n\n## Other\nStray note\n';
  it('positive: moves a stray line into the chosen section as a bullet', () => {
    const out = moveLineToSection(md, 'Stray note', 'Experience');
    const experience = out.slice(out.indexOf('## Experience'), out.indexOf('## Other'));
    expect(experience).toContain('- Stray note');
    expect(out.slice(out.indexOf('## Other'))).not.toContain('Stray note');
  });
  it('negative: an unknown line leaves the text unchanged', () => {
    expect(moveLineToSection(md, 'No such line', 'Experience')).toBe(md);
  });
  it('negative: a missing target section keeps the line where it was', () => {
    expect(moveLineToSection(md, 'Stray note', 'No such section')).toBe(md);
  });
});

describe('day-first dates in a resume line', () => {
  it('a DD/MM/YYYY range at the end of an entry line is found and normalised', () => {
    expect(splitDate('Senior Analyst — Harbourline Bank 01/03/2019 – 15/08/2022')).toEqual({
      rest: 'Senior Analyst — Harbourline Bank',
      dates: 'Mar 2019 – Aug 2022',
    });
  });
});
