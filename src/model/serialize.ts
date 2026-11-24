/**
 * Markdown <-> Resume model.
 *
 * markdownToResume parses the supported dialect into typed fields. Anything it
 * cannot place is kept in a custom section (under "Other" when it has no heading
 * of its own), so no content is dropped. resumeToMarkdown renders the model back.
 *
 * Supported dialect:
 *   # Name, a headline line, contact lines (icon links or plain email/phone)
 *   ::: left / ::: right header and skills columns
 *   [icon:name label](url) links
 *   ## Section headings; ### entries; *meta | meta* lines; `tag` pill lines
 *   - bullets; - **Label:** skills; page breaks
 */

import {
  Resume,
  Section,
  Line,
  Bullet,
  ContactLink,
  YearMonth,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillGroup,
  createResume,
} from './resume';

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
const ICON_LINK_RE = /^\[icon:([a-zA-Z0-9_-]+)\s*([^\]]*)\]\(([^)]*)\)$/;
const PLAIN_LINK_RE = /^\[([^\]]+)\]\(([^)]*)\)$/;
const PAGE_BREAK_RE = /^(?::{3,}\s*page-?break|<!--\s*page-?break\s*-->|---\s*page-?break\s*---)$/i;
const PILLS_RE = /^(`[^`]+`\s*)+$/;

const SECTION_KIND: Record<string, Section['kind']> = {
  summary: 'summary',
  'professional summary': 'summary',
  'executive summary': 'summary',
  'executive profile': 'summary',
  profile: 'summary',
  experience: 'experience',
  'work experience': 'experience',
  'professional experience': 'experience',
  'leadership experience': 'experience',
  employment: 'experience',
  'work history': 'experience',
  education: 'education',
  projects: 'projects',
  'key projects': 'projects',
  'notable projects': 'projects',
  skills: 'skills',
  'technical skills': 'skills',
  'technical competencies': 'skills',
  'core competencies': 'skills',
  certifications: 'certifications',
  licenses: 'certifications',
  licences: 'certifications',
};

/** Section kind for a heading, using the alias table, then a keyword fallback */
function kindForHeading(title: string): Section['kind'] {
  const key = title.toLowerCase().trim();
  if (SECTION_KIND[key]) return SECTION_KIND[key];
  if (/skill|competenc/.test(key)) return 'skills';
  if (/certif|licen[cs]e/.test(key)) return 'certifications';
  if (/project/.test(key)) return 'projects';
  if (/experience|employment/.test(key)) return 'experience';
  if (/education/.test(key)) return 'education';
  if (/summary|profile/.test(key)) return 'summary';
  return 'custom';
}

// ---- dates ----------------------------------------------------------------

export function parseDate(text: string): YearMonth | 'present' | null {
  const t = text.trim();
  if (/^(present|now|current|to date)$/i.test(t)) return 'present';
  // Day-first dates (UK, EU, India): DD/MM/YYYY or DD.MM.YYYY. The day is ignored; only the month is kept.
  const full = t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.]((?:19|20)\d{2})$/);
  if (full) {
    const a = parseInt(full[1], 10);
    const b = parseInt(full[2], 10);
    // If one part cannot be a month, the other is the month. If both can, read DD/MM (the day comes first).
    const month = a > 12 ? b : b > 12 ? a : b;
    if (month >= 1 && month <= 12 && (a <= 31 && b <= 31)) return { year: parseInt(full[3], 10), month };
    return null;
  }
  const numeric = t.match(/^(\d{1,2})\/((?:19|20)\d{2})$/);
  if (numeric && parseInt(numeric[1], 10) >= 1 && parseInt(numeric[1], 10) <= 12) {
    return { year: parseInt(numeric[2], 10), month: parseInt(numeric[1], 10) };
  }
  const season = t.match(/^(spring|summer|fall|autumn|winter)\s+((?:19|20)\d{2})$/i);
  if (season) {
    const name = season[1].toLowerCase() === 'autumn' ? 'Fall' : season[1][0].toUpperCase() + season[1].slice(1).toLowerCase();
    return { year: parseInt(season[2], 10), season: name as YearMonth['season'] };
  }
  const m = t.match(/^(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?((?:19|20)\d{2})$/i);
  if (!m) return null;
  const year = parseInt(m[2], 10);
  if (!m[1]) return { year };
  return { year, month: MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase().slice(0, 3)) + 1 };
}

/** "2019 – Present", "May 2024", "2016 - 2019" -> start / end; null if not a date */
export function parseDateRange(text: string): { start?: YearMonth; end?: YearMonth | 'present' } | null {
  // "2020 to date" is a start date that runs to the present
  const ongoing = text.match(/^(.+?)\s+to\s+date$/i);
  if (ongoing) {
    // "Mar 2017 – 2020 to date": the range starts at its first date and runs on
    const from = ongoing[1].split(/\s*(?:–|—| - )\s*/)[0];
    const start = parseDate(from);
    return start && start !== 'present' ? { start, end: 'present' } : null;
  }
  const parts = text.split(/\s*(?:–|—| - | to )\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return null;
  const start = parseDate(parts[0]);
  if (!start || start === 'present') return null;
  if (parts.length === 1) return { start };
  const end = parseDate(parts[1]);
  if (!end) return null;
  return { start, end };
}

function formatDate(d: YearMonth): string {
  if (d.season) return `${d.season} ${d.year}`;
  return d.month ? `${MONTHS[d.month - 1]} ${d.year}` : `${d.year}`;
}

/** Canonical text for a date range, e.g. "May 2019 – Present" (parses back to the same range) */
export function formatRange(start?: YearMonth, end?: YearMonth | 'present'): string {
  if (!start && !end) return '';
  const s = start ? formatDate(start) : '';
  const e = end === 'present' ? 'Present' : end ? formatDate(end) : '';
  return e ? `${s} – ${e}` : s;
}

// ---- contact / header -----------------------------------------------------

function isPhone(part: string): boolean {
  return /^\+?[\d()\s.-]+$/.test(part) && (part.match(/\d/g) || []).length >= 7;
}

function parseLink(raw: string): { icon?: string; label: string; url: string } | null {
  const icon = raw.match(ICON_LINK_RE);
  if (icon) return { icon: icon[1], label: icon[2].trim(), url: icon[3] };
  const plain = raw.match(PLAIN_LINK_RE);
  if (plain) return { label: plain[1], url: plain[2] };
  return null;
}

function linkMarkdown(l: { icon?: string; label: string; url: string }): string {
  return l.icon ? `[icon:${l.icon} ${l.label}](${l.url})` : `[${l.label}](${l.url})`;
}

/** Icon names that map to a contact field instead of a link */
const CONTACT_ICONS = new Set(['email', 'phone', 'location']);

// ---- parsing --------------------------------------------------------------

export function markdownToResume(markdown: string, title: string = 'Untitled'): Resume {
  const resume = createResume(title);
  if (!markdown || !markdown.trim()) return resume;

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;

  // Name: first non-blank line, if it is a level-1 heading
  while (i < lines.length && !lines[i].trim()) i++;
  if (lines[i] && /^#\s+/.test(lines[i])) {
    resume.basics.name = lines[i].replace(/^#\s+/, '').trim();
    i++;
  }

  // Header: everything before the first "## " heading
  const header: string[] = [];
  while (i < lines.length && !lines[i].startsWith('## ')) header.push(lines[i++]);
  const headerOther = parseHeader(header, resume);

  // Sections
  const parsedSections: Section[] = [];
  const otherLines: Line[] = [...headerOther];
  while (i < lines.length) {
    const heading = lines[i];
    if (!heading.startsWith('## ')) {
      // Text between sections without a heading
      if (heading.trim()) otherLines.push(makeLine(heading));
      i++;
      continue;
    }
    const sectionTitle = heading.replace(/^##\s+/, '').trim();
    i++;
    const body: string[] = [];
    while (i < lines.length && !lines[i].startsWith('## ')) body.push(lines[i++]);

    const { section, leftovers } = parseSection(sectionTitle, kindForHeading(sectionTitle), body);
    parsedSections.push(section);
    if (leftovers.length > 0) {
      // Unplaced lines from a known section keep their content in an "Other" section right after it
      parsedSections.push({ id: generateId(), kind: 'custom', title: 'Other', lines: leftovers });
    }
  }

  if (otherLines.length > 0) {
    parsedSections.unshift({ id: generateId(), kind: 'custom', title: 'Other', lines: otherLines });
  }
  resume.sections = parsedSections;
  return resume;
}

function makeLine(raw: string): Line {
  const trimmed = raw.trim();
  if (PAGE_BREAK_RE.test(trimmed)) return { id: generateId(), kind: 'pagebreak', text: '' };
  if (/^[-*]\s+/.test(trimmed)) return { id: generateId(), kind: 'bullet', text: trimmed.replace(/^[-*]\s+/, '') };
  return { id: generateId(), kind: 'text', text: trimmed };
}

/**
 * Parse header lines into basics. Returns header lines that were not placed.
 */
function parseHeader(lines: string[], resume: Resume): Line[] {
  const leftovers: Line[] = [];
  let column: 'left' | 'right' | undefined;
  let sawColumns = false;
  let headlineSet = false;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const open = trimmed.match(/^:{3,}\s*(left|right)\s*$/i);
    if (open) {
      column = open[1].toLowerCase() as 'left' | 'right';
      sawColumns = true;
      continue;
    }
    if (/^:{3,}\s*$/.test(trimmed)) {
      column = undefined;
      continue;
    }

    const link = parseLink(trimmed);
    if (link) {
      if (link.icon && CONTACT_ICONS.has(link.icon)) {
        const value = link.label || link.url.replace(/^(mailto:|tel:)/, '');
        if (link.icon === 'email') resume.basics.email = value;
        if (link.icon === 'phone') resume.basics.phone = value;
        if (link.icon === 'location') resume.basics.location = value;
        continue;
      }
      resume.basics.links.push({
        id: generateId(),
        label: link.label,
        url: link.url,
        icon: link.icon,
        column,
      } as ContactLink);
      continue;
    }

    // Plain contact text: "email · phone · location" (or "email | phone | location", as PDF and Word
    // exports write it). Split on either separator only when the line has an email or a phone,
    // so a headline such as "Staff Engineer | Platforms" is still a headline.
    const looksLikeContact = EMAIL_RE.test(trimmed) || trimmed.split(/\s*[·|]\s*/).some((p) => isPhone(p.trim()));
    const parts = (looksLikeContact ? trimmed.split(/\s*[·|]\s*/) : trimmed.split(/\s*·\s*/))
      .map((p) => p.trim())
      .filter(Boolean);
    let consumed = true;
    for (const part of parts) {
      const email = part.match(EMAIL_RE);
      if (email && !resume.basics.email) resume.basics.email = email[1];
      else if (isPhone(part) && !resume.basics.phone) resume.basics.phone = part;
      else if (parts.length > 1 && !resume.basics.location) resume.basics.location = part;
      else consumed = false;
    }
    if (consumed) continue;

    if (!headlineSet && !resume.basics.headline) {
      resume.basics.headline = trimmed;
      headlineSet = true;
      continue;
    }
    leftovers.push(makeLine(raw));
  }

  if (sawColumns) resume.basics.headerColumns = true;
  return leftovers;
}

function parseSection(
  title: string,
  kind: Section['kind'],
  body: string[]
): { section: Section; leftovers: Line[] } {
  const id = generateId();
  switch (kind) {
    case 'summary': {
      const paragraphs: string[] = [];
      const leftovers: Line[] = [];
      for (const raw of body) {
        const t = raw.trim();
        if (!t || /^:{3,}/.test(t)) continue;
        if (/^[-*]\s+/.test(t) || PAGE_BREAK_RE.test(t)) leftovers.push(makeLine(raw));
        else paragraphs.push(t);
      }
      return { section: { id, kind, title, paragraphs }, leftovers };
    }
    case 'experience':
    case 'education':
    case 'projects':
      return parseEntries(id, title, kind, body);
    case 'skills':
      return parseSkills(id, title, body);
    default: {
      // certifications and custom sections keep every line verbatim
      const lines = body
        .filter((raw) => raw.trim() && !/^:{3,}\s*(left|right|cols)?\s*$/i.test(raw.trim()))
        .map(makeLine);
      return { section: { id, kind: kind as 'custom' | 'certifications', title, lines }, leftovers: [] };
    }
  }
}

function splitMeta(line: string): string[] | null {
  if (!line.startsWith('*') || line.startsWith('**')) return null;
  return line
    .split('|')
    .map((p) => p.trim().replace(/^\*+/, '').replace(/\*+$/, '').trim())
    .filter(Boolean);
}

function parseEntries(
  id: string,
  title: string,
  kind: 'experience' | 'education' | 'projects',
  body: string[]
): { section: Section; leftovers: Line[] } {
  const items: (ExperienceItem | EducationItem | ProjectItem)[] = [];
  const leftovers: Line[] = [];
  let current: (ExperienceItem | EducationItem | ProjectItem) | null = null;

  const newItem = (header: string) => {
    const base = { id: generateId(), tags: [], bullets: [], notes: [] };
    if (kind === 'experience') {
      const [company, role] = header.includes('—') ? header.split('—').map((s) => s.trim()) : [header, ''];
      return { ...base, company, role } as ExperienceItem;
    }
    if (kind === 'education') return { ...base, school: header } as EducationItem;
    return { ...base, title: header } as ProjectItem;
  };

  for (const raw of body) {
    const t = raw.trim();
    if (!t || /^:{3,}\s*(left|right|cols)?\s*$/i.test(t)) continue;

    if (t.startsWith('### ')) {
      current = newItem(t.replace(/^###\s+/, '').trim());
      items.push(current);
      continue;
    }

    if (!current) {
      leftovers.push(makeLine(raw));
      continue;
    }

    const meta = splitMeta(t);
    if (meta) {
      const isFilled = kind === 'education' ? (current as EducationItem).degree !== undefined : false;
      if (kind === 'education' && isFilled) {
        // A second degree under the same school becomes its own entry
        const again = { ...newItem((current as EducationItem).school) } as EducationItem;
        items.push(again);
        current = again;
      }
      for (const part of meta) {
        const range = parseDateRange(part);
        if (range && !current.start) {
          current.start = range.start;
          current.end = range.end;
          continue;
        }
        const link = parseLink(part);
        if (kind === 'projects' && link && !(current as ProjectItem).link) {
          (current as ProjectItem).link = { label: link.label, url: link.url, icon: link.icon };
          continue;
        }
        if (kind === 'experience' && !(current as ExperienceItem).location && !link) {
          (current as ExperienceItem).location = part;
          continue;
        }
        if (kind === 'education' && (current as EducationItem).degree === undefined) {
          (current as EducationItem).degree = part;
          continue;
        }
        if (kind === 'projects' && !(current as ProjectItem).subtitle && !link) {
          (current as ProjectItem).subtitle = part;
          continue;
        }
        current.notes.push(part);
      }
      continue;
    }

    if (PILLS_RE.test(t)) {
      current.tags.push(...Array.from(t.matchAll(/`([^`]+)`/g), (m) => m[1]));
      continue;
    }

    if (/^[-*]\s+/.test(t)) {
      current.bullets.push({ id: generateId(), text: t.replace(/^[-*]\s+/, '') } as Bullet);
      continue;
    }

    if (PAGE_BREAK_RE.test(t)) {
      leftovers.push(makeLine(raw));
      continue;
    }

    current.notes.push(t);
  }

  // Education entries without a degree line keep degree undefined; a blank meta is not stored
  const section = { id, kind, title, items } as Section;
  return { section, leftovers };
}

