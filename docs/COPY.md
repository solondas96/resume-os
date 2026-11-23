# Copy guide

ResumeLabs is for people who are not experts in resumes or software. Use plain words. The test is: would a friend who has never written a CV understand this on first read?

## Rules

1. Say what happens, then why. "Download PDF makes a file on this device" beats "Exports a text-based PDF".
2. Use the words people use: "save a version", not "snapshot"; "weak verbs", not "action verb linting"; "missing numbers", not "XYZ impact".
3. Keep one name for one thing. The inspector is always "Inspector", its tabs are Health, Match, Design and History.
4. No blame. Say "Add a number to this line" rather than "This bullet is weak".
5. Keep technical terms only where they are the actual name, for example "Markdown" in the advanced text view, and "ATS" only inside the panel that explains it.
6. Sentences are short. Buttons are verbs: Download, Save, Skip tour, Restore.

## Glossary: words we use, and the plain word we avoid

| Avoid | Use | Where |
| --- | --- | --- |
| Snapshot, revision | Saved version | History tab, Save version button |
| Linter, action verb, STAR | Weak verbs, bullet checks | Health tab, status bar |
| XYZ impact, impact score | Missing numbers | Health tab |
| Markdown | Text version (advanced) | Editor, shortcuts |
| ATS | Applicant tracking software (first mention in full) | ATS readout |
| Tailor | Make a copy for this job | Match tab |
| Requirement, evidence | What the job asks for, what your resume shows | Match tab |
| Command palette | Search and commands (Cmd+K) | Header |
| Bundle | Everything in one zip | Export menu |
| Canonical, taxonomy | Standard name | Skills data |
| Export | Download, Print | Header and menus |

## Where the copy lives

- Visible strings are written in the component that shows them. There is no string table, so search the `src/components` folder before changing a word.
- Tests find elements by these words. When you change a label, update the matching e2e test in `tests/e2e`. A failing test that names an old label is expected.

## Review checklist for a change to copy

- [ ] Read it aloud. Does it sound like something a person would say?
- [ ] Is there one word for this thing across the app (search for the old word)?
- [ ] Is it short enough to fit on a phone at 360px without wrapping badly?
- [ ] Does any jargon remain that a first-time user will not know? If so, explain it in the same line.
