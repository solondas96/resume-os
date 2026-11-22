// Renders the corpus to PDF with Chromium and writes the expected JSON for each resume.
// Run: node tests/fixtures/corpus/build-corpus.mjs
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORPUS } from './spec.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pdfDir = join(here, 'pdf');
const expDir = join(here, 'expected');
mkdirSync(pdfDir, { recursive: true });
mkdirSync(expDir, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function bulletPrefix(style, i) {
  if (style === 'numbered') return `${i + 1}. `;
  return `${style} `;
}

function entryHeader(e, style) {
  const role = e.role;
  const company = e.company;
  if (style === 'role-company') return `${role}, ${company}`;
  return `${company} — ${role}`;
}

function bodyHtml(spec) {
  const H = (t) => {
    if (spec.heading === 'caps') return `<h2>${esc(t.toUpperCase())}</h2>`;
    if (spec.heading === 'rule') return `<h2 class="rule">${esc(t)}</h2>`;
    return `<h2 class="title">${esc(t)}</h2>`;
  };
  const bullets = (list) =>
    list.map((b, i) => `<p class="b">${esc(bulletPrefix(spec.bullet, i))}${esc(b)}</p>`).join('');
  const exp = spec.experience
    .map((e) => {
      const dates = `${e.start} – ${e.end}`;
      if (spec.layout === 'table') {
        return `<tr><td class="hd"><b>${esc(entryHeader(e, spec.headerStyle))}</b></td><td class="dt">${esc(dates)}</td></tr><tr><td colspan="2">${bullets(e.bullets)}</td></tr>`;
      }
      return `<div class="entry"><p class="eh"><b>${esc(entryHeader(e, spec.headerStyle))}</b><span class="dt">${esc(dates)}</span></p>${bullets(e.bullets)}</div>`;
    })
    .join('');
  const expBlock = spec.layout === 'table'
    ? `${H('Experience')}<table class="t">${exp}</table>`
    : `${H('Experience')}${exp}`;
  const edu = spec.education
    .map((e) => `<div class="entry"><p class="eh"><b>${esc(e.school)}</b></p><p>${esc(e.degree)} <span class="dt">${esc(`${e.start} – ${e.end}`)}</span></p></div>`)
    .join('');
  const skills = Object.entries(spec.skills)
    .map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(v.join(', '))}</p>`)
    .join('');
  const projects = (spec.projects ?? [])
    .map((p) => `<div class="entry"><p class="eh"><b>${esc(p.title)}</b><span class="dt">${esc(p.start)}</span></p><p>${esc(p.description)}</p></div>`)
    .join('');
  const certs = spec.certifications ? spec.certifications.map((c) => `<p class="b">• ${esc(c)}</p>`).join('') : '';

  const summary = `${H('Summary')}<p>${esc(spec.summary)}</p>`;
  const eduBlock = `${H('Education')}${edu}`;
  const skillsBlock = `${H('Skills')}${skills}`;
  const projBlock = projects ? `${H('Projects')}${projects}` : '';
  const certBlock = certs ? `${H('Certifications')}${certs}` : '';

  const header = `<h1>${esc(spec.name)}</h1><p class="sub">${esc(spec.headline)}</p><p class="contact">${esc(spec.email)} · ${esc(spec.phone)} · ${esc(spec.location)}</p>`;

  if (spec.layout === 'twocol') {
    return `${header}<div class="cols"><div class="main">${summary}${expBlock}${projBlock}</div><div class="side">${eduBlock}${skillsBlock}${certBlock}</div></div>`;
  }
  if (spec.layout === 'sidebar') {
    return `<div class="sbar"><h1>${esc(spec.name)}</h1><p class="sub">${esc(spec.headline)}</p><p>${esc(spec.email)}</p><p>${esc(spec.phone)}</p><p>${esc(spec.location)}</p>${skillsBlock}</div><div class="main2">${summary}${expBlock}${eduBlock}${projBlock}${certBlock}</div>`;
  }
  return `${header}${summary}${expBlock}${eduBlock}${projBlock}${skillsBlock}${certBlock}`;
}

const CSS = `
@page { size: A4; margin: 16mm; }
body { font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #111; margin: 0; }
h1 { font-size: 22pt; margin: 0 0 1mm; } .sub { margin: 0 0 1mm; color: #333; } .contact { margin: 0 0 3mm; color: #333; }
h2 { font-size: 12pt; margin: 4mm 0 1.5mm; }
h2.title { font-size: 13pt; } h2.rule { border-bottom: 1px solid #888; padding-bottom: 1mm; }
p { margin: 0 0 1mm; line-height: 1.35; } p.b { padding-left: 4mm; text-indent: -4mm; margin: 0 0 0.6mm; }
.eh { display: flex; justify-content: space-between; margin: 2mm 0 0.5mm; }
.dt { color: #444; white-space: nowrap; }
.cols { display: grid; grid-template-columns: 62% 38%; column-gap: 8mm; }
.sbar { position: absolute; left: 0; top: 0; width: 60mm; }
.main2 { margin-left: 70mm; }
table.t { width: 100%; border-collapse: collapse; } td.hd { padding: 2mm 0 0.5mm; } td.dt { text-align: right; color: #444; padding: 2mm 0 0.5mm; white-space: nowrap; }
`;

const browser = await chromium.launch();
const page = await browser.newPage();

for (const spec of CORPUS) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${bodyHtml(spec)}</body></html>`;
  await page.setContent(html);
  await page.pdf({ path: join(pdfDir, `${spec.id}.pdf`), format: 'A4', printBackground: true });

  const expected = {
    id: spec.id,
    name: spec.name,
    email: spec.email,
    phone: spec.phone,
    sections: [
      'Summary', 'Experience', 'Education', 'Skills',
      ...(spec.projects ? ['Projects'] : []),
      ...(spec.certifications ? ['Certifications'] : []),
    ],
    experience: spec.experience.map((e) => ({ company: e.company, role: e.role, start: e.start, end: e.end, bullets: e.bullets })),
    education: spec.education.map((e) => ({ school: e.school, degree: e.degree, start: e.start, end: e.end })),
    skills: Object.values(spec.skills).flat(),
  };
  writeFileSync(join(expDir, `${spec.id}.json`), JSON.stringify(expected, null, 2));
}

await browser.close();
console.log(`wrote ${CORPUS.length} PDFs and expected JSON`);
