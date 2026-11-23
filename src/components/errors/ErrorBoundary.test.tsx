import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Broken(): React.ReactElement {
  throw new Error('boom in the preview');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('positive: a child that throws shows the top-level message with its actions', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary area="The app"><Broken /></ErrorBoundary>);
    expect(screen.getByRole('alert').textContent).toContain('Something went wrong. Your data is safe.');
    expect(screen.getByRole('button', { name: 'Download backup' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
  });

  it('positive: a compact boundary keeps the rest of the screen; the rest still renders', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <>
        <ErrorBoundary area="The preview" compact><Broken /></ErrorBoundary>
        <p>The editor still works</p>
      </>
    );
    expect(screen.getByText('The preview could not be shown. Your data is safe.')).toBeTruthy();
    expect(screen.getByText('The editor still works')).toBeTruthy();
  });

  it('negative: a child that does not throw is shown as it is', () => {
    render(<ErrorBoundary area="The app"><p>All good</p></ErrorBoundary>);
    expect(screen.getByText('All good')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('the error is logged to the console only, with the area name', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary area="The preview" compact><Broken /></ErrorBoundary>);
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[The preview] boom in the preview'))).toBe(true);
  });

  it('compact: "Try again" re-renders the child', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let fail = true;
    function Sometimes() {
      if (fail) throw new Error('once');
      return <p>recovered</p>;
    }
    render(<ErrorBoundary area="The preview" compact><Sometimes /></ErrorBoundary>);
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('recovered')).toBeTruthy();
  });
});
