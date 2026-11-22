import { describe, it, expect } from 'vitest';
import * as edit from './edit';
import { markdownToResume } from './serialize';
import { sectionItems, allBullets } from './resume';

const base = () =>
  markdownToResume('# Jane\n\n## Experience\n### Acme — Engineer\n- First\n- Second\n- Third\n', 'Jane');

describe('moveIndex', () => {
  it('positive: moves an item to a new position', () => {
    expect(edit.moveIndex(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('negative: out-of-range moves leave the list unchanged', () => {
    const list = ['a', 'b'];
    expect(edit.moveIndex(list, 0, 5)).toBe(list);
    expect(edit.moveIndex(list, -1, 0)).toBe(list);
  });
});

describe('bullet edits', () => {
  it('positive: reordering bullets keeps their ids', () => {
    const r = base();
    const sec = r.sections[0].id;
    const item = sectionItems(r.sections[0])[0];
    const ids = item.bullets.map((b) => b.id);
    const next = edit.moveBullet(r, sec, item.id, 2, 0);
    const moved = sectionItems(next.sections[0])[0].bullets.map((b) => b.id);
    expect(moved).toEqual([ids[2], ids[0], ids[1]]);
  });

  it('positive: adding and editing a bullet', () => {
    const r = base();
    const sec = r.sections[0].id;
    const item = sectionItems(r.sections[0])[0];
    const added = edit.addBullet(r, sec, item.id, 'Fourth');
    expect(allBullets(added).length).toBe(4);
    const target = sectionItems(added.sections[0])[0].bullets[3];
    const edited = edit.mapBullet(added, sec, item.id, target.id, (b) => ({ ...b, text: 'Fourth, edited' }));
    expect(sectionItems(edited.sections[0])[0].bullets[3].text).toBe('Fourth, edited');
  });

  it('negative: returning null from a bullet edit removes the bullet', () => {
    const r = base();
    const sec = r.sections[0].id;
    const item = sectionItems(r.sections[0])[0];
    const removed = edit.mapBullet(r, sec, item.id, item.bullets[0].id, () => null);
    expect(sectionItems(removed.sections[0])[0].bullets.map((b) => b.text)).toEqual(['Second', 'Third']);
  });
});

describe('section edits', () => {
  it('positive: hiding a section is reversible', () => {
    const r = base();
    const hidden = edit.setSectionHidden(r, r.sections[0].id, true);
    expect(hidden.sections[0].hidden).toBe(true);
    expect(edit.setSectionHidden(hidden, r.sections[0].id, false).sections[0].hidden).toBe(false);
  });

  it('negative: deleting a section that does not exist changes nothing', () => {
    const r = base();
    expect(edit.removeSection(r, 'no-such-id').sections.length).toBe(r.sections.length);
  });

  it('new sections have the right shape for their kind', () => {
    expect(edit.newSection('summary').kind === 'summary' && edit.newSection('summary').kind).toBe('summary');
    expect(edit.newSection('skills')).toMatchObject({ kind: 'skills', groups: [] });
    expect(edit.newSection('custom', 'Volunteering')).toMatchObject({ kind: 'custom', title: 'Volunteering', lines: [] });
  });

  it('moving sections reorders them', () => {
    const r = markdownToResume('# A\n\n## Skills\n- x\n\n## Summary\nHi\n', 'A');
    const moved = edit.moveSection(r, 0, 1);
    expect(moved.sections.map((s) => s.kind)).toEqual(['summary', 'skills']);
  });
});

describe('contact links', () => {
  it('detects the icon from the URL', () => {
    expect(edit.detectIcon('https://github.com/jane')).toBe('github');
    expect(edit.detectIcon('https://www.linkedin.com/in/jane')).toBe('linkedin');
    expect(edit.detectIcon('https://jane.dev')).toBe('globe');
  });
});

describe('skills text', () => {
  it('splits on commas and semicolons, dropping blanks', () => {
    expect(edit.skillsFromText('Go, Kafka;  , Postgres,')).toEqual(['Go', 'Kafka', 'Postgres']);
  });
});

describe('forOutput', () => {
  it('removes hidden sections and hidden bullets, and keeps everything else', () => {
    const r = markdownToResume('# A\n\n## Experience\n### Acme — Engineer\n- Keep me\n- Hide me\n\n## Skills\n- Go\n', 'A');
    const sec = r.sections[0].id;
    const item = sectionItems(r.sections[0])[0];
    const withHidden = edit.setBulletHidden(r, sec, item.id, item.bullets[1].id, true);
    const out = edit.forOutput(edit.setSectionHidden(withHidden, r.sections[1].id, true));
    expect(out.sections.map((s) => s.title)).toEqual(['Experience']);
    expect(sectionItems(out.sections[0])[0].bullets.map((b) => b.text)).toEqual(['Keep me']);
  });

  it('leaves the model itself unchanged (the form still shows hidden content)', () => {
    const r = markdownToResume('# A\n\n## Skills\n- Go\n', 'A');
    edit.forOutput(edit.setSectionHidden(r, r.sections[0].id, true));
    expect(r.sections[0].hidden).toBeUndefined();
  });
});
