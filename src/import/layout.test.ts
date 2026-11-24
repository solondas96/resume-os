import { describe, it, expect } from 'vitest';
import { groupItemsIntoLines, findGutter, findGutterFromItems, layoutItems, readingOrder, bodySize, TextItem, TextLine } from './layout';

const item = (str: string, x: number, y: number, size = 10, bold = false, width = str.length * size * 0.5): TextItem => ({
  str,
  x,
  y,
  width,
  size,
  bold,
});

describe('groupItemsIntoLines', () => {
  it('positive: items on one baseline with word spaces become one line, left to right', () => {
    const lines = groupItemsIntoLines([item('Senior', 100, 700), item('Engineer', 150, 700)], 1);
    expect(lines.length).toBe(1);
    expect(lines[0].text).toBe('Senior Engineer');
  });

  it('a gap of two font sizes or more starts a new cell, so a right-aligned date is its own line', () => {
    const lines = groupItemsIntoLines([item('Senior', 100, 700), item('Engineer', 150, 700), item('2019', 400, 700)], 1);
    expect(lines.map((l) => l.text)).toEqual(['Senior Engineer', '2019']);
  });

  it('negative: items on different baselines are separate lines, top to bottom', () => {
    const lines = groupItemsIntoLines([item('Bottom', 50, 300), item('Top', 50, 700)], 1);
    expect(lines.map((l) => l.text)).toEqual(['Top', 'Bottom']);
  });

  it('a wide gap on the same baseline (a right-aligned date) is a separate cell, not a line of its own text', () => {
    const lines = groupItemsIntoLines([item('Engineer', 50, 500), item('2019 – 2021', 480, 500)], 1);
    expect(lines.map((l) => l.text)).toEqual(['Engineer', '2019 – 2021']);
  });

  it('a date that wraps onto its own row closes the range on the line above it', () => {
    const lines = groupItemsIntoLines(
      [item('Mar 2020 –', 50, 500, 10, false, 60), item('Senior Engineer', 120, 500), item('Present', 50, 485, 10, false, 40), item('Built a pipeline', 120, 485)],
      1
    );
    expect(lines.length).toBe(2);
    expect(lines[0].text).toBe('Senior Engineer Mar 2020 – Present');
    expect(lines[1].text).toBe('Built a pipeline');
  });

  it('marks bold lines only when all their text is bold', () => {
    const lines = groupItemsIntoLines([item('Title', 50, 500, 12, true), item('plain', 100, 500, 12, false)], 1);
    expect(lines[0].bold).toBe(false);
  });
});

describe('findGutter (two columns)', () => {
  const column = (x0: number, x1: number, startY: number, n: number, page = 1): TextLine[] =>
    Array.from({ length: n }, (_, i) => ({ text: 'line', x0, x1, y: startY - i * 14, size: 10, bold: false, page }));

  it('positive: finds the gutter between two columns', () => {
    const lines = [...column(50, 280, 700, 10), ...column(320, 560, 700, 10)];
    const g = findGutter(lines);
    expect(g).not.toBeNull();
    expect(g!).toBeGreaterThan(280);
    expect(g!).toBeLessThan(320);
  });

  it('negative: a single full-width column has no gutter', () => {
    const lines = column(50, 560, 700, 20);
    expect(findGutter(lines)).toBeNull();
  });
});

describe('readingOrder', () => {
  it('reads the left column fully before the right column', () => {
    const left = Array.from({ length: 4 }, (_, i) => ({ text: `L${i}`, x0: 50, x1: 280, y: 700 - i * 14, size: 10, bold: false, page: 1 }));
    const right = Array.from({ length: 4 }, (_, i) => ({ text: `R${i}`, x0: 320, x1: 560, y: 700 - i * 14, size: 10, bold: false, page: 1 }));
    const ordered = readingOrder([...right, ...left]).map((l) => l.text);
    expect(ordered).toEqual(['L0', 'L1', 'L2', 'L3', 'R0', 'R1', 'R2', 'R3']);
  });

  it('a full-width name line stays first and does not split the columns', () => {
    const name: TextLine = { text: 'Maya Chen', x0: 50, x1: 560, y: 760, size: 22, bold: true, page: 1 };
    const left = Array.from({ length: 3 }, (_, i) => ({ text: `L${i}`, x0: 50, x1: 280, y: 700 - i * 14, size: 10, bold: false, page: 1 }));
    const right = Array.from({ length: 3 }, (_, i) => ({ text: `R${i}`, x0: 320, x1: 560, y: 700 - i * 14, size: 10, bold: false, page: 1 }));
    const ordered = readingOrder([name, ...right, ...left]).map((l) => l.text);
    expect(ordered[0]).toBe('Maya Chen');
    expect(ordered.indexOf('L2')).toBeLessThan(ordered.indexOf('R0'));
  });

  it('pages keep their order', () => {
    const p2: TextLine = { text: 'second page', x0: 50, x1: 200, y: 700, size: 10, bold: false, page: 2 };
    const p1: TextLine = { text: 'first page', x0: 50, x1: 200, y: 700, size: 10, bold: false, page: 1 };
    expect(readingOrder([p2, p1]).map((l) => l.text)).toEqual(['first page', 'second page']);
  });
});

describe('bodySize', () => {
  it('is the size that carries the most text, not the largest', () => {
    const lines: TextLine[] = [
      { text: 'A short title', x0: 0, x1: 0, y: 0, size: 22, bold: true, page: 1 },
      { text: 'a much longer line of body text that carries most of the words on the page', x0: 0, x1: 0, y: 0, size: 10, bold: false, page: 1 },
    ];
    expect(bodySize(lines)).toBe(10);
  });
});

describe('layoutItems: columns stay separate on the same baseline', () => {
  // Two columns: sidebar items at x=40, main items at x=300, sharing baselines
  const rows = [700, 686, 672, 658, 644, 630, 616, 602, 588, 574];
  const side = rows.map((y, i) => item(`side ${i} words here`, 40, y, 10, false, 150));
  const main = rows.map((y, i) => item(`main ${i} body text here`, 300, y, 10, false, 220));

  it('positive: the gutter is found from item boxes', () => {
    const g = findGutterFromItems([...side, ...main]);
    expect(g).not.toBeNull();
    expect(g!).toBeGreaterThanOrEqual(190);
    expect(g!).toBeLessThan(300);
  });

  it('positive: a side item and a main item on one baseline are two lines, not one', () => {
    const lines = layoutItems([...side, ...main], 1);
    const texts = lines.map((l) => l.text);
    expect(texts.some((t) => t.includes('side') && t.includes('main'))).toBe(false);
    expect(lines.filter((l) => l.column === 'L').length).toBe(rows.length);
    expect(lines.filter((l) => l.column === 'R').length).toBe(rows.length);
  });

  it('reading order: the whole left column, then the whole right column', () => {
    const ordered = readingOrder(layoutItems([...side, ...main], 1)).map((l) => l.text);
    expect(ordered[0]).toBe('side 0 words here');
    expect(ordered.indexOf('side 9 words here')).toBeLessThan(ordered.indexOf('main 0 body text here'));
  });

  it('negative: word-level items of one ordinary column do not produce a gutter', () => {
    // Words of varying length set across the full width, so gaps fall in different places per line
    const words: TextItem[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    rows.forEach((y) => {
      let x = 40;
      while (x < 560) {
        const width = 12 + rnd() * 40;
        words.push({ str: 'wordtext', x, y, width, size: 10, bold: false });
        x += width + 3 + rnd() * 3;
      }
    });
    expect(findGutterFromItems(words)).toBeNull();
  });
});
