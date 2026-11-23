import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { TailorSection } from './TailorSection';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { undoRedoManager } from '../../services/undoRedo';
import { sectionItems } from '../../model/resume';

const store = () => useResumeStoreV2.getState();
const JD = 'Required:\n- Experience running Kubernetes clusters in production\n';
const DOC = `# Jane Doe
jane@example.com

## Experience
### Acme — Senior Engineer
- Organised the quarterly offsite
- Ran Kubernetes clusters in production serving 2M requests
`;

const firstBullets = () => sectionItems(store().currentResume!.sections[0])[0].bullets.map((b) => b.text);

describe('TailorSection', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStoreV2.setState({ resumes: [], currentResume: null, markdown: '', activeResumeId: '', targetJobDescription: '' });
    undoRedoManager.clear();
    store().createResume('Jane', DOC);
    store().setTargetJobDescription(JD);
  });
  afterEach(() => cleanup());

  it('asks for the tailored copy first when the resume is the original', () => {
    render(<TailorSection />);
    expect(screen.getByText(/Create the tailored copy first/)).toBeTruthy();
  });

  it('shows proposals as diffs once a tailored copy exists; nothing changes until Apply', () => {
    store().tailorFor(JD);
    render(<TailorSection />);
    expect(screen.getByLabelText('Proposed changes')).toBeTruthy();
    expect(firstBullets()[0]).toBe('Organised the quarterly offsite');
    fireEvent.click(screen.getAllByRole('button', { name: 'Accept' })[0]);
    expect(firstBullets()[0]).toBe('Organised the quarterly offsite');
  });

  it('accept then apply reorders the copy; the original keeps its order', () => {
    const originalId = store().currentResume!.id;
    store().tailorFor(JD);
    render(<TailorSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Accept all' }));
    fireEvent.click(screen.getByRole('button', { name: /Apply/ }));
    expect(firstBullets()[0]).toContain('Kubernetes');
    expect(store().currentResume!.meta.targetJobId).toBeDefined();
    const original = store().resumes.find((r) => r.id === originalId)!;
    expect(sectionItems(original.sections[0])[0].bullets[0].text).toBe('Organised the quarterly offsite');
  });

  it('reject leaves the change unapplied; Apply is disabled with nothing accepted', () => {
    store().tailorFor(JD);
    render(<TailorSection />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
    const apply = screen.getByRole('button', { name: /Apply 0/ }) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
    expect(firstBullets()[0]).toBe('Organised the quarterly offsite');
  });

  it('a press of Accept can be undone with a second press', () => {
    store().tailorFor(JD);
    render(<TailorSection />);
    const accept = screen.getAllByRole('button', { name: 'Accept' })[0];
    fireEvent.click(accept);
    expect(accept.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(accept);
    expect(accept.getAttribute('aria-pressed')).toBe('false');
  });

  it('applying is one undoable step', () => {
    store().tailorFor(JD);
    render(<TailorSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Accept all' }));
    fireEvent.click(screen.getByRole('button', { name: /Apply/ }));
    expect(firstBullets()[0]).toContain('Kubernetes');
    store().undo();
    expect(firstBullets()[0]).toBe('Organised the quarterly offsite');
  });

  it('gaps are listed as information and have no accept control', () => {
    store().setTargetJobDescription('Required:\n- Experience with Rust systems programming\n');
    store().tailorFor('Required:\n- Experience with Rust systems programming\n');
    render(<TailorSection />);
    const gaps = screen.getByText('Gaps to consider').parentElement!;
    expect(within(gaps).getByText(/No evidence yet for: Experience with Rust/)).toBeTruthy();
    expect(within(gaps).queryByRole('button')).toBeNull();
  });
});
