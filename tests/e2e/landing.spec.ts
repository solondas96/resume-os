import { test, expect, waitForApp } from './helpers';

test('the welcome screen says what it does in three points, and Start moves to the options', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  const intro = page.getByRole('region', { name: 'What ResumeLabs does' });
  await expect(intro).toBeVisible();
  await expect(intro.getByRole('listitem')).toHaveCount(3);
  await expect(intro).toContainText('Your resumes stay in this browser');
  await intro.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Upload my resume' })).toBeInViewport({ timeout: 5_000 });
});
