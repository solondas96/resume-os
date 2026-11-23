import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ShortcutsModal } from './ShortcutsModal';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import pkg from '../../../package.json';

describe('Help shows the version that is running', () => {
  beforeEach(() => useResumeStoreV2.setState({ activeModal: 'shortcuts' }));
  afterEach(() => {
    cleanup();
    useResumeStoreV2.setState({ activeModal: null });
  });

  it('positive: the version shown matches package.json', () => {
    render(<ShortcutsModal />);
    expect(screen.getByTestId('app-version').textContent).toBe(`ResumeLabs v${pkg.version}`);
  });
});
