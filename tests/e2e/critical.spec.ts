import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, seedLocalStorage, waitForApp } from './helpers';
import { encodeResumeForShare } from '../../src/utils/shareResume';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes');
const PDF = path.join(FIXTURES, 'maya-chen.pdf');
const DOCX = path.join(FIXTURES, 'maya-chen.docx');

const SAMPLE_JD = `About the role
Required:
- Experience with Kubernetes and Terraform in production
Nice to have:
- Experience with Haskell`;

test.describe('first run', () => {
  test('welcome screen shows three paths; start from a role opens the presets and the preview renders', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await expect(page.getByRole('heading', { name: 'Upload my resume' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Start from a role' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Start blank' })).toBeVisible();
    await expect(page.getByText('Everything stays private. Nothing leaves your browser.')).toBeVisible();

    await page.getByRole('heading', { name: 'Start from a role' }).click();
    await page.getByRole('heading', { name: 'Staff Software Engineer' }).click();
    await expect(page.locator('.a4-sheet').first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('import', () => {
  test('PDF fixture: review screen lists sections, create resume, preview shows name and Experience', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.locator('input[type=file]').first().setInputFiles(PDF);

    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Maya Chen', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('list', { name: 'Sections' })).toContainText('Experience');

    await page.getByRole('button', { name: 'Create resume' }).click();
    await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');
    await expect(page.locator('.a4-sheet')).toContainText('Experience');
  });

  test('DOCX fixture imports the same way', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.locator('input[type=file]').first().setInputFiles(DOCX);
    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Create resume' }).click();
    await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');
    await expect(page.locator('.a4-sheet')).toContainText('Experience');
  });
});

test.describe('editor, health and match', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.locator('input[type=file]').first().setInputFiles(DOCX);
    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Create resume' }).click();
    await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');
  });

  test('health badge shows a score; the inspector lists findings with a why', async ({ page }) => {
    const badge = page.getByRole('button', { name: /Health\s*\d+/ });
    await expect(badge).toBeVisible();
    await badge.click();
    await expect(page.getByText('Resume health', { exact: true })).toBeVisible();
    await expect(page.getByText(/\/100/).first()).toBeVisible();
  });

  test('job match: pasted posting shows must-have and nice-to-have requirements with strength', async ({ page }) => {
    await page.getByRole('button', { name: 'Job Match' }).first().click();
    await page.getByPlaceholder(/Paste the posting/).fill(SAMPLE_JD);
    await expect(page.getByText('Required', { exact: true })).toBeVisible();
    await expect(page.getByText('Nice to have', { exact: true })).toBeVisible();
    await expect(page.locator('li', { hasText: 'Experience with Kubernetes and Terraform' }).first()).toBeVisible();
    await expect(page.locator('li').getByText(/^(strong|moderate|weak|missing)$/).first()).toBeVisible();
  });

  test('inspector tools render: ATS preview, seniority, bullet builder', async ({ page }) => {
    await page.getByRole('button', { name: /Health\s*\d+/ }).click();
    await expect(page.getByText('What applicant tracking software sees')).toBeVisible();
    await expect(page.getByText('Plain text in reading order')).toBeVisible();
    await expect(page.getByText('Seniority', { exact: true })).toBeVisible();
    await expect(page.getByText('Reads as:')).toBeVisible();
    await expect(page.getByText('Bullet builder')).toBeVisible();
    await page.getByLabel('What did you do?').fill('the billing pipeline');
    await expect(page.getByText(/Improved the billing pipeline\./)).toBeVisible();
  });
});

test.describe('export', () => {
  test('print render has one A4 sheet and hides chrome', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.locator('input[type=file]').first().setInputFiles(DOCX);
    await page.getByRole('button', { name: 'Create resume' }).click();
    await expect(page.locator('.a4-sheet')).toContainText('Maya Chen');

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.a4-sheet')).toHaveCount(1);
    const visibleChrome = await page.locator('.no-print').evaluateAll((els) =>
      els.filter((el) => getComputedStyle(el).display !== 'none').length
    );
    expect(visibleChrome).toBe(0);
  });
});

test.describe('share link', () => {
  test('#view= link with an onerror payload renders the resume and runs no script', async ({ page }) => {
    const code = encodeResumeForShare({
      title: 'Shared',
      markdown: '# Jane Shared\n\n<img src="x" onerror="window.__xss=1">\n\n## Experience\n### Acme — Engineer\n- Built things\n',
      theme: 'modern',
      accentColor: '#c96442',
      fontSize: 'medium',
      marginSize: 'normal',
      lineHeight: 'normal',
    });
    await page.goto(`/#view=${code}`);
    await expect(page.getByText('Jane Shared')).toBeVisible({ timeout: 20_000 });
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
    expect(await page.locator('img[onerror]').count()).toBe(0);
  });
});

test.describe('migration', () => {
  const v1Profiles = JSON.stringify([
    {
      id: 'legacy-1',
      title: 'Legacy Person',
      markdown: '# Legacy Person\nlegacy@example.com\n\n## Experience\n### Acme — Engineer\n- Did things\n',
      theme: 'modern',
      accentColor: '#c96442',
      fontSize: 'medium',
      marginSize: 'normal',
      lineHeight: 'normal',
      updatedAt: 1700000000000,
    },
  ]);

  test('v1 localStorage data is migrated and visible; reloading creates no duplicates', async ({ page }) => {
    await seedLocalStorage(page, { resumeos_profiles_v1: v1Profiles });
    await page.goto('/');
    await waitForApp(page);
    await expect(page.locator('.a4-sheet')).toContainText('Legacy Person', { timeout: 20_000 });

    const count = async () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const req = indexedDB.open('resumelabs');
            req.onsuccess = () => {
              const tx = req.result.transaction('resumes', 'readonly');
              const c = tx.objectStore('resumes').count();
              c.onsuccess = () => resolve(c.result);
            };
            req.onerror = () => resolve(-1);
          })
      );
    expect(await count()).toBe(1);

    await page.reload();
    await waitForApp(page);
    await expect(page.locator('.a4-sheet')).toContainText('Legacy Person', { timeout: 20_000 });
    expect(await count()).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('resumeos_v1_migrated'))).toBe('true');
  });
});

test.describe('corpus import', () => {
  test('a multi-column corpus PDF imports with its entries in the preview', async ({ page }) => {
    const CORPUS_PDF = path.join(FIXTURES, '..', 'corpus', 'pdf', 'sales-table.pdf');
    await page.goto('/');
    await waitForApp(page);
    await page.locator('input[type=file]').first().setInputFiles(CORPUS_PDF);
    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('list', { name: 'Sections' })).toContainText('Experience');
    await page.getByRole('button', { name: 'Create resume' }).click();
    await expect(page.locator('.a4-sheet')).toContainText('Summit Software');
    await expect(page.locator('.a4-sheet')).toContainText('Sales Manager');
  });
});
