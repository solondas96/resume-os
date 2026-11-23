# Real-world PDFs still to add

The fixtures in this folder are made-up people. Each one is a DOCX in `src/` (written with python-docx) with its expected values in `expected/`. Export each DOCX from the tool named below, and save the PDF as `pdf/<id>.pdf` with the same id. `npm run test:coverage` then scores it and writes `report.txt`.

Not done here, and why:

| Tool | Status | Why it is missing |
| --- | --- | --- |
| LibreOffice Writer | not exported | The `soffice` wrapper points at `/Applications/LibreOffice.app`, which is not installed. Installing it was not done without asking. |
| Microsoft Word, Save as PDF | not exported | Word is not available here. |
| Google Docs, Download as PDF | not exported | Needs a Google account and a browser session. |
| LaTeX (moderncv or Jake's Resume), pdflatex | not exported | No TeX installation here. |
| Canva design layout | not exported | Needs a Canva account. |
| LinkedIn "Save to PDF" profile | not exported | Needs a LinkedIn account. |

The files that *are* made here, and what each one tests:

| Fixture | Source | Tests |
| --- | --- | --- |
| `libreoffice-us-letter` | DOCX, not converted | US Letter page size, `MM/YYYY` dates |
| `libreoffice-a4-uk` | DOCX, not converted | UK dates `DD/MM/YYYY`, `+44` phone, "Profile" heading |
| `libreoffice-a4-india` | DOCX, not converted | `+91` phone, DOB, CTC, notice period lines, "Work Experience" |
| `libreoffice-a4-eu` | DOCX, not converted | EU dates `MM/YYYY`, DOB `DD.MM.YYYY`, German terms |
| `libreoffice-letter-photo` | DOCX, not converted | A photo in the layout |
| `libreoffice-three-page` | DOCX, not converted | Three pages |
| `scanned-image-only` | generated PDF (image, no text layer) | Clear message, no OCR |

The `libreoffice-` names are kept so the files are easy to match. They are not LibreOffice exports until someone converts them.
