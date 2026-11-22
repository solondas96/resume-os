import { describe, it, expect } from 'vitest';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

describe('PDF worker', () => {
  it('is resolved as a local bundled asset, never a CDN URL', () => {
    expect(typeof pdfWorkerUrl).toBe('string');
    expect(pdfWorkerUrl).toMatch(/pdf\.worker/);
    expect(pdfWorkerUrl).not.toMatch(/^(https?:)?\/\//);
    expect(pdfWorkerUrl).not.toMatch(/cdnjs|unpkg|jsdelivr/);
  });
});
