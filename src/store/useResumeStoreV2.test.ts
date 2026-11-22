import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStoreV2 } from './useResumeStoreV2';
import { undoRedoManager } from '../services/undoRedo';
import { saveResume } from '../services/persistence';
import type { Resume } from '../model/resume';

const store = () => useResumeStoreV2.getState();

const SAMPLE = `# Jane Doe
jane@example.com

## Experience
### Acme — Engineer
- Led migration to TypeScript, cutting build time 40%
`;

describe('useResumeStoreV2', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStoreV2.setState({
      resumes: [],
      activeResumeId: '',
      currentResume: null,
      markdown: '',
      revisions: [],
      recruiterViewMode: false,
    });
    undoRedoManager.clear();
  });

  it('creates a resume and derives markdown and design from the model', () => {
    const id = store().createResume('Jane', SAMPLE);
    const s = store();
    expect(s.currentResume?.id).toBe(id);
    expect(s.currentResume?.basics.name).toBe('Jane Doe');
    expect(s.markdown).toBe(SAMPLE);
    expect(s.theme).toBe('modern');
  });

  it('parses text edits into the model and keeps the raw buffer exactly as typed', () => {
    store().createResume('Jane', SAMPLE);
    const edited = SAMPLE.replace('Engineer', 'Staff Engineer');
    store().setMarkdown(edited);
    const s = store();
    expect(s.markdown).toBe(edited);
    expect(JSON.stringify(s.currentResume?.sections)).toContain('Staff Engineer');
  });

  it('keeps text the parser does not model (no silent data loss)', () => {
    const odd = SAMPLE + '\nA free-form paragraph the parser does not model.\n';
    store().createResume('Jane', odd);
    expect(store().markdown).toBe(odd);
    store().setTheme('classic');
    expect(store().markdown).toBe(odd);
    store().setMarkdown(odd);
    store().undo();
    expect(store().markdown).toBe(odd);
  });

  it('keeps design settings on the model when the text changes', () => {
    store().createResume('Jane', SAMPLE);
    store().setTheme('classic');
    store().setAccentColor('#123456');
    store().setMarkdown(SAMPLE + '\n- Shipped a thing\n');
    const s = store();
    expect(s.currentResume?.design.template).toBe('classic');
    expect(s.currentResume?.design.accent).toBe('#123456');
    expect(s.theme).toBe('classic');
  });

  it('undo and redo restore the previous model and text', () => {
    store().createResume('Jane', SAMPLE);
    const original = store().markdown;
    store().setMarkdown(original + '\n- First change\n');
    const changed = store().markdown;
    expect(changed).not.toBe(original);

    store().undo();
    expect(store().markdown).toBe(original);

    store().redo();
    expect(store().markdown).toBe(changed);
  });

  it('a redo is still available after undo (regression: redo stack was cleared)', () => {
    store().createResume('Jane', SAMPLE);
    store().setTheme('classic');
    store().undo();
    expect(store().canRedo()).toBe(true);
    store().redo();
    expect(store().theme).toBe('classic');
  });

  it('saves a named revision and restores it, snapshotting first', () => {
    store().createResume('Jane', SAMPLE);
    store().saveRevision('v1');
    const v1 = store().revisions[0];
    expect(v1.markdown).toBe(SAMPLE);

    store().setMarkdown('# Someone Else\n');
    store().restoreRevision(v1);

    expect(store().currentResume?.basics.name).toBe('Jane Doe');
    // restoring first snapshots the state being replaced
    expect(store().revisions.some((r) => r.title.startsWith('Before restoring'))).toBe(true);
  });

  it('deletes a revision', () => {
    store().createResume('Jane', SAMPLE);
    store().saveRevision('gone');
    const id = store().revisions[0].id;
    store().deleteRevision(id);
    expect(store().revisions.find((r) => r.id === id)).toBeUndefined();
  });

  it('shared recruiter links are previewed in memory and not saved', () => {
    store().openSharedView({
      title: 'Shared',
      markdown: '# Shared Person\n',
      theme: 'minimal',
      accentColor: '#000000',
      fontSize: 'medium',
      marginSize: 'normal',
      lineHeight: 'normal',
    });
    const s = store();
    expect(s.recruiterViewMode).toBe(true);
    expect(s.currentResume?.basics.name).toBe('Shared Person');
    expect(s.resumes.find((r) => r.id === 'shared-view')).toBeUndefined();
  });

  it('tracker: adds, updates and deletes applications', () => {
    useResumeStoreV2.setState({ applications: [], stats: store().stats });
    store().addApplication('Acme', 'Engineer');
    const id = store().applications[0].id;
    store().updateApplication(id, { status: 'interview' });
    expect(store().applications[0].status).toBe('interview');
    expect(store().stats.byStatus.interview).toBe(1);
    store().deleteApplication(id);
    expect(store().applications.length).toBe(0);
  });

  it('re-parses a record saved with the old source field, then drops the field', async () => {
    const legacy = {
      id: 'legacy-1',
      schemaVersion: 2,
      meta: { title: 'Old', createdAt: 1, updatedAt: 2 },
      basics: { name: 'Stale Name', links: [] },
      sections: [],
      design: { template: 'modern', accent: '#c96442', fontSize: 'medium', margin: 'normal', lineHeight: 'normal' },
      source: '# Fresh Name\n\n## Experience\n### Acme — Engineer\n- Built things\n',
    } as unknown as Resume;
    await saveResume(legacy);

    await store().loadResumes();

    const loaded = store().currentResume!;
    expect(loaded.basics.name).toBe('Fresh Name');
    expect(JSON.stringify(loaded.sections)).toContain('Built things');
    expect('source' in loaded).toBe(false);
  });
});
