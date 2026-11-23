import { describe, it, expect } from 'vitest';
import { buildBundleFiles, zipBundle, readBundle, parseBackup, BACKUP_VERSION } from './exportBundle';
import { markdownToResume } from '../model/serialize';
import { setBulletHidden } from '../model/edit';
import { sectionItems } from '../model/resume';

const MD = `# Jane Doe
jane@example.com

## Experience
### Acme — Engineer
- Led migration of services
- Hidden bullet that should not be copied
`;

const resume = () => markdownToResume(MD, 'Jane');

describe('export bundle', () => {
  it('positive: contains every expected file, and the zip reads back', () => {
    const r = resume();
    const files = readBundle(zipBundle(buildBundleFiles({ resume: r, exportedAt: '2026-11-23T00:00:00.000Z', coverLetterMarkdown: 'Dear hiring team' })));
    expect(Object.keys(files).sort()).toEqual(
      ['README.txt', 'backup.json', 'cover-letter-print.html', 'cover-letter.md', 'resume-print.html', 'resume.md', 'resume.txt'].sort()
    );
    expect(files['resume.md']).toContain('Led migration of services');
  });

  it('negative: hidden bullets are left out of the copies, but kept in the backup', () => {
    const r = resume();
    const item = sectionItems(r.sections[0])[0];
    const hidden = setBulletHidden(r, r.sections[0].id, item.id, item.bullets[1].id, true);
    const files = readBundle(zipBundle(buildBundleFiles({ resume: hidden, allResumes: [hidden], exportedAt: 'x' })));
    expect(files['resume.md']).not.toContain('Hidden bullet');
    expect(files['resume.txt']).not.toContain('Hidden bullet');
    expect(files['backup.json']).toContain('Hidden bullet');
  });

  it('no cover letter, no cover letter files', () => {
    const files = readBundle(zipBundle(buildBundleFiles({ resume: resume(), exportedAt: 'x', coverLetterMarkdown: '   ' })));
    expect(files['cover-letter.md']).toBeUndefined();
  });

  it('plain text has no markdown markers', () => {
    const txt = readBundle(zipBundle(buildBundleFiles({ resume: resume(), exportedAt: 'x' })))['resume.txt'];
    expect(txt).not.toMatch(/^#/m);
    expect(txt).not.toMatch(/\*\*|`|\[icon:/);
  });

  it('the print HTML is one A4 sheet and has no script', () => {
    const html = readBundle(zipBundle(buildBundleFiles({ resume: resume(), exportedAt: 'x' })))['resume-print.html'];
    expect(html).toContain('class="a4-sheet"');
    expect(html).not.toMatch(/<script/i);
  });

  it('the backup round-trips through parseBackup', () => {
    const r = resume();
    const text = readBundle(zipBundle(buildBundleFiles({ resume: r, allResumes: [r], exportedAt: 'x' })))['backup.json'];
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.resumes[0].basics.name).toBe('Jane Doe');
  });

  it('negative: a backup of another app or version is refused with a reason', () => {
    expect(parseBackup('{"app":"Other"}')).toMatchObject({ ok: false });
    expect(parseBackup(JSON.stringify({ app: 'ResumeLabs', version: BACKUP_VERSION + 1, resumes: [] }))).toMatchObject({ ok: false });
    expect(parseBackup('not json')).toMatchObject({ ok: false });
  });
});
