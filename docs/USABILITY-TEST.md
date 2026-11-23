# Usability test: 20 minutes, five people who are not developers

This script tests whether a person with no technical background can get from their own résumé to a downloaded PDF, and can use the job-match and tailoring tools, without help. Run it with five people. Use the made-up files in `docs/usability-kit/` for every task; never ask someone to use their real résumé during the test.

## Before the session (5 minutes of setup)

- Open the app on a laptop or a phone, in a private (incognito) window, so no earlier data is there.
- Put `docs/usability-kit/sample-resume.pdf` and `docs/usability-kit/job-description.txt` where the participant can reach them.
- Have a timer ready for each task, and a copy of the results table below.
- Tell the participant: "We are testing the app, not you. There are no wrong answers. Think out loud. You can stop at any time."
- Ask them to say what they expect a button to do before they press it. Note that, but do not explain.

## The script

Read the task aloud. Do not explain how to do it. If the participant asks for help, note the question and wait 60 seconds before you give a hint, then give only the smallest hint that moves them on.

| # | Task (say this) | Done when | Time target |
| --- | --- | --- | --- |
| 1 | "Use this file as your resume. Get it into the app and check it looks right." | A resume is created from `sample-resume.pdf`, and the name Sam Carter shows in the preview. | 2 min |
| 2 | "The app thinks this resume could be better. Find out what it says, and fix the three most important things." | The Health panel is opened, and at least one suggested fix is applied. | 4 min |
| 3 | "Here is a job. See how well your resume matches it, and what is missing." | The job description is pasted into Match, and the match score and at least one gap are read aloud. | 3 min |
| 4 | "Make a copy of your resume tailored for this job. Choose which changes to keep." | A tailored copy is made, one proposed change is accepted or rejected, and the choice is applied. | 4 min |
| 5 | "Save this as a PDF you could send to an employer." | Download PDF is used, and a file is saved to the device. | 1 min |

Total: 14 minutes of tasks, plus 5 minutes of questions and notes at the end, which makes 20.

## What to watch for

- **Hesitation over 30 seconds** on one screen. Note the screen and what the participant says.
- **Wrong panel.** Did they open Design when they meant Health? Note what they expected.
- **Words they do not understand.** Write down the exact word (for example "ATS", "tailor", "health") and where they saw it.
- **Asking "is this saved?"** It is saved in the browser; note whether they could tell.
- **Reading the same line twice.** Usually a sign the copy is unclear.
- **Ignoring the help.** Did they see the tour, the More menu, or the empty-state messages?

## Results table

Copy one row per task per participant.

| Participant (code) | Task | Time (seconds) | Success (yes / partly / no) | Where they got stuck (screen and words) | What they said |
| --- | --- | --- | --- | --- | --- |
| P1 | 1 | | | | |
| P1 | 2 | | | | |
| P1 | 3 | | | | |
| P1 | 4 | | | | |
| P1 | 5 | | | | |

Use a code for each participant (P1 to P5), not their name. Keep the notes on paper or in a file that is not in the repository.

## What counts as a pass

- **Success:** at least 4 of 5 participants complete each task ("yes"). "Partly" counts as half.
- **Time:** at least 4 of 5 finish each task within its time target, with a total under 20 minutes.
- **Any task below 4 of 5** becomes the first thing to fix. Write the fix down, with the screen and the words that caused it.

## Questions at the end (5 minutes)

1. What did you expect this app to do before you started?
2. Which word or button confused you most?
3. Would you trust the PDF to send to an employer? Why, or why not?
4. What would you change first?
5. Would you come back to it? When?

Thank the participant, and if they asked for it, delete the test resume from the browser: More, Inspector, History, then "Delete all my data" with `DELETE` typed.

## After the five sessions

1. Fill in the table for all five participants.
2. Count the successes and the times for each task, using the pass rules above.
3. List every stuck point, grouped by screen, with the words people used.
4. Put the list in a new issue on GitHub, labelled `usability`, one issue per screen that failed the pass rules.
5. Do not change the copy or the screens before you have the five results. Fix what the results show, not what you expected.

## Ethics

- Ask before you note anything about a person. Tell them what you will write down and that it is not shared with their name.
- Do not record video or audio unless they agree in writing.
- The made-up files contain invented people only. If a participant brings their own résumé, do not copy it, and do not store it.
