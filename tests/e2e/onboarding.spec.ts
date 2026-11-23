import { zipSync } from 'fflate';
import { test, expect, waitForApp, skipTour } from './helpers';

/** A minimal Word file with one stray line under the Experience heading (it has no entry yet) */
function strayDocx(): Buffer {
  const para = (t: string) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
  const body = [
    para('Jane Doe'),
    para('jane@example.com'),
    para('Experience'),
    para('A stray note that sits before the first entry'),
    para('Acme — Engineer'),
    para('Shipped the billing service'),
  ].join('');
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
  const enc = new TextEncoder();
  const zip = zipSync({
    '[Content_Types].xml': enc.encode('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': enc.encode('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': enc.encode(xml),
  });
  return Buffer.from(zip);
}

const upload = (page: import('@playwright/test').Page) =>
  page.locator('input[type=file]').first().setInputFiles({ name: 'jane.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: strayDocx() });

test('tour: shows after the first resume, Skip dismisses it, and Help replays it', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await upload(page);
  await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Create resume' }).click();

  const dialog = page.getByRole('dialog', { name: 'Your resume is on the left' });
  await expect(dialog).toBeVisible();
  await expect(page.getByText('Step 1 of 4')).toBeVisible();

  // Non-modal: the editor stays usable while the tour is open
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Step 2 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Replay from Help
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: 'Keyboard shortcuts and help' }).click();
  await page.getByRole('button', { name: 'Take the tour again' }).click();
  await expect(page.getByRole('dialog', { name: 'Your resume is on the left' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('drag-out: an unsorted line dragged onto a section moves there and leaves the Unsorted list', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await upload(page);
  const unsorted = page.getByRole('region', { name: 'Unsorted lines' });
  await expect(unsorted).toBeVisible({ timeout: 20_000 });
  await expect(unsorted).toContainText('A stray note');

  const handle = page.getByRole('button', { name: 'Drag this line onto a section, or use the menu' }).first();
  const target = page.locator('ul[aria-label="Sections"] li', { hasText: 'Experience' });
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('drag handle or section not on screen');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();

  // The dropped line is no longer unsorted, and it lands under Experience in the created resume
  await expect(page.getByRole('region', { name: 'Unsorted lines' })).not.toContainText('A stray note');
  // dnd-kit keeps its pointer state for a moment after the drop; the click is ignored until it settles
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Create resume' }).click();
  await skipTour(page);
  await expect(page.locator('.a4-sheet')).toContainText('A stray note that sits before the first entry');
});

test('empty states: a blank resume says what to add next, and the health panel explains itself', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('heading', { name: 'Start blank' }).click();
  await expect(page.getByText('No sections yet. Add one below, such as Experience or Education.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /Health\s*\d+/ }).click();
  await expect(page.getByRole('region', { name: 'Resume health' })).toBeVisible();
});
