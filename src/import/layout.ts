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
  /** The item is drawn with an icon font (every glyph in that font is a single character) */
  icon?: boolean;
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
  /** The line is a cell beside another cell on its row (a date, a place, a label): never a list item */
  aside?: boolean;
}

/** Glyphs that mean "list item" when they come from an icon font (Symbol, Wingdings, dingbats) */
const BULLET_GLYPH = /^[•▪◦●·\-–—*]$/;
/** A year, or a month and a year */
const DATE_WORD = String.raw`(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}`;
/** A date that starts a range and is followed by its other end on another line: "Mar 2020 –" */
const DATE_OPEN = new RegExp(String.raw`^${DATE_WORD}\s*(?:–|—|-|to)$`, 'i');
/** A whole date, or the open end of a range: "Feb 2020", "Present" */
const DATE_CLOSE = new RegExp(String.raw`^(?:${DATE_WORD}|present|now|current|today)$`, 'i');

/** The size of the text that carries the most characters */
export function itemBodySize(items: TextItem[]): number {
  const weight = new Map<number, number>();
  for (const it of items) {
    if (!it.str.trim()) continue;
    const key = Math.round(it.size * 2) / 2;
    weight.set(key, (weight.get(key) ?? 0) + it.str.length);
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

interface Cell {
  text: string;
  x0: number;
  x1: number;
  size: number;
  bold: boolean;
  /** A bullet drawn with an icon font: it becomes "• " in front of the cell after it */
  bullet?: boolean;
}

/**
 * Split one visual row into cells. A cell is text that reads as one run: a gap of two
 * font sizes or more starts a new cell (a table column, or a label before its content),
 * and so does an icon. A date fragment ("Mar 2020 –") ends its cell even at a word gap,
 * so a date column beside a role is not read as one line.
 */
function cellsOfRow(parts: TextItem[], body: number): Cell[] {
  const cells: Cell[] = [];
  let cur: (Cell & { end: number }) | null = null;
  const close = () => {
    if (cur) cells.push({ text: cur.text, x0: cur.x0, x1: cur.x1, size: cur.size, bold: cur.bold });
    cur = null;
  };

  for (const p of parts) {
    if (p.icon && !BULLET_GLYPH.test(p.str.trim())) {
      // A small icon-font glyph is a bullet; a glyph at text size is a contact icon, and is dropped
      close();
      if (p.size <= body * 0.75) cells.push({ text: '•', x0: p.x, x1: p.x + p.width, size: p.size, bold: false, bullet: true });
      continue;
    }
    if (cur) {
      const gap = p.x - cur.end;
      const split =
        gap > p.size * 2 ||
        (gap > p.size * 0.6 && (DATE_OPEN.test(cur.text) || DATE_CLOSE.test(cur.text)));
      if (split) close();
    }
    if (!cur) {
      cur = { text: p.str, x0: p.x, x1: p.x + p.width, size: p.size, bold: p.bold, end: p.x + p.width };
    } else {
      const gap = p.x - cur.end;
      // A real gap is a word space; a tiny gap (a ligature split as "fi" + "rst") joins without one
      if (gap > cur.size * 0.15) cur.text += ' ';
      cur.text += p.str;
      cur.x1 = Math.max(cur.x1, p.x + p.width);
      cur.bold = cur.bold && p.bold;
      cur.end = p.x + p.width;
    }
  }
  close();
  return cells;
}

/**
 * Items on the same baseline form one row; the row is split into cells, and each cell becomes
 * a line. A date that wraps onto its own row ("Mar 2020 –" then "Present") is joined to the
 * line it belongs to, so the dates stay with their entry.
 */
export function groupItemsIntoLines(items: TextItem[], page: number): TextLine[] {
  const usable = items.filter((i) => i.str.trim().length > 0);
  const body = itemBodySize(usable);
  const sorted = [...usable].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: { y: number; parts: TextItem[] }[] = [];

  // Items join a row when their baselines are close; the smaller size sets the tolerance,
  // so a name and an address set in different sizes stay on separate rows
  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r.y - item.y) < Math.min(...r.parts.map((p) => p.size), item.size) * 0.5);
    if (row) row.parts.push(item);
    else rows.push({ y: item.y, parts: [item] });
  }

  const out: TextLine[] = [];
  // A date range that is open: its start is on `owner`, its end is still to come
  const state: { pending: { owner: TextLine; start: string } | null } = { pending: null };
  const flush = () => {
    if (state.pending) state.pending.owner.text = `${state.pending.owner.text} ${state.pending.start}`;
    state.pending = null;
  };

  for (const row of rows) {
    const cells = cellsOfRow([...row.parts].sort((a, b) => a.x - b.x), body);

    // A bullet cell joins the cell after it
    const contents: Cell[] = [];
    let bulletCell: Cell | null = null;
    for (const c of cells) {
      if (c.bullet) {
        bulletCell = c;
        continue;
      }
      if (bulletCell) {
        contents.push({ ...c, text: `• ${c.text}`, x0: bulletCell.x0 });
        bulletCell = null;
      } else {
        contents.push(c);
      }
    }
    if (bulletCell) contents.push({ ...bulletCell, text: '•' });

    const toLine = (c: Cell, aside: boolean): TextLine => ({
      text: c.text.replace(/\s+/g, ' ').trim(),
      x0: c.x0,
      x1: c.x1,
      y: row.y,
      size: c.size,
      bold: c.bold,
      page,
      ...(aside ? { aside: true } : {}),
    });

    // A whole date range at the start of a row, before the text beside it ("2020 – Present" in a
    // date column): it belongs to that text, so it is read at the end of the line
    const RANGE_PREFIX = new RegExp(String.raw`^${DATE_WORD}\s*(?:–|—|-|to)\s*(?:${DATE_WORD}|present|now|current|today)$`, 'i');
    if (contents.length >= 2 && RANGE_PREFIX.test(contents[0].text)) {
      const [range, ...rest] = contents;
      rest[0] = { ...rest[0], text: `${rest[0].text} ${range.text}` };
      contents.splice(0, contents.length, ...rest);
    }

    const rowLines: TextLine[] = [];
    let openStart: string | null = null;
    let openCell: Cell | null = null;
    for (const c of contents) {
      if (DATE_OPEN.test(c.text) && openStart === null) {
        openStart = c.text.replace(/\s*(?:–|—|-|to)$/i, '').trim();
        openCell = c;
        continue;
      }
      if (state.pending && DATE_CLOSE.test(c.text)) {
        const { owner, start } = state.pending;
        owner.text = `${owner.text} ${start} – ${c.text}`;
        state.pending = null;
        continue;
      }
      rowLines.push(toLine(c, rowLines.length > 0));
    }

    if (openStart !== null) {
      if (rowLines.length > 0) {
        flush();
        state.pending = { owner: rowLines[0], start: openStart };
      } else {
        // A range start with nothing else on its row is plain text
        rowLines.push(toLine(openCell!, false));
      }
    }
    out.push(...rowLines);
  }
  flush();
  return out;
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