function parseSkills(
  id: string,
  title: string,
  body: string[]
): { section: Section; leftovers: Line[] } {
  const groups: SkillGroup[] = [];
  let column: 'left' | 'right' | undefined;

  const splitSkills = (text: string) =>
    text
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

  for (const raw of body) {
    const t = raw.trim();
    if (!t) continue;

    const open = t.match(/^:{3,}\s*(left|right)\s*$/i);
    if (open) {
      column = open[1].toLowerCase() as 'left' | 'right';
      continue;
    }
    if (/^:{3,}\s*$/.test(t)) {
      column = undefined;
      continue;
    }

    const labelled = t.match(/^[-*]\s+\*\*(.+?)\*\*\s*:?\s*(.*)$/);
    if (labelled) {
      groups.push({
        id: generateId(),
        label: labelled[1].replace(/:$/, '').trim(),
        skills: splitSkills(labelled[2]),
        column,
      });
      continue;
    }

    const bare = t.match(/^\*\*(.+?)\*\*\s*:?$/);
    if (bare) {
      groups.push({ id: generateId(), label: bare[1].replace(/:$/, '').trim(), skills: [], column });
      continue;
    }

    const text = t.replace(/^[-*]\s+/, '');
    const last = groups[groups.length - 1];
    if (last && last.label === '' && last.column === column) {
      last.skills.push(...splitSkills(text));
    } else {
      groups.push({ id: generateId(), label: '', skills: splitSkills(text), column });
    }
  }

  return { section: { id, kind: 'skills', title, groups }, leftovers: [] };
}

