/**
 * The LinkedIn ZIP goes through the same review as a PDF: the name, sections and the create button.
 * The ZIP is made here with LinkedIn's column names (made-up people).
 */
import { zipSync, strToU8 } from 'fflate';
import { test, expect, waitForApp } from './helpers';

const zip = zipSync({
  'Profile.csv': strToU8('First Name,Last Name,Headline,Summary,Geo Location\nZoë,Müller,Data engineer,Builds data tools.,Berlin\n'),
  'Positions.csv': strToU8('Company Name,Title,Description,Location,Started On,Finished On\nNorthwind Data,Senior Data Engineer,"• Built a nightly pipeline\n• Mentored four engineers",Berlin,Mar 2020,\n'),
  'Skills.csv': strToU8('Name\nPython\nSQL\n'),
});

test('LinkedIn ZIP: the review shows the name and the positions, and the resume is created', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'linkedin-export.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) });
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('list', { name: 'Sections' })).toContainText('Work Experience');
  await page.getByRole('button', { name: 'Create resume' }).click();
  await expect(page.locator('.a4-sheet')).toContainText('Zoë Müller');
  await expect(page.locator('.a4-sheet')).toContainText('Northwind Data');
});
