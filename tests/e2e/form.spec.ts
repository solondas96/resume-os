import { test, expect, waitForApp } from './helpers';

test.describe('form editor', () => {
  test('build a resume from blank with the form only, reorder bullets by keyboard, and export', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('heading', { name: 'Start blank' }).click();

    // Form is the default view
    await expect(page.getByTestId('form-editor')).toBeVisible();

    await page.getByLabel('Full name').fill('Test Person');

    // Add an experience section and one role
    await page.getByRole('button', { name: 'Add section' }).click();
    const section = page.getByRole('region', { name: 'Section Experience' });
    await section.getByRole('button', { name: 'Add role' }).click();
    await section.getByLabel('Company').fill('Acme');
    await section.getByLabel('Role').fill('Engineer');

    // Three bullets, typed in order
    for (const text of ['First bullet', 'Second bullet', 'Third bullet']) {
      await section.getByRole('button', { name: 'Add bullet' }).click();
      await section.getByLabel('Bullet text').last().fill(text);
    }

    // Move the third bullet to the top with the keyboard only:
    // focus its drag handle, Space to pick up, Up twice, Space to drop
    // dnd-kit updates its drop target after each key, announced in a live region;
    // wait for each announcement before the next key so no move is lost
    const announcement = page.locator('[aria-live]').filter({ hasText: 'moved over' }).first();
    const handle = section.getByRole('button', { name: 'Reorder bullet 3' });
    await handle.focus();
    await page.keyboard.press('Space');
    await expect(announcement).toContainText('moved over', { timeout: 5_000 });
    await page.keyboard.press('ArrowUp');
    await expect(announcement).toContainText('moved over', { timeout: 5_000 });
    await page.waitForFunction(() => document.querySelectorAll('[aria-live]').length > 0);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
    await page.keyboard.press('Space');

    const texts = await section.getByLabel('Bullet text').evaluateAll((els) =>
      els.map((el) => (el as HTMLTextAreaElement).value)
    );
    expect(texts).toEqual(['Third bullet', 'First bullet', 'Second bullet']);

    // Preview follows the model, in the new order
    const preview = page.locator('.a4-sheet');
    await expect(preview).toContainText('Test Person');
    const html = await preview.innerText();
    expect(html.indexOf('Third bullet')).toBeLessThan(html.indexOf('First bullet'));

    // Export: one printable sheet, no app chrome
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.a4-sheet')).toHaveCount(1);
    const visibleChrome = await page.locator('.no-print').evaluateAll((els) =>
      els.filter((el) => getComputedStyle(el).display !== 'none').length
    );
    expect(visibleChrome).toBe(0);
  });

  test('the Markdown view is available as an advanced option and shows the same content', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('heading', { name: 'Start blank' }).click();
    await page.getByLabel('Full name').fill('Advanced Person');
    await page.getByRole('button', { name: 'Advanced: Markdown' }).click();
    await expect(page.locator('.cm-content').first()).toContainText('# Advanced Person');
  });
});