// ---- rendering ------------------------------------------------------------

function renderLine(line: Line): string {
  if (line.kind === 'pagebreak') return '::: page-break';
  if (line.kind === 'bullet') return `- ${line.text}`;
  return line.text;
}

/** Meta line: plain text parts are italicised; raw parts (such as links) are written as they are */
function renderMeta(parts: ({ text: string } | { raw: string } | undefined)[]): string | null {
  const shown = parts
    .filter((p): p is { text: string } | { raw: string } => !!p && ('raw' in p ? !!p.raw : !!p.text))
    .map((p) => ('raw' in p ? p.raw : `*${p.text}*`));
  return shown.length ? shown.join(' | ') : null;
}

function renderEntryBody(item: { tags: string[]; bullets: Bullet[]; notes: string[] }): string[] {
  const out: string[] = [];
  if (item.tags.length) out.push(item.tags.map((t) => `\`${t}\``).join(' '));
  for (const b of item.bullets) out.push(`- ${b.text}`);
  for (const n of item.notes) out.push(n);
  return out;
}

function renderSection(section: Section, out: string[]) {
  out.push(`## ${section.title}`, '');
  switch (section.kind) {
    case 'summary':
      for (const p of section.paragraphs) out.push(p, '');
      break;
    case 'experience':
      for (const item of section.items) {
        out.push(`### ${item.company}${item.role ? ` — ${item.role}` : ''}`);
        const meta = renderMeta([item.location ? { text: item.location } : undefined, formatRange(item.start, item.end) ? { text: formatRange(item.start, item.end) } : undefined]);
        if (meta) out.push(meta);
        out.push(...renderEntryBody(item), '');
      }
      break;
    case 'education':
      for (const item of section.items) {
        out.push(`### ${item.school}`);
        const meta = renderMeta([item.degree ? { text: item.degree } : undefined, formatRange(item.start, item.end) ? { text: formatRange(item.start, item.end) } : undefined]);
        if (meta) out.push(meta);
        out.push(...renderEntryBody(item), '');
      }
      break;
    case 'projects':
      for (const item of section.items) {
        out.push(`### ${item.title}`);
        const meta = renderMeta([
          item.subtitle ? { text: item.subtitle } : undefined,
          item.link && { raw: linkMarkdown(item.link) },
          formatRange(item.start, item.end) ? { text: formatRange(item.start, item.end) } : undefined,
        ]);
        if (meta) out.push(meta);
        out.push(...renderEntryBody(item), '');
      }
      break;
    case 'skills': {
      // Consecutive groups in the same column share one column block, in order
      let open: 'left' | 'right' | undefined;
      const closeBlock = () => {
        if (open) out.push(':::');
        open = undefined;
      };
      for (const group of section.groups) {
        if (group.column !== open) {
          closeBlock();
          if (group.column) {
            out.push(`::: ${group.column}`);
            open = group.column;
          }
        }
        const skills = group.skills.join(', ');
        out.push(group.label ? `- **${group.label}:** ${skills}` : `- ${skills}`);
      }
      closeBlock();
      out.push('');
      break;
    }
    default:
      for (const line of section.lines) out.push(renderLine(line));
      out.push('');
  }
}

