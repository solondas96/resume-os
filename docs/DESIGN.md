# Design

ResumeLabs is "the editor's desk": a calm cool surface (the desk), white paper (the resume page) and one blue pencil for the things the user acts on. Job-match keywords are marked with a highlighter, and health findings appear as margin notes. Colours and type are CSS custom properties on `:root` (light) and `.dark` (dark) in `src/index.css`. Tailwind classes such as `bg-desk`, `text-ink` and `bg-pencil` read those variables.

Use a token, never a raw colour, in components. `src/components/tokens.test.ts` fails on raw hex, `rgb(`, or Tailwind colour shades. The exceptions are the resume's own accent colour, which the user picks, and the page's text, which uses `--page-ink`.

## Colours

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--desk` | `#ecefea` | `#14171b` | App background, the surface the page sits on |
| `--surface` | `#f8f9f6` | `#1c2026` | Editor panel, menus, sheets |
| `--paper` | `#ffffff` | `#ffffff` | The resume page, in both themes |
| `--ink` | `#1a1f2b` | `#e7eaef` | Main text |
| `--graphite` | `#565e6c` | `#a3abb8` | Secondary text |
| `--rule` | `#d5dad3` | `#2c323b` | Dividers and field outlines |
| `--muted` | `#e2e6df` | `#262b33` | Quiet buttons, chips, hover fills |
| `--pencil` | `#2f49c9` | `#8ea0ff` | The one accent: main button, focus, active tab, margin marks |
| `--pencil-dark` | `#24379c` | `#b9c4ff` | Hover on pencil, text on pencil-soft |
| `--pencil-soft` | `#e4e8fb` | `#232b4d` | Selected states |
| `--on-pencil` | `#ffffff` | `#0e1220` | Text on a pencil button |
| `--highlighter` | `#f6e47a` | `#e7d45a` | Highlights (job keywords). A background behind ink, never text colour |
| `--tick` | `#25734f` | `#5fcb97` | Good: done, matched |
| `--tick-soft` | `#e0f0e7` | `#1d3a2e` | Background for good status |
| `--redpen` | `#b4321f` | `#f08a78` | Problems and destructive actions only |
| `--redpen-soft` | `#f8e4df` | `#3d2521` | Background for problems |
| `--page-ink` | `#1a1f2b` | `#1a1f2b` | Text on the resume page (paper is always white) |

Rules:
- One accent (`--pencil`). `--tick`, `--redpen` and `--highlighter` carry meaning only.
- Every status also has a word or an icon: colour is never the only signal.
- No gradients, no glass, no glows.

### Contrast (WCAG 2.2)

Ratios are text on background. Body text needs 4.5:1; large text and UI parts 3:1.

| Text | On | Light | Dark | Passes |
| --- | --- | --- | --- | --- |
| `--ink` | `--desk` | 14.20 | 14.91 | both |
| `--ink` | `--surface` | 15.59 | 13.56 | both |
| `--graphite` | `--desk` | 5.63 | 7.77 | both |
| `--graphite` | `--surface` | 6.18 | 7.07 | both |
| `--pencil` | `--desk` | 6.20 | 7.38 | both |
| `--pencil` | `--surface` | 6.81 | 6.72 | both |
| `--tick` | `--surface` | 5.45 | 8.16 | both |
| `--redpen` | `--surface` | 5.82 | 6.71 | both |
| `--page-ink` | `--highlighter` | 12.78 | 10.95 | both |
| `--on-pencil` | `--pencil` | 7.20 | 7.66 | both |
| `--page-ink` | `--paper` | 16.47 | 16.47 | both |
| `--graphite` | `--paper` | 6.54 | n/a (the page uses `--page-ink`) | light |

The dark-theme page text is `--page-ink` on white, so it is never the dark-theme `--ink` (which would be 1.21:1 on white).

## Type

- Interface: Atkinson Hyperlegible Next (`--font-sans`), self-hosted weights 400, 500, 700 and italic 400. Its letters are built to be told apart (I, l, 1; O, 0).
- Numbers: the same family with `tabular-nums`. No monospace in the interface.
- Resume templates keep their own fonts: Geist for sans templates and Newsreader for serif ones (`--font-serif`). Geist Mono is only used by the Advanced Markdown editor.
- Sizes follow the browser's text size (rem-based): 12, 14, 16 (body), 20, 25, 31, 39. Line-height 1.5 for body, 1.2 for headings.
- Sentence case everywhere. No ALL-CAPS labels and no letter-spaced eyebrows.
- Fonts are self-hosted from `public/fonts/` (the Atkinson licence is `public/fonts/ATKINSON-OFL.txt`).

## Shape and depth

- Radius by role: fields and buttons 8 px, menus and sheets 12 px, the page 2 px, dialogs 16 px.
- Shadows: `--shadow-page` (two layers) on the page only. `--shadow-lifted` on menus and sheets. Form groups have no shadow.
- Spacing on a 4 px grid.

## Motion

- Sheets and menus open in 150 to 200 ms.
- Nothing animates by default. `prefers-reduced-motion` removes all motion.

## Breakpoints

To be set in the frame (Round 7, Step 2). Layouts use container queries for their regions.

## Adding a token

1. Add it to `:root` and `.dark` in `src/index.css`.
2. Map it in `tailwind.config.js` if it needs a utility class.
3. Check the contrast in both themes (4.5:1 minimum for text) and add it to the table above.
