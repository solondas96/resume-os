import { describe, it, expect } from 'vitest';
import { htmlToLines } from './docxHtml';

describe('htmlToLines', () => {
  it('positive: list items become bullets, headings are larger and bold', () => {
    const lines = htmlToLines('<h2>Experience</h2><p>Senior Engineer — Acme</p><ul><li>Led migration</li><li>Mentored 5 engineers</li></ul>');
    expect(lines.map((l) => l.text)).toEqual(['Experience', 'Senior Engineer — Acme', '• Led migration', '• Mentored 5 engineers']);
    expect(lines[0].bold).toBe(true);
    expect(lines[0].size).toBeGreaterThan(lines[1].size);
  });

  it('a fully bold paragraph is marked bold; a paragraph with some bold text is not', () => {
    const lines = htmlToLines('<p><strong>Acme Corp</strong></p><p>Engineer at <strong>Acme</strong> Corp</p>');
    expect(lines[0].bold).toBe(true);
    expect(lines[1].bold).toBe(false);
  });

  it('decodes entities and drops empty blocks', () => {
    const lines = htmlToLines('<p>Q&amp;A &lt;tools&gt;</p><p> </p>');
    expect(lines.map((l) => l.text)).toEqual(['Q&A <tools>']);
  });
});
