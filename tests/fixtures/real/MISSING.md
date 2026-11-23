# Real-world PDFs still to add

The made-up résumés in `src/` are DOCX files written with python-docx. LibreOffice Writer (26.8.3) converts each one to PDF, and those PDFs are in `pdf/`. The `libreoffice-` fixtures are real LibreOffice exports. The people, companies and numbers are invented.

To add another tool's export: open the DOCX from `src/` in that tool, export it as PDF, and save it to `pdf/<id>.pdf` using the same id. Then run `npx vitest run tests/fixtures/real.test.ts`, which scores it and writes `report.txt`.

Not yet available here:

| Tool | Status | Why |
| --- | --- | --- |
| Microsoft Word, Save as PDF | not exported | Word is not installed on this machine. |
| Google Docs, Download as PDF | not exported | Needs a Google account and a browser session. |
| LaTeX (moderncv or Jake's Resume), pdflatex | not exported | No TeX installation here. |
| Canva design layout | not exported | Needs a Canva account. |
| LinkedIn "Save to PDF" profile | not exported | Needs a LinkedIn account. |

What each fixture tests:

| Fixture | Source | Tests |
| --- | --- | --- |
| `libreoffice-us-letter` | LibreOffice export | US Letter page size, `MM/YYYY` dates |
| `libreoffice-a4-uk` | LibreOffice export | UK dates `DD/MM/YYYY`, `+44` phone, "Profile" heading |
| `libreoffice-a4-india` | LibreOffice export | `+91` phone, DOB, CTC, notice period lines, "Work Experience" |
| `libreoffice-a4-eu` | LibreOffice export | EU dates `MM/YYYY`, DOB `DD.MM.YYYY`, German terms |
| `libreoffice-letter-photo` | LibreOffice export | A photo in the layout |
| `libreoffice-three-page` | LibreOffice export | Three pages |
| `scanned-image-only` | generated image PDF | Clear message, no OCR (not a document tool export) |