/**
 * Render the Resume model as Markdown (the editor view and the preview source).
 */
export function resumeToMarkdown(resume: Resume): string {
  const out: string[] = [];
  const { basics } = resume;

  if (basics.name) out.push(`# ${basics.name}`);
  if (basics.headline) out.push(basics.headline);

  // Contact fields are written as icon links, so parsing them back sets the same fields
  const contact = (icon: 'email' | 'phone' | 'location', value: string | undefined): string | null => {
    if (!value) return null;
    const url = icon === 'email' ? `mailto:${value}` : icon === 'phone' ? `tel:${value.replace(/[^+\d]/g, '')}` : '#';
    return `[icon:${icon} ${value}](${url})`;
  };
  const contacts = [
    contact('email', basics.email),
    contact('phone', basics.phone),
    contact('location', basics.location),
  ].filter((x): x is string => !!x);

  if (basics.headerColumns) {
    // Column links are written in their block; links with no column stay outside the blocks
    const left = [...contacts, ...basics.links.filter((l) => l.column === 'left').map(linkMarkdown)];
    const right = basics.links.filter((l) => l.column === 'right').map(linkMarkdown);
    const loose = basics.links.filter((l) => !l.column).map(linkMarkdown);
    if (left.length) out.push('::: left', ...left, ':::');
    if (right.length) out.push('::: right', ...right, ':::');
    out.push(...loose);
  } else {
    out.push(...contacts, ...basics.links.map(linkMarkdown));
  }
  if (out.length) out.push('');

  // Hidden sections are still written; the preview decides what to show
  for (const section of resume.sections) renderSection(section, out);

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
