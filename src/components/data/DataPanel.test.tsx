import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DataPanel } from './DataPanel';
import { RestoreReview } from './RestoreReview';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { markdownToResume } from '../../model/serialize';

describe('DataPanel: delete everything needs the typed word', () => {
  beforeEach(() => useResumeStoreV2.setState({ resumes: [], currentResume: null }));
  afterEach(() => cleanup());

  it('the delete button stays disabled until DELETE is typed exactly (negative: "delete" lower case does not count)', () => {
    render(<DataPanel />);
    const button = screen.getByRole('button', { name: 'Delete all my data' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    const box = screen.getByLabelText('Type DELETE to confirm deleting everything');
    fireEvent.change(box, { target: { value: 'delete' } });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(box, { target: { value: 'DELETE' } });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('RestoreReview: the preview before anything changes', () => {
  beforeEach(() => useResumeStoreV2.setState({ resumes: [], applications: [] }));
  afterEach(() => cleanup());

  it('a file that is not a ResumeLabs backup is refused and nothing is restored (negative)', () => {
    const notABackup = JSON.stringify({ app: 'Other' });
    render(<RestoreReview text={notABackup} onCancel={() => {}} />);
    expect(screen.getByRole('alert').textContent).toContain('cannot be restored');
    expect(screen.queryByRole('button', { name: 'Restore these' })).toBeNull();
  });

  it('a valid backup shows what will be added, by title', () => {
    const r = markdownToResume('# Jane Doe\n', 'Jane');
    const text = JSON.stringify({ app: 'ResumeLabs', version: 1, resumes: [r], applications: [] });
    render(<RestoreReview text={text} onCancel={() => {}} />);
    expect(screen.getByText('Jane Doe', { exact: false })).toBeTruthy();
    expect(screen.getByText(/1 resume/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restore these' })).toBeTruthy();
  });
});
