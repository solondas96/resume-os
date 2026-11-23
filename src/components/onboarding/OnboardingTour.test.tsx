import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { OnboardingTour, TOUR_STEPS } from './OnboardingTour';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { markdownToResume } from '../../model/serialize';

const store = () => useResumeStoreV2.getState();

describe('OnboardingTour', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStoreV2.setState({ tourOpen: false, tourDone: false, currentResume: null });
  });
  afterEach(() => cleanup());

  it('has four steps, each with a title and a body', () => {
    expect(TOUR_STEPS).toHaveLength(4);
    expect(TOUR_STEPS.every((s) => s.title.length > 0 && s.body.length > 0)).toBe(true);
  });

  it('renders nothing when the tour is closed (negative)', () => {
    render(<OnboardingTour />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens once a resume exists and starts at step 1, without a backdrop', () => {
    render(<OnboardingTour />);
    act(() => useResumeStoreV2.setState({ currentResume: markdownToResume('# Jane Doe\n', 'Jane') }));
    expect(screen.getByRole('dialog', { name: TOUR_STEPS[0].title })).toBeTruthy();
    expect(screen.getByText('Step 1 of 4')).toBeTruthy();
    expect(document.querySelector('.bg-black\\/40')).toBeNull();
  });

  it('does not take focus from a field the user is typing in', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    render(<OnboardingTour />);
    act(() => useResumeStoreV2.setState({ currentResume: markdownToResume('# Jane Doe\n', 'Jane') }));
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('Next and Back move between steps; the last step finishes the tour', () => {
    useResumeStoreV2.setState({ tourOpen: true });
    render(<OnboardingTour />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2 of 4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Step 1 of 4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(store().tourOpen).toBe(false);
    expect(store().tourDone).toBe(true);
  });

  it('Escape dismisses at any step and marks the tour done', () => {
    useResumeStoreV2.setState({ tourOpen: true });
    render(<OnboardingTour />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(store().tourOpen).toBe(false);
    expect(store().tourDone).toBe(true);
  });

  it('Skip tour dismisses the tour', () => {
    useResumeStoreV2.setState({ tourOpen: true });
    render(<OnboardingTour />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(store().tourOpen).toBe(false);
  });

  it('does not open again for a resume once it is done (negative)', () => {
    useResumeStoreV2.setState({ tourDone: true });
    render(<OnboardingTour />);
    act(() => useResumeStoreV2.setState({ currentResume: markdownToResume('# Jane Doe\n', 'Jane') }));
    expect(store().tourOpen).toBe(false);
  });

  it('replay: openTour shows the tour again after it was finished', () => {
    useResumeStoreV2.setState({ tourDone: true });
    render(<OnboardingTour />);
    act(() => store().openTour());
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Step 1 of 4')).toBeTruthy();
  });
});
