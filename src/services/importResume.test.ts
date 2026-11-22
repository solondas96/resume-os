import { describe, it, expect } from 'vitest';
import { itemsToLines, normalizeHeadings } from './importResume';

describe('itemsToLines (PDF text grouping)', () => {
  it('groups items on the same baseline into one line, left to right', () => {
    const items = [
      { str: 'Maya', transform: [1, 0, 0, 1, 50, 700] },
      { str: 'Chen', transform: [1, 0, 0, 1, 110, 701] },
      { str: 'Summary', transform: [1, 0, 0, 1, 50, 650] },
    ];
    expect(itemsToLines(items)).toBe('Maya Chen\nSummary');
  });

  it('negative: items on different baselines are not merged', () => {
    const items = [
      { str: 'First', transform: [1, 0, 0, 1, 50, 700] },
      { str: 'Second', transform: [1, 0, 0, 1, 50, 680] },
    ];
    expect(itemsToLines(items).split('\n')).toEqual(['First', 'Second']);
  });
});

describe('normalizeHeadings', () => {
  it('positive: plain section headings become ## headings and the first line becomes the name', () => {
    const out = normalizeHeadings('Maya Chen\nmaya@example.com\n\nEXPERIENCE\nEngineer\n\nEducation:\nBSc');
    expect(out.split('\n')[0]).toBe('# Maya Chen');
    expect(out).toContain('## Experience');
    expect(out).toContain('## Education');
  });

  it('negative: ordinary sentences containing a section word are left alone', () => {
    const out = normalizeHeadings('Jane Doe\nI have experience with Kubernetes.');
    expect(out).not.toContain('## ');
    expect(out).toContain('I have experience with Kubernetes.');
  });
});
