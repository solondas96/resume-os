# Design tokens

ResumeLabs uses warm, minimal colors and one font family for the interface. Colors are CSS custom properties on `:root` (light) and `.dark` (dark) in `src/index.css`. Tailwind classes such as `bg-card` and `text-brand-text` read those variables, so changing a token changes the whole app.

Use a token, never a raw color, in components. The exception is the resume's own accent color, which the user picks.

## Colors

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--background` | `#faf9f5` | `#262624` | Page background |
| `--foreground` | `#141413` | `#f5f4ee` | Main text |
| `--card` | `#ffffff` | `#30302e` | Panels, dialogs, the inspector |
| `--card-foreground` | `#141413` | `#f5f4ee` | Text on cards |
| `--muted` | `#f0eee6` | `#3a3a37` | Quiet buttons, chips, hover fills |
| `--muted-foreground` | `#6b6a64` | `#a8a69e` | Secondary text |
| `--border` | `#e8e6dc` | `#3d3d3a` | Dividers and outlines |
| `--input` | `#e8e6dc` | `#3d3d3a` | Form field borders |
| `--ring` | `#c96442` | `#d97757` | Focus rings |
| `--brand` | `#c96442` | `#d97757` | Accents, the active tab line, the brand mark |
| `--brand-hover` | `#b5563a` | `#c96442` | Hover on brand fills |
| `--brand-text` | `#a64c2d` | `#ec9a7a` | Brand-colored text and icons (passes 4.5:1 on the background) |
| `--brand-button` | `#a64c2d` | `#a64c2d` | Primary button fill (white text) |
| `--accent` | `#f5e9e2` | `#3d2e27` | Selected state background |
| `--accent-foreground` | `#7a3a22` | `#f0c4b1` | Text on accent |
| `--primary` | `#141413` | `#f5f4ee` | Main call to action (for example Export) |
| `--primary-foreground` | `#faf9f5` | `#262624` | Text on primary |
| `--secondary` | `#f0eee6` | `#3a3a37` | Secondary surfaces |
| `--destructive` | `#b3261e` | `#f2877c` | Delete and other irreversible actions |

Status colors use Tailwind's emerald (good), amber (check this) and rose (problem) at the 700 shade in light and the 400 shade in dark, for text. Never color alone: each status also has a word.

Shadows: `--shadow-card` for cards at rest, `--shadow-lifted` for floating panels and menus.

## Type

- Interface: Geist (`--font-sans`). Resume preview and PDF: Geist for sans templates, Newsreader for serif templates.
- Code and numbers: Geist Mono (`--font-mono`), used for scores, counts and dates in the status bar.
- Sizes: 12px for secondary text, 14px for body, 16px and up for headings. Small labels at 11px are allowed only for secondary notes.
- Fonts are self-hosted from `public/fonts/` and listed in the service worker's precache.

## Space and shape

- Spacing on a 4px grid (Tailwind's default scale).
- Radius: `rounded-lg` for buttons and fields, `rounded-xl` for cards, `rounded-2xl` for dialogs.
- Minimum touch target 36px high (40px on phones where it matters).

## Breakpoints

| Name | Width | What changes |
| --- | --- | --- |
| Phone | 360px | One column. The editor and preview are tabs. The inspector is full width. |
| Tablet | 768px | The header shows the main actions. The inspector is a 420px panel. |
| Desktop | 1440px | Editor and preview side by side. All header labels visible. |

The screenshot test captures all three widths in light and dark (see `tests/e2e/screenshots.spec.ts`), and CI keeps the images as an artifact.

## Motion

- 150 to 200 ms for hover, open and close.
- Respect `prefers-reduced-motion`: use the `motion-safe:` and `motion-reduce:` variants, never animate by default.
- Celebrate only real milestones: the first download, and a health score of 85 or more.

## Contrast

Text meets WCAG 2.2 AA (4.5:1 for body text, 3:1 for large text and UI borders) in both themes. The brand text token was darkened from the first design (3.9:1) to `#a64c2d` for this reason. The accessibility scan (`tests/e2e/a11y.spec.ts`) checks the main screens in both themes.

## Adding a token

1. Add it to `:root` and `.dark` in `src/index.css`.
2. Map it in `tailwind.config` if it needs a utility class.
3. Check the contrast in both themes (a 4.5:1 minimum for text).
4. Add it to the table above.
