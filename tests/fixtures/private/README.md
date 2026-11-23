# Private fixtures: your own résumé

Use this folder to check the importer on your own résumé. Everything in this folder is **git-ignored** except this README, so the file never reaches GitHub.

## What to put here

```
tests/fixtures/private/
  pdf/<id>.pdf          your résumé, exported from the tool you use
  expected/<id>.json    what the importer should find, written by hand
```

Use any `<id>` (for example `my-cv`). The expected file has the same shape as the files in `tests/fixtures/real/expected/`:

```json
{
  "id": "my-cv",
  "kind": "text",
  "name": "Your Name",
  "email": "you@example.com",
  "phone": "+44 7700 900123",
  "sections": ["Experience", "Education", "Skills"],
  "experience": [
    {
      "company": "Company A",
      "role": "Job title",
      "start": "Jan 2019",
      "end": "Present",
      "bullets": ["The first bullet, as it reads in the file"]
    }
  ],
  "education": [{ "school": "University", "degree": "Degree", "start": "2012", "end": "2016" }],
  "skills": ["Skill one", "Skill two"]
}
```

Write the dates the way the file shows them. The scorer converts them to a canonical form, so it does not depend on the date parser.

## How to run only this test

```sh
npx vitest run tests/fixtures/private.test.ts
```

The test skips when there is no `expected/` file, so the suite stays green on a clean checkout. A personal résumé should score at least 80% overall. If it does not, the report shows which field is weak.

## Privacy

- Do not paste the file's contents into an issue, a commit message or a chat.
- Do not rename these files to a name that identifies you in the repository. The folder stays on your machine.
