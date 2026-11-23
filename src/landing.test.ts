// @vitest-environment node
/** The social preview tags and image: present, pointing at the live address, and the right size. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const LIVE = 'https://solondas96.github.io/resume-os/';

describe('social preview', () => {
  it('positive: Open Graph and Twitter tags point at the live address and the 1200 x 630 image', () => {
    expect(html).toContain(`<meta property="og:image" content="${LIVE}og-image.png" />`);
    expect(html).toContain(`<meta name="twitter:image" content="${LIVE}og-image.png" />`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).toContain('<meta property="og:image:height" content="630" />');
  });

  it('positive: the image file exists and is a PNG of 1200 x 630 pixels', () => {
    const bytes = readFileSync(join(process.cwd(), 'public', 'og-image.png'));
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    expect(width).toBe(1200);
    expect(height).toBe(630);
  });
});
