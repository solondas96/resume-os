import { describe, it, expect } from 'vitest';
import * as edit from './edit';
import { markdownToResume } from './serialize';
import { sectionItems } from './resume';

const DOC = `# Jane
jane@example.com

## Experience
### Acme — Engineer
- First
- Second
- Third

## Education
### State University
*BSc Computer Science* | *2012 – 2016*

## Projects
### HyperCache
*Open source* | [icon:github github.com/a/hc](https://github.com/a/hc)
- Built a cache

## Skills
- **Languages:** Go, Rust
- **Cloud:** AWS
`;

describe('model edits: items and sections', () => {
  const r = () => markdownToResume(DOC, 'J');

  it('moveItem reorders entries and ignores non-entry sections', () => {
    const base = r();
    const exp = base.sections[0];
    const two = edit.mapSection(base, exp.id, (s) => ({ ...s, items: [...(s as any).items, edit.newEntry('experience')] }) as any);
    const moved = edit.moveItem(two, exp.id, 0, 1);
    expect((sectionItems(moved.sections[0])[1] as any).company).toBe('Acme');
    const skills = base.sections.find((s) => s.kind === 'skills')!;
    expect(edit.moveItem(base, skills.id, 0, 1)).toEqual(base);
  });

  it('mapItem and mapBullet leave other items alone and can edit a project', () => {
    const base = r();
    const proj = base.sections.find((s) => s.kind === 'projects')!;
    const item = sectionItems(proj)[0];
    const renamed = edit.mapItem(base, proj.id, item.id, (it) => ({ ...it, title: 'Renamed' }) as any);
    expect((sectionItems(renamed.sections.find((s) => s.kind === 'projects')!)[0] as any).title).toBe('Renamed');
    expect(edit.mapItem(base, proj.id, 'missing', (it) => it)).toEqual(base);
  });

  it('setBulletOrder keeps bullets it was not given, in their place', () => {
    const base = r();
    const exp = base.sections[0];
    const item = sectionItems(exp)[0] as any;
    const [a, b, c] = item.bullets.map((x: any) => x.id);
    const next = edit.setBulletOrder(base, exp.id, item.id, [c, a]);
    expect((sectionItems(next.sections[0])[0] as any).bullets.map((x: any) => x.id)).toEqual([c, a, b]);
    // unknown ids are ignored
    const unknown = edit.setBulletOrder(base, exp.id, item.id, ['nope', b]);
    expect((sectionItems(unknown.sections[0])[0] as any).bullets.map((x: any) => x.id)).toEqual([b, a, c]);
  });

  it('setBulletHidden toggles and setBulletOrder ignores missing items', () => {
    const base = r();
    const exp = base.sections[0];
    const item = sectionItems(exp)[0] as any;
    const hidden = edit.setBulletHidden(base, exp.id, item.id, item.bullets[0].id, true);
    expect((sectionItems(hidden.sections[0])[0] as any).bullets[0].hidden).toBe(true);
    expect(edit.setBulletOrder(base, exp.id, 'missing', [])).toEqual(base);
  });

  it('removeSection removes only the named section', () => {
    const base = r();
    const next = edit.removeSection(base, base.sections[0].id);
    expect(next.sections.length).toBe(base.sections.length - 1);
  });

  it('new entries, sections, groups, lines and links have the right shape', () => {
    expect(edit.newEntry('education')).toMatchObject({ school: '', bullets: [] });
    expect(edit.newEntry('projects')).toMatchObject({ title: '' });
    expect(edit.newSection('education')).toMatchObject({ kind: 'education', items: [] });
    expect(edit.newSection('projects')).toMatchObject({ kind: 'projects', items: [] });
    expect(edit.newSection('certifications')).toMatchObject({ kind: 'certifications', lines: [] });
    expect(edit.newGroup('Tools')).toMatchObject({ label: 'Tools', skills: [] });
    expect(edit.newLine('text', 'hi')).toMatchObject({ kind: 'text', text: 'hi' });
    expect(edit.newLink()).toMatchObject({ label: '', url: '' });
    expect(typeof edit.newId()).toBe('string');
  });

  it('setYearMonth fills in a missing year with this year', () => {
    expect(edit.setYearMonth(undefined, { month: 5 })).toMatchObject({ month: 5 });
    expect(edit.setYearMonth({ year: 2019 }, { month: 2 })).toEqual({ year: 2019, month: 2 });
  });

  it('itemCount counts entries, groups, lines and paragraphs by kind', () => {
    const base = r();
    expect(edit.itemCount(base.sections[0])).toBe(1);
    expect(edit.itemCount(base.sections.find((s) => s.kind === 'skills')!)).toBe(2);
    expect(edit.itemCount(markdownToResume('# A\n\n## Summary\nOne.\n', 'A').sections[0])).toBe(1);
    expect(edit.itemCount(markdownToResume('# A\n\n## Notes\n- x\n', 'A').sections[0])).toBe(1);
  });

  it('moveSection and setGroupOrder handle out-of-range moves as no-ops', () => {
    const base = r();
    expect(edit.moveSection(base, 0, 99)).toEqual(base);
    const skills = base.sections.find((s) => s.kind === 'skills')!;
    expect(edit.setGroupOrder(base, base.sections[0].id, [])).toEqual(base);
    const reordered = edit.setGroupOrder(base, skills.id, [(skills as any).groups[1].id]);
    expect((reordered.sections.find((s) => s.kind === 'skills') as any).groups[0].label).toBe('Cloud');
  });
});
