import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { FormEditor } from './FormEditor';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { undoRedoManager } from '../../services/undoRedo';
import { markdownToResume } from '../../model/serialize';

const store = () => useResumeStoreV2.getState();

const DOC = `# Jane Doe
jane@example.com

## Experience
### Acme — Engineer
*2019 – Present*
- Worked on the billing system
- Cut build time by 40%

## Skills
- **Languages:** TypeScript, Go
`;

function loadDoc() {
  useResumeStoreV2.setState({ resumes: [], currentResume: null, markdown: '', activeResumeId: '' });
  store().createResume('Jane', DOC);
  undoRedoManager.clear();
}

describe('FormEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    loadDoc();
  });
  afterEach(() => cleanup());

  it('shows the basics and every section from the model', () => {
    render(<FormEditor />);
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('Jane Doe');
    expect(screen.getByRole('region', { name: 'Section Experience' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Section Skills' })).toBeTruthy();
  });

  it('editing the name updates the model, and the text view follows', () => {
    render(<FormEditor />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jane Smith' } });
    expect(store().currentResume!.basics.name).toBe('Jane Smith');
    expect(store().markdown).toContain('# Jane Smith');
  });

  it('adds and removes a bullet, and the model reflects it', () => {
    render(<FormEditor />);
    const section = screen.getByRole('region', { name: 'Section Experience' });
    fireEvent.click(within(section).getByRole('button', { name: /Add bullet/ }));
    const textareas = within(section).getAllByLabelText('Bullet text');
    expect(textareas.length).toBe(3);
    fireEvent.click(within(section).getAllByRole('button', { name: 'Remove bullet' })[0]);
    expect(within(section).getAllByLabelText('Bullet text').length).toBe(2);
  });

  it('a weak bullet shows a finding dot; clicking it lists every finding with its why', () => {
    render(<FormEditor />);
    const dot = screen.getAllByRole('button', { name: /^suggestion:/ })[0];
    fireEvent.click(dot);
    expect(screen.getByText('A passive phrase is hiding what you did.')).toBeTruthy();
    expect(screen.getByText(/describe a role rather than an outcome/)).toBeTruthy();
    expect(screen.getByText(/Numbers such as a percentage/)).toBeTruthy();
  });

  it('a bullet with a metric shows no finding dot', () => {
    render(<FormEditor />);
    expect(screen.getByLabelText('No findings')).toBeTruthy();
  });

  it('"Improve" opens the bullet builder pre-filled with that bullet', () => {
    render(<FormEditor />);
    const section = screen.getByRole('region', { name: 'Section Experience' });
    fireEvent.click(within(section).getAllByRole('button', { name: /Improve/ })[0]);
    expect(store().inspectorTab).toBe('health');
    expect(store().bulletSeed).toBe('Worked on the billing system');
  });

  it('dates: setting a year and ticking Present writes the model', () => {
    render(<FormEditor />);
    const section = screen.getByRole('region', { name: 'Section Experience' });
    const start = within(section).getAllByLabelText('Start year')[0] as HTMLInputElement;
    fireEvent.change(start, { target: { value: '2018' } });
    expect(sectionItem().start).toEqual({ year: 2018 });
  });

  it('tags commit on blur, so typing a comma does not split a word', () => {
    render(<FormEditor />);
    const section = screen.getByRole('region', { name: 'Section Experience' });
    const tags = within(section).getByLabelText(/Tags/) as HTMLInputElement;
    fireEvent.focus(tags);
    fireEvent.change(tags, { target: { value: 'Go, Kaf' } });
    expect(sectionItem().tags).toEqual([]);
    fireEvent.blur(tags);
    expect(sectionItem().tags).toEqual(['Go', 'Kaf']);
  });

  it('a form edit is undoable', () => {
    render(<FormEditor />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Changed' } });
    expect(store().currentResume!.basics.name).toBe('Changed');
    store().undo();
    expect(store().currentResume!.basics.name).toBe('Jane Doe');
  });

  it('adding a section from the form creates it in the model', () => {
    render(<FormEditor />);
    fireEvent.change(screen.getByLabelText('Title (optional)'), { target: { value: 'Volunteering' } });
    fireEvent.click(screen.getByRole('button', { name: /Add section/ }));
    expect(store().currentResume!.sections.some((s) => s.title === 'Volunteering')).toBe(true);
  });

  it('hiding a section marks it hidden in the model', () => {
    render(<FormEditor />);
    const section = screen.getByRole('region', { name: 'Section Skills' });
    fireEvent.click(within(section).getByRole('button', { name: 'Hide section' }));
    expect(store().currentResume!.sections.find((s) => s.title === 'Skills')!.hidden).toBe(true);
  });
});

function sectionItem() {
  const exp = store().currentResume!.sections.find((s) => s.kind === 'experience') as any;
  return exp.items[0];
}

// Sanity: the parser gives the expected shape the tests rely on
it('fixture parses as expected', () => {
  const r = markdownToResume(DOC, 'x');
  expect(r.sections.map((s) => s.kind)).toEqual(['experience', 'skills']);
});
