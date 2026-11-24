# Design review (Round 7)

Captures: `test-results-viewports/` (32 sizes and themes, four views each), with `index.html` as the contact sheet (`npm run contact-sheet`). The matrix is `tests/e2e/viewports.spec.ts`.

## Checks the matrix enforces

- no horizontal scrolling at any size
- at most four header controls
- Download PDF on screen
- header and tab-bar controls at least 44 px on touch widths
- no serious or critical axe findings (resume links excluded from target size: inline text, WCAG 2.5.8)

All 32 pass.

## What I looked at, and what I changed

| Screen | What looked wrong | Change |
| --- | --- | --- |
| Desktop, light and dark | Header and status bar were dark in light mode | Legacy colour aliases are re-declared in the dark block |
| Desktop | Light-mode captures taken mid-transition showed a dark header | Captures wait for the theme to settle |
| Phone, Page | Sheet was blank in a capture taken during the sheet's entry transition | Captures wait for the sheet |
| Phone, More | Menu sat under the tour card | Header rises above the tour while More is open |
| Phone, header | Title and buttons 24 to 36 px tall | 44 px below 1024 px |
| Phone, form | Status dots had labels but no role | `role="img"` |
| Resume page | Terracotta accent, page text `#141413` | Default accent is ink navy; page text is `--page-ink` |
| Status bar | Monospace, `\|` dividers, "Health" | Tabular numerals, no dividers, "Checks" |

## Known problems, not yet fixed

- **768 px page view is clipped on the left.** The split layout starts at 768 px, and the preview is too narrow for the sheet. The matrix does not catch this, because the pane clips rather than scrolling the document. The fix is to use the tablet segmented view below 1024 px.
- **Wide screens are not capped.** At 2560 px the editor fields are over 1000 px wide. The spec's maximum widths for the editor and Notes are not implemented.
- **Margin notes and highlighter (Step 4) are not built.** Findings are still in the Notes panel.
- **Welcome, import review and empty states (Step 6) are not reworked.**
- **Editor cards (Step 5) are not reworked.** Sections still use the card layout, and the duplicate section tag is still there.
- **Templates (Step 7) are partly done.** The default accent is ink navy. Role-line date alignment, the six-template limit and the ATS check on the new styles are not done.
- **Dark mode and forced colours (Step 8).** `prefers-contrast` and `forced-colors` are not handled.
- **Container queries, short-height rail, foldable split** (§3.6 to §3.8) are not built.
- **Contrast ratios are in `docs/DESIGN.md`**, for the token pairs in use.

## Accessory removed

- The "Precision Resume Engineering" tagline under the logo. It was jargon for the people the app is for.
