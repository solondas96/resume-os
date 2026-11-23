import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react';
import { TrackerModal } from './TrackerModal';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';

const store = () => useResumeStoreV2.getState();

describe('TrackerModal', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStoreV2.setState({ activeModal: 'tracker', applications: [], stats: store().stats });
    store().addApplication('Acme', 'Engineer');
    store().addApplication('Globex', 'Designer');
  });
  afterEach(() => cleanup());

  it('shows a board with a column per status, and the cards in their columns', () => {
    render(<TrackerModal />);
    const saved = screen.getByRole('region', { name: /Saved column, 2 applications/ });
    expect(within(saved).getByText('Acme')).toBeTruthy();
    expect(screen.getByRole('region', { name: /Interview column, 0 applications/ })).toBeTruthy();
  });

  it('the table view sorts by a column when its header is pressed', () => {
    store().updateApplication(store().applications[0].id, { matchScore: 30 });
    store().updateApplication(store().applications[1].id, { matchScore: 80 });
    render(<TrackerModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Match' }));
    const rows = screen.getAllByRole('row').slice(1).map((r) => r.textContent ?? '');
    expect(rows[0]).toContain('Globex');
  });

  it('a status can be changed in the table, and the change is in the store', () => {
    render(<TrackerModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    const select = screen.getByLabelText('Status for Acme') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'interview' } });
    expect(store().applications.find((a) => a.company === 'Acme')!.status).toBe('interview');
  });

  it('a linked tailored resume is shown and can be opened', () => {
    const copyId = store().createResume('Jane', '# Jane\n\n## Experience\n### Acme — Engineer\n- x\n');
    store().updateApplication(store().applications[0].id, { tailoredResumeId: copyId });
    render(<TrackerModal />);
    const acme = screen.getByRole('region', { name: /Saved column/ });
    expect(within(acme).getByRole('button', { name: /Resume: Jane/ })).toBeTruthy();
  });

  it('negative: a deleted application disappears from the board', () => {
    render(<TrackerModal />);
    const id = store().applications.find((a) => a.company === 'Acme')!.id;
    act(() => store().deleteApplication(id));
    expect(screen.queryByText('Acme')).toBeNull();
  });
});
