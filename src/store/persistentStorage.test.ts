// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useResumeStoreV2 } from './useResumeStoreV2';

const store = () => useResumeStoreV2.getState();

describe('persistent storage is requested once, on the first resume', () => {
  let persist: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    persist = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist, persisted: vi.fn().mockResolvedValue(false), estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 1 }) },
    });
    useResumeStoreV2.setState({ resumes: [], currentResume: null, storageRequested: false, storageKept: null });
  });

  it('positive: the first resume asks the browser once, and the answer is stored', async () => {
    store().createResume('First');
    await vi.waitFor(() => expect(store().storageKept).toBe(true));
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('negative: a second resume does not ask again', async () => {
    store().createResume('First');
    store().createResume('Second');
    await vi.waitFor(() => expect(store().storageKept).toBe(true));
    expect(persist).toHaveBeenCalledTimes(1);
    expect(store().storageRequested).toBe(true);
  });

  it('negative: when the browser has already asked earlier, nothing is requested again', async () => {
    useResumeStoreV2.setState({ storageRequested: true });
    store().createResume('Later');
    await new Promise((r) => setTimeout(r, 20));
    expect(persist).not.toHaveBeenCalled();
  });
});
