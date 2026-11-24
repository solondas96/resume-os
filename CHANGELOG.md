# Changelog

## 2.2.0 — 25 November 2026

Import reads more layouts, and says how sure it is.

### Added

- **Import confidence.** The review shows whether a file was read with confidence, partly, or not well, in plain words, with the reasons: no name, no email or phone, lines not placed, jobs without dates or bullets.
- **Paste text instead.** When a PDF cannot be read well, the text it contains goes into the paste box, so it can be corrected before review.

### Changed

- Contact rows separated by bars or dots are read as separate details. A "Contact" section moves into the header.
- Skills separated by bars or dots are read as a list.
- A header of three comma parts reads as role, company and place (or degree, school and place).
- An education entry is its school, with the degree on the line below.
- Icon-font glyphs are bullets when they are small, and are dropped when they are text-sized (contact icons).

### Fixed

- An entry whose dates are on the line below its title is no longer listed under "Unsorted lines".
- A date range at the start of a role line, in a date column, is read with that role.
- "Mar 2017 – 2020 to date" is read as a range that runs to the present.
- A name set on two lines in large type is read as one name, and a name below an address is found.
- Labels such as "Phone:" and "Email:" in front of a contact value are not part of the value.

### Known limits

- Skills after a label with no colon ("Languages Python, SQL") keep the label in the first skill.
- Real-world PDFs: 12 scored, mean 100%, lowest 97%. Four held-out résumés were 86% on their first run; two rules were then added for the failures they showed, so they are no longer held out (their result is 100%).

## 2.1.0 — 24 November 2026

### Added

- **LinkedIn export.** The "Get a copy of your data" ZIP is read with the same review as a PDF, and nothing is uploaded.
- **Crash recovery.** An error in one panel shows a message, keeps the rest of the app and the data, and offers Download backup and Reload.
- **Send feedback** opens a prefilled GitHub issue with the version, the browser and the template. No resume content is included.
- **Welcome screen** with a three-point introduction, and a social preview image.

### Changed

- PDF pages do not leave a heading, or a role, at the foot of a page.
- The docs include a 20-minute usability script for five people who are not developers, and a made-up sample kit.

### Fixed

- The deploy refuses to continue without the Pages artifact, and checks the live site afterwards.

## 2.0.0 — 23 November 2026

The second major version. ResumeLabs now builds a real PDF in the browser, reads resumes more reliably, and is easier to use.

### Added

- **Download PDF.** A text-based PDF made on the device, with six templates, A4 or US Letter (set from the locale), and fonts embedded so the text can be selected. Print is still available.
- **Export bundle** now includes `resume.pdf` and `cover-letter.pdf`, alongside plain text, Markdown, print pages and a backup.
- **Import accuracy:** real LibreOffice exports are read correctly (100% on six files). Scanned PDFs get a clear message. Day-first and dotted dates are read.
- **Skills dictionary** for non-tech work: O\*NET work activities and tools (2,082 activities), occupation tags, and synonyms for 12 fields (about 30 each).
- **One inspector** with four tabs: Health, Match, Design and History.
- **A first-time tour** (four steps, skippable, replayable from More).
- **Drag unsorted lines** onto a section while reviewing an import. Move by menu still works.
- **Empty states** that say what to do next, on every panel.
- **Data safety:** a backup reminder after a week, restore with a preview (nothing is replaced), storage status, and delete everything (typing `DELETE` to confirm).
- **Screenshots** at 360, 768 and 1440 px in both themes, and a first-time walkthrough check (five steps, from first screen to PDF).
- **Production-build tests** (`npm run e2e:build`), so the app is tested as it ships.

### Changed

- The header keeps the main actions (Download PDF, Export, Inspector, search, More). Less common actions moved to More. On phones the header fits on one line, and the preview fits the screen.
- Plain words throughout: "Save version", "Weak verbs", "Missing numbers", "Editor" and "Preview". See `docs/COPY.md`.
- The first screen loads about a third of the previous JavaScript (76 kB gzipped, from 211 kB). The markdown parser, drag-and-drop, the zip library and confetti load when the screen that needs them opens.
- US Letter pages tighten spacing when the same resume fits one A4 page.

### Fixed

- The phone preview was cut off at the top and the left.
- CI deploy: the screenshot, visual-check and walkthrough outputs were deleted by the timing and PWA runs, which clear `test-results/`. Each now has its own folder.

### Known limits

- Import accuracy is measured on LibreOffice exports and a synthetic set. Word, Google Docs, Canva and LinkedIn exports are not in the test set yet.
- The ESCO skills list is not included (it needs a download that is sent by email).
- The first-screen budget is 2.5 s. Two network round trips and React set the floor on the simulated slow connection.

## 1.x

Earlier versions are in the git history before tag `v2.0.0`.
