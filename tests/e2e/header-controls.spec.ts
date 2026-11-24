import { test, expect, waitForApp, skipTour } from './helpers';

/**
 * The header is the most crowded part of the screen. The budget is four controls at 1440 px.
 * Today it has more, so the test is marked as an expected failure (see docs/PLAN.md §10): it
 * still runs, and it names every control with what it is for, so the next move is clear.
 * When the header is slimmed to four, the expected failure turns into a failure: remove the
 * `test.fail` line then.
 */
const BUDGET = 4;

/** What each header control is for, matched on its title, label or text */
const WHY: [RegExp, string][] = [
  [/Resume Library/i, 'opens the resume library, and shows the name of the current resume'],
  [/^Resume$/i, 'switches the editor to the resume'],
  [/^Cover Letter$/i, 'switches the editor to the cover letter'],
  [/Inspector/i, 'opens the inspector: health, job match, design and saved versions'],
  [/Search and commands|Cmd\+K/i, 'opens search and commands (keyboard: Cmd+K or Ctrl+K)'],
  [/^More|More:/i, 'opens the menu: templates, library, share, import and help'],
  [/Download PDF/i, 'downloads the resume as a PDF (the main action)'],
  [/Export/i, 'opens the export menu: bundle, text, Markdown, print and backup'],
];

test('the header holds at most four controls at 1440 px', async ({ page }, testInfo) => {
  test.fail(true, 'Known: the header has more than four controls at 1440 px. See the annotation for each one.');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('heading', { name: 'Start from a role' }).click();
  await page.getByRole('heading', { name: 'Staff Software Engineer' }).click();
  await expect(page.locator('.a4-sheet').first()).toBeVisible({ timeout: 15_000 });
  await skipTour(page);

  // The app header is the one marked no-print (section headers inside the editor are <header> too)
  const names = await page.$$eval('header.no-print button, header.no-print a[href], header.no-print input, header.no-print select', (els) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .map((e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').replace(/\s+/g, ' ').trim())
  );
  const explained = names.map((name) => {
    const why = WHY.find(([pattern]) => pattern.test(name))?.[1] ?? 'no explanation on file';
    return `${name || '(no name)'} — ${why}`;
  });
  testInfo.annotations.push({ type: 'header-controls', description: `${names.length} controls\n${explained.join('\n')}` });
  console.log(`Header controls at 1440 px: ${names.length} (budget ${BUDGET})\n${explained.join('\n')}`);

  expect(names.length, `header controls over the budget of ${BUDGET}:\n${explained.join('\n')}`).toBeLessThanOrEqual(BUDGET);
});
