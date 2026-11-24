# Real-world PDFs still to add

The made-up résumés in `src/` are DOCX files written with python-docx. LibreOffice Writer (26.8.3) converts each one to PDF, and those PDFs are in `pdf/`. The `libreoffice-` fixtures are real LibreOffice exports. The people, companies and numbers are invented.

To add another tool's export: open the DOCX from `src/` in that tool, export it as PDF, and save it to `pdf/<id>.pdf` using the same id. Then run `npx vitest run tests/fixtures/real.test.ts`, which scores it and writes `report.txt`.

Not yet available here:

| Tool | Status | Why |
| --- | --- | --- |
| LaTeX (moderncv, Jake-style) | added (`latex/`, `pdf/latex-*.pdf`) | compiled with tectonic (a TeX engine), not TeX Live |
| Hand-written HTML, four layouts | added (`html/`, `pdf/html-*.pdf`) | printed with Chromium (Playwright) |
| Microsoft Word, Save as PDF | not exported | Word is not installed on this machine. See the checklist below. |
| Google Docs, Download as PDF | not exported | Needs a Google account and a browser session. See the checklist below. |
| Canva design layout | not exported | Needs a Canva account. See the checklist below. |
| LinkedIn "Save to PDF" profile | not exported | Needs a LinkedIn account. See the checklist below. |

## How to add the missing exports (for the developer)

For each tool, open the made-up résumé in `src/` (DOCX) or the matching sample, export it as PDF, and save it as `pdf/<tool>-<id>.pdf`. Then add `expected/<tool>-<id>.json` with the same values as the DOCX source (see `expected/libreoffice-us-letter.json` for the shape). Run `npx vitest run tests/fixtures/real.test.ts`.

- **Word (Windows or Mac):** File > Save As > PDF (Mac: File > Export > PDF). Keep "Standard" quality. Do not choose "Minimum size", which can drop text.
- **Google Docs:** upload the DOCX to Google Drive, open it with Google Docs, then File > Download > PDF Document. Use a made-up account or a sample file.
- **Canva:** create a résumé from the Canva template library, replace the text with the made-up person's details, then Share > Download > PDF Print (or PDF Standard). Keep the text as text, not as an image.
- **LinkedIn:** Me > View profile > More > Save to PDF. Use a made-up profile (the PDF uses the account's real data, so do not export a real person's profile into the repository).

Name each file `pdf/<tool>-<id>.pdf`, for example `pdf/word-ava-thompson.pdf`, and keep the expected file next to it. Never commit a real person's résumé here; use `tests/fixtures/private/` for that (see its README).

## What each fixture tests

| Fixture | Source | Tests |
| --- | --- | --- |
| `libreoffice-us-letter` | LibreOffice export | US Letter page size, `MM/YYYY` dates |
| `libreoffice-a4-uk` | LibreOffice export | UK dates `DD/MM/YYYY`, `+44` phone, "Profile" heading |
| `libreoffice-a4-india` | LibreOffice export | `+91` phone, DOB, CTC, notice period lines, "Work Experience" |
| `libreoffice-a4-eu` | LibreOffice export | EU dates `MM/YYYY`, DOB `DD.MM.YYYY`, German terms |
| `libreoffice-letter-photo` | LibreOffice export | A photo in the layout |
| `libreoffice-three-page` | LibreOffice export | Three pages |
| `latex-moderncv` | LaTeX, tectonic compile | moderncv classic style: a date column, `\cventry` entries, a name block (below 90%) |
| `latex-jakes-style` | LaTeX, tectonic compile | a single-column LaTeX layout written in that style (not copied from a template) |
| `html-two-column-grid` | Chromium print of hand-written HTML | a two-column grid, contact in the left column (below 90%) |
| `html-sidebar-icons` | Chromium print of hand-written HTML | a shaded sidebar with icon glyphs (below 90%) |
| `html-table-layout` | Chromium print of hand-written HTML | a table with a label column (below 90%) |
| `html-centered-pipes` | Chromium print of hand-written HTML | a centred name, contact row separated by `\|` (below 90%) |
| `scanned-image-only` | generated image PDF | Clear message, no OCR (not a document tool export) |

## Layouts that scored below 90% before Round 6 Step 2

Scored by `npx vitest run tests/fixtures/real.test.ts` (see `report.txt`). All five are now at 97% or above. Each row says what was wrong and what changed.

| Fixture | Before | Now | What was wrong, and the change |
| --- | --- | --- | --- |
| `latex-moderncv` | 25% | 97% | The name and the address shared a row (the row tolerance used the larger font size), and the address sat above the name. Now the row tolerance uses the smaller size, and the largest text near the top is the name. Dingbat bullets and contact icons come from an icon font (one character per glyph), so they are read as bullets or dropped. Dates wrap to their own column and join the role. **Still missed:** the skills label "Languages" has no colon, so it stays in the skill ("Languages Python"). |
| `html-table-layout` | 36% | 100% | Section labels and their content are cells split by a gap of two font sizes. A table row gives a heading and a line of content. The skill "Lean Six Sigma (green belt)" is the name in the source, so the expected value was corrected to match it. |
| `html-sidebar-icons` | 64% | 100% | The name is two lines in the same large size. Contact icons are dropped. |
| `html-two-column-grid` | 73% | 100% | A "Contact" section is moved up into the header. The school is the entry header, and the degree is its meta line. |
| `html-centered-pipes` | 82% | 100% | A contact row split on `\|`, `·`, `•`; skills separated by pipes read as a list. |
| `latex-jakes-style` | 91% | 100% | The role on the line after the dates is read as the role of an entry that had only a company. |
