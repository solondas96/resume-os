// Regenerates the binary test fixtures from their sources.
// Run: node tests/fixtures/build-fixtures.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'resumes');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(readFileSync(join(dir, 'maya-chen.src.html'), 'utf8'));
await page.pdf({ path: join(dir, 'maya-chen.pdf'), format: 'A4', printBackground: true });
await browser.close();

// DOCX via python-docx, from the same content
execFileSync('python3', ['-c', `
import docx, sys
d = docx.Document()
d.add_heading('Maya Chen', level=1)
d.add_paragraph('maya.chen@example.com · +1 (415) 555-0134 · Lisbon, Portugal')
d.add_heading('Summary', level=2)
d.add_paragraph('Software engineer with 8 years building reliable backend platforms and developer tooling.')
d.add_heading('Experience', level=2)
d.add_paragraph('Senior Software Engineer — Acme Corp (2019 – Present)')
d.add_paragraph('Led migration of 40 services to Kubernetes, cutting deploy time by 60%', style='List Bullet')
d.add_paragraph('Mentored 5 engineers across 3 teams', style='List Bullet')
d.add_paragraph('Software Engineer — Globex (2016 – 2019)')
d.add_paragraph('Built a billing pipeline processing 2M events per day', style='List Bullet')
d.add_heading('Education', level=2)
d.add_paragraph('BSc Computer Science — State University (2012 – 2016)')
d.add_heading('Skills', level=2)
d.add_paragraph('TypeScript, React, Kubernetes, PostgreSQL, Terraform')
d.save(sys.argv[1])
`, join(dir, 'maya-chen.docx')]);
console.log('fixtures written');
