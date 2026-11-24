// Colours in components come from the palette tokens (docs/DESIGN.md), never from raw values or
// Tailwind colour shades. This keeps both themes correct and stops one-off colours creeping back in.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return name.endsWith('.tsx') && !name.endsWith('.test.tsx') ? [path] : [];
  });
}

const RAW = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\brgba?\(|\bhsla?\(/;
const SHADE = /\b(?:emerald|amber|rose|red|green|blue|indigo|violet|zinc|slate|gray|neutral|orange|sky|yellow|teal|cyan|lime|pink|fuchsia|purple|stone)-\d{2,3}\b/;

describe('component colours come from the palette', () => {
  const files = sources(root);

  it('finds the component sources to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('negative check: no raw colour values in components', () => {
    const hits = files.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((line, i) => ({ f, i: i + 1, line }))
        .filter(({ line }) => RAW.test(line))
        .map(({ f, i, line }) => `${f.replace(root, 'src/components')}:${i}: ${line.trim()}`)
    );
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('negative check: no Tailwind colour shades in components', () => {
    const hits = files.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((line, i) => ({ f, i: i + 1, line }))
        .filter(({ line }) => SHADE.test(line))
        .map(({ f, i, line }) => `${f.replace(root, 'src/components')}:${i}: ${line.trim()}`)
    );
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
