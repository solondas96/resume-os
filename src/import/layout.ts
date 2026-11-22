/**
 * Layout reconstruction for PDF text. Pure functions over positioned text items:
 * group items into visual lines, find a column gutter, and return the reading order
 * (the whole left column, then the whole right column, with full-width lines between).
 */

export interface TextItem {
  str: string;
  x: number; // left edge
  y: number; // baseline
  width: number;
  size: number; // font size
  bold: boolean;
}

export interface TextLine {
  text: string;
  x0: number;
  x1: number;
  y: number;
  size: number;
  bold: boolean;
  page: number;
  /** Which column the line sits in, when known: left, right, full width, or the only column */
  column?: 'L' | 'R' | 'full' | 'all';
}

/** Items on the same baseline form one line; items are joined left to right */
export function groupItemsIntoLines(items: TextItem[], page: number): TextLine[] {
  const usable = items.filter((i) => i.str.trim().length > 0);
  const sorted = [...usable].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: { y: number; size: number; parts: TextItem[] }[] = [];

  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r.y - item.y) < Math.max(r.size, item.size) * 0.5);
    if (row) row.parts.push(item);
    else rows.push({ y: item.y, size: item.size, parts: [item] });
  }

  return rows.map((row) => {
    const parts = [...row.parts].sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd: number | null = null;
    for (const p of parts) {
      if (prevEnd !== null) {
        const gap = p.x - prevEnd;
        // A real gap is a word space; a gap of several font sizes is a column or table break.
        // Tiny gaps (for example a ligature split as "fi" + "rst") join without a space.
        if (gap > row.size * 0.15) text += ' ';
        if (gap > row.size * 3) text += ' ';
      }
      text += p.str;
      prevEnd = p.x + p.width;
    }
    const x0 = Math.min(...parts.map((p) => p.x));
    const x1 = Math.max(...parts.map((p) => p.x + p.width));
    const bold = parts.every((p) => p.bold);
    return {
      text: text.replace(/\s+/g, ' ').trim(),
      x0,
      x1,
      y: row.y,
      size: row.size,
      bold,
      page,
    };
  });
}

/**
 * Find a vertical gutter from text items (before lines exist).
 * A real gutter is clear on almost every baseline: no item crosses it on most rows.
 * Ordinary word gaps are not, so single-column text returns null.
 */
export function findGutterFromItems(items: TextItem[]): number | null {
  const boxes = items.filter((i) => i.str.trim().length > 0);
  if (boxes.length < 12) return null;
  const minX = Math.min(...boxes.map((b) => b.x));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const width = maxX - minX;
  if (width <= 0) return null;
  const rows = new Set(boxes.map((b) => Math.round(b.y)));

  let best: number | null = null;
  let bestRows = Infinity;
  for (let g = minX + width * 0.3; g <= minX + width * 0.7; g += 2) {
    const left = boxes.filter((b) => b.x + b.width <= g + 1).length;
    const right = boxes.filter((b) => b.x >= g - 1).length;
    if (left < boxes.length * 0.25 || right < boxes.length * 0.25) continue;
    const straddleRows = new Set(
      boxes.filter((b) => b.x < g - 1 && b.x + b.width > g + 1).map((b) => Math.round(b.y))
    ).size;
    // On rows with text on both sides, the gap across the gutter must be wide.
    // Adjacent words that only happen to meet at g are not a column.
    const narrowRows = rowsWithBothSidesNarrowGap(boxes, g);
    const bothSideRows = rowsWithBothSides(boxes, g);
    if (bothSideRows > 0 && narrowRows > bothSideRows * 0.1) continue;
    if (straddleRows <= rows.size * 0.1 && straddleRows < bestRows) {
      best = g;
      bestRows = straddleRows;
    }
  }
  return best;
}

function rowsWithBothSides(boxes: TextItem[], g: number): number {
  const byRow = new Map<number, { left: TextItem[]; right: TextItem[] }>();
  for (const b of boxes) {
    const key = Math.round(b.y);
    const row = byRow.get(key) ?? { left: [], right: [] };
    if (b.x + b.width <= g + 1) row.left.push(b);
    else if (b.x >= g - 1) row.right.push(b);
    byRow.set(key, row);
  }
  return [...byRow.values()].filter((r) => r.left.length > 0 && r.right.length > 0).length;
}

