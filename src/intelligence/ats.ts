/**
 * ATS preview: what an applicant tracking system would read from this resume.
 * Built from the model (the same source the PDF is rendered from), in reading order.
 */

import { Resume, Section, sectionItems } from '../model/resume';

export interface AtsProblem {
  rule: string;
  message: string;
  why: string;
}

export interface AtsPreview {
  lines: string[];
  text: string;
  detectedSections: string[];
  contact: { email?: string; phone?: string; location?: string };
  problems: AtsProblem[];
}

const STANDARD_HEADINGS = ['experience', 'education', 'skills', 'projects', 'certifications', 'summary'];
const SYMBOL_RE = /[☀-➿\u{1F300}-\u{1FAFF}]/u;

function sectionLines(section: Section): string[] {
  const out: string[] = [section.title.toUpperCase()];
  switch (section.kind) {
    case 'summary':
      return [...out, ...section.paragraphs];
    case 'skills':
      for (const g of section.groups) out.push(g.label ? `${g.label}: ${g.skills.join(', ')}` : g.skills.join(', '));
      return out;
    case 'custom':
    case 'certifications':
      return [...out, ...section.lines.filter((l) => l.kind !== 'pagebreak').map((l) => l.text)];
    default:
      break;
  }
  for (const item of sectionItems(section) as any[]) {
    if ('company' in item) {
      const end = item.end === 'present' ? 'Present' : item.end ? String(item.end.year) : '';
      out.push(`${item.role} | ${item.company} | ${item.start?.year ?? ''} - ${end}`);
    } else if ('school' in item) {
      out.push(`${item.degree ?? ''} | ${item.school}`);
    } else {
      out.push(item.title ?? '');
    }
    for (const b of item.bullets ?? []) out.push(`- ${b.text}`);
  }
  return out;
}

export function buildAtsPreview(resume: Resume): AtsPreview {
  const { basics } = resume;
  const contact = [basics.email, basics.phone, basics.location].filter(Boolean).join(' | ');
  const lines: string[] = [basics.name];
  if (basics.headline) lines.push(basics.headline);
  if (contact) lines.push(contact);

  const visible = resume.sections.filter((s) => !s.hidden);
  for (const s of visible) lines.push(...sectionLines(s));

  const problems: AtsProblem[] = [];
  if (!basics.email) {
    problems.push({ rule: 'ats.no-email', message: 'No email address found', why: 'Recruiters and ATS use the email to identify and contact the candidate.' });
  }
  if (!basics.phone) {
    problems.push({ rule: 'ats.no-phone', message: 'No phone number found', why: 'Many ATS extract the phone from the header as a contact field.' });
  }
  for (const s of visible) {
    if (s.kind === 'custom' && !STANDARD_HEADINGS.includes(s.title.toLowerCase())) {
      problems.push({
        rule: 'ats.nonstandard-heading',
        message: `"${s.title}" may not be recognised as a section`,
        why: 'Standard headings (Experience, Education, Skills) are the ones parsers map reliably.',
      });
    }
    const empty =
      s.kind === 'skills' ? s.groups.length === 0 : s.kind === 'summary' ? s.paragraphs.length === 0 : s.kind === 'custom' || s.kind === 'certifications' ? s.lines.length === 0 : sectionItems(s).length === 0;
    if (empty) {
      problems.push({ rule: 'ats.empty-section', message: `"${s.title}" has no content`, why: 'An empty heading adds nothing for the parser or the reader.' });
    }
  }
  if (SYMBOL_RE.test(lines.join('\n'))) {
    problems.push({
      rule: 'ats.symbol-glyphs',
      message: 'Icons or symbols in the text may not extract cleanly',
      why: 'Symbol characters are often dropped or garbled by parsers. Plain text is safer.',
    });
  }
  if (visible.length === 0) {
    problems.push({ rule: 'ats.no-sections', message: 'No visible sections', why: 'With no headings the parser cannot tell where experience and skills begin.' });
  }

  return {
    lines,
    text: lines.join('\n'),
    detectedSections: visible.map((s) => s.title),
    contact: { email: basics.email || undefined, phone: basics.phone || undefined, location: basics.location || undefined },
    problems,
  };
}
