// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseDelimited, plainToolName, merge, topMajors, fromFields } from '../../scripts/build-skills';

describe('parseDelimited', () => {
  it('reads quoted fields with commas and newlines (ESCO style)', () => {
    const rows = parseDelimited('conceptUri,preferredLabel,altLabels\n"u1","Active listening","hearing, listening\nlistening skills"\n', ',');
    expect(rows).toHaveLength(1);
    expect(rows[0].preferredLabel).toBe('Active listening');
    expect(rows[0].altLabels).toBe('hearing, listening\nlistening skills');
  });

  it('reads tab files and keeps empty trailing fields', () => {
    const rows = parseDelimited('a\tb\tc\n1\t\t3\n', '\t');
    expect(rows[0]).toEqual({ a: '1', b: '', c: '3' });
  });

  it('negative: an empty file gives no rows', () => {
    expect(parseDelimited('', '\t')).toEqual([]);
  });
});

describe('plainToolName', () => {
  it('keeps short plain names', () => {
    expect(plainToolName('Desktop computers')).toBe(true);
    expect(plainToolName('Blood pressure monitors')).toBe(true);
  });
  it('drops names with numbers, or that are long', () => {
    expect(plainToolName('8-ton dump trucks')).toBe(false);
    expect(plainToolName('Digital Imaging Communications in Medicine DICOM system equipment')).toBe(false);
  });
});

describe('merge', () => {
  it('the first source to name a skill keeps its canonical form and gets the other aliases', () => {
    const merged = merge([
      { skills: [{ c: 'Kubernetes', a: ['k8s'], k: 'technology' }], titles: [] },
      { skills: [{ c: 'kubernetes', a: ['kube'], k: 'technology' }], titles: [] },
    ]);
    expect(merged.skills).toHaveLength(1);
    expect(merged.skills[0].c).toBe('Kubernetes');
    expect(merged.skills[0].a).toEqual(['k8s', 'kube']);
  });

  it('caps aliases and titles, and drops empty names', () => {
    const merged = merge([{ skills: [{ c: '  ', a: [], k: 'skill' }, { c: 'X', a: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], k: 'skill' }], titles: [] }]);
    expect(merged.skills.map((s) => s.c)).toEqual(['X']);
    expect(merged.skills[0].a.length).toBeLessThanOrEqual(6);
  });
});

describe('topMajors (occupation tags)', () => {
  it('positive: keeps the three most common major groups, most common first', () => {
    expect(topMajors(new Map([['11', 5], ['13', 2], ['15', 9], ['29', 1]]))).toEqual(['15', '11', '13']);
  });

  it('negative: a skill with no occupations gets no tags', () => {
    expect(topMajors(new Map())).toEqual([]);
  });
});

describe('fromFields (field synonym supplements)', () => {
  const { skills } = fromFields();

  it('positive: covers 12 non-tech fields, each with 25 or more entries, every one tagged with its field', () => {
    const fields = new Set(skills.map((s) => s.f));
    expect(fields.size).toBe(12);
    for (const f of fields) expect(skills.filter((s) => s.f === f).length).toBeGreaterThanOrEqual(25);
    expect(skills.every((s) => s.k === 'field' && s.f)).toBe(true);
  });

  it('negative: no entry is empty or has an alias that equals its own name', () => {
    expect(skills.every((s) => s.c.trim().length > 0)).toBe(true);
    expect(skills.some((s) => s.a.includes(s.c.toLowerCase()))).toBe(false);
  });
});

describe('merge keeps occupation and field tags', () => {
  it('the first source with a tag keeps it; a later source fills in a missing tag', () => {
    const merged = merge([
      { skills: [{ c: 'Triage', a: [], k: 'skill', o: ['29'] }], titles: [] },
      { skills: [{ c: 'triage', a: ['patient triage'], k: 'skill', o: ['31'], f: 'Healthcare' }], titles: [] },
    ]);
    expect(merged.skills[0].o).toEqual(['29']);
    expect(merged.skills[0].f).toBe('Healthcare');
  });
});