function rowsWithBothSidesNarrowGap(boxes: TextItem[], g: number): number {
  const byRow = new Map<number, { left: TextItem[]; right: TextItem[] }>();
  for (const b of boxes) {
    const key = Math.round(b.y);
    const row = byRow.get(key) ?? { left: [], right: [] };
    if (b.x + b.width <= g + 1) row.left.push(b);
    else if (b.x >= g - 1) row.right.push(b);
    byRow.set(key, row);
  }
  let narrow = 0;
  for (const r of byRow.values()) {
    if (!r.left.length || !r.right.length) continue;
    const lastLeftEnd = Math.max(...r.left.map((b) => b.x + b.width));
    const firstRightStart = Math.min(...r.right.map((b) => b.x));
    const size = Math.max(...r.left.map((b) => b.size));
    if (firstRightStart - lastLeftEnd < size * 1.5) narrow++;
  }
  return narrow;
}

/**
 * Lay out one page: items are assigned to a column first, then grouped into lines
 * within each column. Two columns on the same baseline therefore stay separate.
 */
export function layoutItems(items: TextItem[], page: number): TextLine[] {
  const usable = items.filter((i) => i.str.trim().length > 0);
  const gutter = findGutterFromItems(usable);
  if (gutter === null) {
    return groupItemsIntoLines(usable, page).map((l) => ({ ...l, column: 'all' as const }));
  }
  const tagOf = (it: TextItem): 'L' | 'R' | 'full' => {
    if (it.x + it.width <= gutter + 1) return 'L';
    if (it.x >= gutter - 1) return 'R';
    return 'full';
  };
  const out: TextLine[] = [];
  for (const tag of ['L', 'R', 'full'] as const) {
    const group = usable.filter((it) => tagOf(it) === tag);
    for (const line of groupItemsIntoLines(group, page)) out.push({ ...line, column: tag });
  }
  return out.sort((a, b) => b.y - a.y);
}

/**
 * Find a vertical gutter that splits the page into two columns.
 * Returns the x position of the gutter, or null for a single-column page.
 */
export function findGutter(lines: TextLine[]): number | null {
  if (lines.length < 6) return null;
  const minX = Math.min(...lines.map((l) => l.x0));
  const maxX = Math.max(...lines.map((l) => l.x1));
  const width = maxX - minX;
  if (width <= 0) return null;

  let best: number | null = null;
  let bestCrossing = Infinity;
  for (let g = minX + width * 0.3; g <= minX + width * 0.7; g += 2) {
    const crossing = lines.filter((l) => l.x0 < g - 1 && l.x1 > g + 1).length;
    const left = lines.filter((l) => l.x1 <= g).length;
    const right = lines.filter((l) => l.x0 >= g).length;
    const enoughEachSide = left >= lines.length * 0.25 && right >= lines.length * 0.25;
    // At most one full-width line, or 10% of lines, may cross the gutter (a name or a section banner)
    if (enoughEachSide && crossing <= Math.max(1, lines.length * 0.1) && crossing < bestCrossing) {
      best = g;
      bestCrossing = crossing;
    }
  }
  return best;
}

/**
 * Reading order across pages. Lines are read top to bottom; on a two-column page,
 * each run of column lines is read left column first, then right.
 */
export function readingOrder(lines: TextLine[]): TextLine[] {
  const byPage = new Map<number, TextLine[]>();
  for (const l of lines) byPage.set(l.page, [...(byPage.get(l.page) ?? []), l]);

  const out: TextLine[] = [];
  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    const pageLines = byPage.get(page)!;
    const top = [...pageLines].sort((a, b) => b.y - a.y || a.x0 - b.x0);
    const tagged = top.some((l) => l.column !== undefined);
    const gutter = tagged ? null : findGutter(pageLines);

    if (!tagged && gutter === null) {
      out.push(...top);
      continue;
    }

    let left: TextLine[] = [];
    let right: TextLine[] = [];
    const flush = () => {
      out.push(...left, ...right);
      left = [];
      right = [];
    };
    for (const l of top) {
      if (tagged) {
        if (l.column === 'L') left.push(l);
        else if (l.column === 'R') right.push(l);
        else {
          // full width (or the only column): a separator between column runs
          flush();
          out.push(l);
        }
        continue;
      }
      if (l.x0 < gutter! - 1 && l.x1 > gutter! + 1) {
        flush();
        out.push(l);
      } else if (l.x1 <= gutter! + 1) {
        left.push(l);
      } else {
        right.push(l);
      }
    }
    flush();
  }
  return out;
}

/** Most common font size, weighted by how much text is set at that size */
export function bodySize(lines: TextLine[]): number {
  const weight = new Map<number, number>();
  for (const l of lines) {
    const key = Math.round(l.size * 2) / 2;
    weight.set(key, (weight.get(key) ?? 0) + l.text.length);
  }
  let best = 10;
  let bestWeight = -1;
  for (const [size, w] of weight) {
    if (w > bestWeight) {
      best = size;
      bestWeight = w;
    }
  }
  return best;
}
