/**
 * Structure detection: ordered text lines -> the Markdown dialect used by the model.
 * Heuristic and explainable: headings by alias, size, or bold caps; entries by dates and
 * company words; bullets by markers and wrapped continuation lines. Anything not placed
 * is kept (under "Other") and listed for the user to move.
 */

import { TextLine, bodySize } from './layout';
import { parseDateRange, formatRange } from '../model/serialize';

export type Confidence = 'high' | 'medium' | 'low';

export interface DetectedSection {
  title: string;
  kind: 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'certifications' | 'custom';
  confidence: Confidence;
  entries: number;
}

export interface UnsortedLine {
  id: string;
  text: string;
  page: number;
  reason: string;
}

export interface StructureResult {
  markdown: string;
  name: string;
  sections: DetectedSection[];
  unsorted: UnsortedLine[];
  /** Human-readable notes on what was guessed */
  notes: string[];
}

const HEADING_ALIASES: Record<string, { title: string; kind: DetectedSection['kind'] }> = {
  summary: { title: 'Summary', kind: 'summary' },
  profile: { title: 'Summary', kind: 'summary' },
  'professional summary': { title: 'Summary', kind: 'summary' },
  'executive summary': { title: 'Summary', kind: 'summary' },
  'about me': { title: 'Summary', kind: 'summary' },
  experience: { title: 'Experience', kind: 'experience' },
  'work experience': { title: 'Experience', kind: 'experience' },
  'professional experience': { title: 'Experience', kind: 'experience' },
  'employment history': { title: 'Experience', kind: 'experience' },
  employment: { title: 'Experience', kind: 'experience' },
  'work history': { title: 'Experience', kind: 'experience' },
  education: { title: 'Education', kind: 'education' },
  'academic background': { title: 'Education', kind: 'education' },
  skills: { title: 'Skills', kind: 'skills' },
  'technical skills': { title: 'Skills', kind: 'skills' },
  'core competencies': { title: 'Skills', kind: 'skills' },
  competencies: { title: 'Skills', kind: 'skills' },
  projects: { title: 'Projects', kind: 'projects' },
  'key projects': { title: 'Projects', kind: 'projects' },
  certifications: { title: 'Certifications', kind: 'certifications' },
  certificates: { title: 'Certifications', kind: 'certifications' },
  licenses: { title: 'Certifications', kind: 'certifications' },
};

// Bullet markers: the usual glyphs, plus the private-use codes that Symbol and Wingdings fonts
// (used by Word and LibreOffice) write for bullets: U+F0B7, U+F0A7, U+F0D8, U+F09F
const BULLET_RE = /^(?:[•▪◦●·\-–—*\uF0A7\uF0B7\uF0D8\uF09F]\s*|\d{1,2}[.)]\s+)/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/;
const URL_RE = /((?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com|[a-z0-9-]+\.[a-z]{2,})(?:\/[^\s]*)?)/i;
// Month names only: a bare word before a year is not a month ("Science 2012" is not a date)
const MONTH = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?`;
const TOKEN = String.raw`(?:(?:Spring|Summer|Fall|Autumn|Winter)\s+(?:19|20)\d{2}|(?:${MONTH}\s+)?(?:19|20)\d{2}(?:\s+to\s+date)?|\d{1,2}[\/.]\d{1,2}[\/.](?:19|20)\d{2}|\d{1,2}\/(?:19|20)\d{2}|present|now|current|to date|today)`;
// Dates may be in parentheses: "Engineer (2019 – Present)"
const RANGE_AT_END = new RegExp(String.raw`(?:^|\s|\|)\(?(${TOKEN}\s*(?:–|—|-|\bto\b)\s*${TOKEN})\)?\s*$`, 'i');
const SINGLE_AT_END = new RegExp(String.raw`(?:^|\s|\|)\(?((?:${MONTH}\s+)?(?:19|20)\d{2}(?:\s+to\s+date)?|(?:Spring|Summer|Fall|Autumn|Winter)\s+(?:19|20)\d{2})\)?\s*$`, 'i');
const COMPANY_WORD = /\b(inc|llc|llp|pllc|plc|ltd|lp|corp|corporation|co|company|group|labs?|university|college|school|institute|hospital|medical|clinic|center|centre|partners|associates|studio|agency|bank|systems|technologies|solutions|health|foundation|academy|department|district|industries|media|cloud|electric|power|logistics|retail|digital|outfitters|apparel|holdings|ventures|works|network|networks|pharmacy|cancer|gulf|emirates)\b/i;
/** Words that name a role. A part with one is the role, not the company */
const ROLE_WORD = /\b(engineer|developer|manager|director|analyst|designer|nurse|teacher|lead|senior|junior|staff|principal|associate|specialist|consultant|coordinator|chef|accountant|lawyer|counsel|pharmacist|intern|officer|executive|architect|scientist|researcher|administrator|assistant|head|technician|electrician|foreman|representative|advisor|editor|writer|producer|partner)\b/i;
const SCHOOL_WORD = /\b(university|college|school|institute|academy)\b/i;
/** A line that starts with words and ends in a role word: "Platform Engineer San Francisco, CA" */
const ROLE_LEAD = new RegExp(`^(.*${ROLE_WORD.source})\\s+(.+)$`, 'i');

export const splitDate = (text: string): { rest: string; dates?: string } => {
  const range = text.match(RANGE_AT_END);
  if (range && parseDateRange(range[1])) {
    return { rest: text.slice(0, range.index).replace(/[|–—-]\s*$/, '').trim(), dates: formatRange(parseDateRange(range[1])!.start, parseDateRange(range[1])!.end) };
  }
  const single = text.match(SINGLE_AT_END);
  const singleRange = single ? parseDateRange(single[1]) : null;
  if (single && singleRange) {
    return { rest: text.slice(0, single.index).replace(/[|–—-]\s*$/, '').trim(), dates: formatRange(singleRange.start, singleRange.end) };
  }
  return { rest: text };
};

/**
 * Split an entry header into its two parts, using the separator and company words.
 * Experience: head is the company, detail the role. Education: head is the school.
 * Dashes read "Company — Role" unless the second part looks like the company;
 * commas and pipes read "Role, Company" unless the first part looks like the company;
 * "at" reads "Role at Company".
 */
export function splitEntryHeader(text: string, kind: 'experience' | 'education' | 'projects'): { head: string; detail?: string; confident: boolean } {
  // A role can contain a comma ("Charge Nurse, ICU, St. Mary Medical Center"): when the text
  // after the last comma is a company, split there
  const lastComma = text.lastIndexOf(', ');
  if (kind !== 'education' && lastComma > 0 && COMPANY_WORD.test(text.slice(lastComma + 2)) && text.indexOf(', ') !== lastComma) {
    return { head: text.slice(lastComma + 2).trim(), detail: text.slice(0, lastComma).trim(), confident: true };
  }

  // Three comma parts are "Role, Company, Place" (experience) or "Degree, School, Place" (education);
  // the place is not a company or a role, so it is dropped
  const commaParts = text.split(', ').map((p) => p.trim()).filter(Boolean);
  if (kind !== 'projects' && commaParts.length >= 3) {
    if (kind === 'education') {
      const school = commaParts.findIndex((p) => SCHOOL_WORD.test(p));
      if (school >= 0) return { head: commaParts[school], detail: commaParts.slice(0, school).join(', ') || undefined, confident: true };
    } else {
      const role = commaParts.findIndex((p) => ROLE_WORD.test(p));
      if (role >= 0) {
        const companyAt = commaParts.findIndex((p, k) => k !== role && COMPANY_WORD.test(p));
        const company = companyAt >= 0 ? companyAt : role === 0 ? 1 : 0;
        return { head: commaParts[company], detail: commaParts[role], confident: true };
      }
    }
  }

  const separators = [' — ', ' – ', ' | ', ' - ', ' at ', ', '];
  for (const sep of separators) {
    const at = text.indexOf(sep);
    if (at <= 0) continue;
    const a = text.slice(0, at).trim();
    const b = text.slice(at + sep.length).trim();
    if (!a || !b) continue;

    if (kind === 'education') {
      const schoolFirst = SCHOOL_WORD.test(a) || !SCHOOL_WORD.test(b);
      return schoolFirst
        ? { head: a, detail: b, confident: SCHOOL_WORD.test(a) || SCHOOL_WORD.test(b) }
        : { head: b, detail: a, confident: true };
    }
    if (kind === 'projects') return { head: a, detail: b, confident: true };

    const aCompany = COMPANY_WORD.test(a);
    const bCompany = COMPANY_WORD.test(b);
    const aRole = ROLE_WORD.test(a);
    const bRole = ROLE_WORD.test(b);
    if (sep === ' at ') return { head: b, detail: a, confident: true }; // "Role at Company"
    if (sep === ' — ' || sep === ' – ' || sep === ' - ') {
      // A part with a role word is the role; the other part is the company
      if (aRole !== bRole) return aRole ? { head: b, detail: a, confident: true } : { head: a, detail: b, confident: true };
      if (bCompany && !aCompany) return { head: b, detail: a, confident: true };
      return { head: a, detail: b, confident: aCompany || bCompany }; // company first by default
    }
    // ", " and " | ": role first by default
    if (aRole !== bRole) return aRole ? { head: b, detail: a, confident: true } : { head: a, detail: b, confident: true };
    if (aCompany && !bCompany) return { head: a, detail: b, confident: true };
    return { head: b, detail: a, confident: aCompany || bCompany };
  }
  return { head: text, confident: kind === 'projects' };
}

const isUpper = (s: string) => s === s.toUpperCase() && /[A-Z]/.test(s);
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * A heading: a known section name, or (outside the header) a line set larger than the body, or
 * bold capitals. In the header only known names count, so a headline set large is not a section.
 */
function headingFor(line: TextLine, body: number, inHeader = false): { title: string; kind: DetectedSection['kind']; confidence: Confidence } | null {
  const text = line.text.replace(/:$/, '').trim();
  const alias = HEADING_ALIASES[text.toLowerCase()];
  // Keep the document's own wording ("Profile", not "Summary"); the alias only picks the section kind
  // All-caps headings read better in title case; mixed-case wording is kept as written
  if (alias) return { title: isUpper(text) ? titleCase(text) : text, kind: alias.kind, confidence: 'high' };
  if (inHeader) return null;
  const words = text.split(/\s+/).length;
  if (BULLET_RE.test(line.text) || SPACE_DATE(text)) return null;
  // A bold line only counts when it is clearly larger than the body (a bold job title is not a heading)
  if (line.size >= body * 1.15 && (!line.bold || line.size >= body * 1.3) && words <= 5 && text.length > 2) {
    return { title: titleCase(text), kind: 'custom', confidence: 'medium' };
  }
  if (line.bold && isUpper(text) && words <= 4 && text.length > 3) return { title: titleCase(text), kind: 'custom', confidence: 'medium' };
  return null;
}

function SPACE_DATE(text: string): boolean {
  return RANGE_AT_END.test(text);
}

/** A line that is only a date: "2021", "Mar 2020 – Present" */
const dateOnly = (text: string): boolean => {
  const s = splitDate(text);
  return s.dates !== undefined && s.rest === '';
};

// A bold line is a heading of its own (an entry's company), never the end of the bullet above
const isContinuation = (line: TextLine, prev: TextLine | null, prevWasBullet: boolean): boolean =>
  prevWasBullet && prev !== null && (/^[a-z(]/.test(line.text) || line.x0 > prev.x0 + 2) && !BULLET_RE.test(line.text) && !SPACE_DATE(line.text) && !line.bold && !line.aside;

/**
 * Detect the structure of ordered lines and emit the Markdown dialect.
 */
export function structureFromLines(input: TextLine[]): StructureResult {
  const notes: string[] = [];
  const unsorted: UnsortedLine[] = [];
  const sections: DetectedSection[] = [];
  const out: string[] = [];
  const body = bodySize(input);
  // The name is the largest text near the top. A layout with no column split can put an address
  // above it in reading order, so the name is moved to the front.
  let lines = input;
  {
    const top = input.slice(0, 6);
    const biggest = Math.max(...top.map((l) => l.size));
    const at = top.findIndex((l) => l.size === biggest);
    const candidate = top[at];
    if (at > 0 && biggest >= body * 1.3 && candidate.text.split(/\s+/).length <= 5 && !EMAIL_RE.test(candidate.text) && !PHONE_RE.test(candidate.text)) {
      lines = [candidate, ...input.filter((l) => l !== candidate)];
    }
  }
  let uid = 0;
  // Each column's own left margin (its most common x): a line indented past it is a list item,
  // even when the bullet is drawn as a graphic and has no glyph in the text
  const margins = new Map<string, Map<number, number>>();
  for (const l of lines) {
    const key = l.column ?? 'all';
    const counts = margins.get(key) ?? new Map<number, number>();
    const x = Math.round(l.x0);
    counts.set(x, (counts.get(x) ?? 0) + 1);
    margins.set(key, counts);
  }
  const marginOf = (line: TextLine): number => {
    const counts = margins.get(line.column ?? 'all');
    if (!counts) return 0;
    let best = 0;
    let bestN = -1;
    for (const [x, n] of counts) if (n > bestN) { best = x; bestN = n; }
    return best;
  };
  const indented = (line: TextLine) => line.x0 - marginOf(line) > 6;
  const unsortedId = () => `u${++uid}`;

  // ---- name and header ----------------------------------------------------
  let i = 0;
  let name = '';
  if (lines.length > 0) {
    const first = lines[0];
    const looksLikeName = !EMAIL_RE.test(first.text) && !PHONE_RE.test(first.text) && first.text.split(/\s+/).length <= 5;
    if (looksLikeName) {
      name = first.text;
      if (first.size < body * 1.2) notes.push(`Name "${name}" was taken from the first line; it is not set in a larger font.`);
      i = 1;
      // A name set on two lines in the same large size ("Tomas" / "Novak" in a sidebar)
      const second = lines[1];
      if (second && first.size >= body * 1.3 && Math.abs(second.size - first.size) < 0.5 && second.text.split(/\s+/).length <= 2 && !EMAIL_RE.test(second.text) && !PHONE_RE.test(second.text)) {
        name = `${first.text} ${second.text}`;
        i = 2;
      }
    } else {
      notes.push('No name was found at the top of the page.');
    }
  }
  out.push(name ? `# ${name}` : '');

  const contactLines: string[] = [];
  const links: string[] = [];
  let headlineSet = false;
  // Contact details can share a line, separated by bars or dots ("Accra, Ghana | +233 … | name@x.com")
  const splitContactRow = (text: string): string[] => {
    const pieces = text.split(/\s+[|·•]\s+/).map((p) => p.trim()).filter(Boolean);
    return pieces.length > 1 && pieces.some((p) => EMAIL_RE.test(p) || PHONE_RE.test(p)) ? pieces : [text];
  };

  while (i < lines.length && !headingFor(lines[i], body, true)) {
    const line = lines[i];
    const pieces = splitContactRow(line.text);
    const isContactRow = pieces.length > 1;
    for (const piece of pieces) {
      // "Phone: +98 21 555 0166": the label is not part of the value
      const text = piece.replace(/^(?:e-?mail|phone|tel|telephone|mobile|cell|web|website|linkedin)\s*:\s*/i, '');
      const email = text.match(EMAIL_RE);
      const phone = text.match(PHONE_RE);
      const url = text.match(URL_RE);
      if (email || phone) {
        contactLines.push(text);
      } else if (url && !email) {
        const u = url[1].startsWith('http') ? url[1] : `https://${url[1]}`;
        const icon = /linkedin/i.test(u) ? 'linkedin' : /github/i.test(u) ? 'github' : 'globe';
        links.push(`[icon:${icon} ${url[1]}](${u})`);
      } else if (isContactRow) {
        // Any other part of a contact row (a place, a website) is contact information too
        contactLines.push(text);
      } else if (!headlineSet && line.text.length > 3) {
        out.push(line.text);
        headlineSet = true;
      } else {
        unsorted.push({ id: unsortedId(), text: line.text, page: line.page, reason: 'in the header, not a contact detail' });
        out.push(line.text);
      }
    }
    i++;
  }
  out.push(...contactLines, ...links, '');
  const headerEnd = out.length - 1;
  // Contact details in a "Contact" section of their own are moved up into the header
  const sideContact: string[] = [];

  // ---- sections -----------------------------------------------------------
  let current: { kind: DetectedSection['kind']; entry: boolean; prevBullet: TextLine | null; hasEntry: boolean; hasMeta?: boolean } | null = null;
  let prev: TextLine | null = null;
  let prevWasBullet = false;
  let sectionIndex = -1;

  const startSection = (title: string, kind: DetectedSection['kind'], confidence: Confidence) => {
    sections.push({ title, kind, confidence, entries: 0 });
    sectionIndex = sections.length - 1;
    out.push(`## ${title}`, '');
    current = { kind, entry: kind === 'experience' || kind === 'education' || kind === 'projects', prevBullet: null, hasEntry: false };
    prev = null;
    prevWasBullet = false;
  };

  let inContact = false;
  // The role under an entry header that had only a company: "Platform Engineer San Francisco, CA"
  let roleAfterDates: { index: number; head: string } | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const heading = headingFor(line, body);
    if (heading && heading.title.toLowerCase() === 'contact') {
      inContact = true;
      notes.push('The contact section was moved up into the header.');
      continue;
    }
    if (heading) {
      inContact = false;
      startSection(heading.title, heading.kind, heading.confidence);
      if (heading.kind === 'custom') notes.push(`Heading "${heading.title}" is not a standard section name; kept as a custom section.`);
      continue;
    }
    if (inContact) {
      for (const piece of splitContactRow(line.text)) sideContact.push(piece);
      continue;
    }
    if (!current) {
      // Text before any heading
      unsorted.push({ id: unsortedId(), text: line.text, page: line.page, reason: 'before any section heading' });
      out.push(line.text);
      continue;
    }

    const kind = (current as { kind: DetectedSection['kind'] }).kind;
    const text = line.text;

    if (kind === 'summary') {
      out.push(text, '');
      prev = line;
      continue;
    }

    if (kind === 'skills') {
      // Skills set in a row are separated by bars or dots: they read as a comma list
      const commas = (s: string) => s.replace(/\s*[|·•]\s*/g, ', ');
      const labelled = text.match(/^([^:]{2,32}):\s*(.+)$/);
      out.push(
        labelled
          ? `- **${labelled[1].trim()}:** ${commas(labelled[2].trim())}`
          : BULLET_RE.test(text)
            ? `- ${commas(text.replace(BULLET_RE, ''))}`
            : `- ${commas(text)}`
      );
      prev = line;
      continue;
    }

    // An entry header that named only the company: the line under its dates may name the role
    if (roleAfterDates && !dateOnly(text)) {
      const waiting = roleAfterDates;
      roleAfterDates = null;
      // "Platform Engineer San Francisco, CA" (role, then place) or a bare "Platform Engineer"
      const lead = BULLET_RE.test(text) ? null : text.match(ROLE_LEAD);
      const role = lead ? lead[1].trim() : ROLE_WORD.test(text) ? text.trim() : null;
      if (role && role.split(/\s+/).length <= 4 && text.length < 60 && !/[.!?]$/.test(text)) {
        out[waiting.index] = `### ${waiting.head} — ${role}`;
        prev = line;
        prevWasBullet = false;
        continue;
      }
    }

    // Order matters: a marked line is a bullet; a wrapped line joins the bullet before it;
    // only then does an indented line (a bullet drawn without a glyph) start a new bullet
    if (BULLET_RE.test(text)) {
      out.push(`- ${text.replace(BULLET_RE, '').trim()}`);
      prevWasBullet = true;
      prev = line;
      continue;
    }

    if (isContinuation(line, prev, prevWasBullet)) {
      // Wrapped bullet: join to the previous bullet line in the output
      const last = out.length - 1;
      out[last] = `${out[last]} ${text}`;
      prev = line;
      continue;
    }

    // A cell beside another cell (a date or a place at the right), a bold heading and a date on its own
    // are never list items, however far they are indented
    if (indented(line) && !SPACE_DATE(text) && !dateOnly(text) && !line.aside && !line.bold) {
      out.push(`- ${text.trim()}`);
      prevWasBullet = true;
      prev = line;
      continue;
    }

    if (current && (current as { entry: boolean }).entry) {
      const split = splitDate(text);
      const dated = split.dates !== undefined;
      const looksLikeHeader = dated || (line.bold && text.length < 90);
      // A dated line straight under an entry header is that entry's meta (dates, or a degree),
      // not a new entry
      if (dated && (current as { hasEntry: boolean }).hasEntry && !(current as { hasMeta?: boolean }).hasMeta) {
        const isDegreeLine = kind === 'education' && split.rest.length > 0;
        out.push(split.rest.length === 0 ? `*${split.dates}*` : isDegreeLine ? `*${split.rest} | ${split.dates}*` : `*${split.dates}*`);
        (current as { hasMeta?: boolean }).hasMeta = true;
        prevWasBullet = false;
        prev = line;
        continue;
      }
      if (looksLikeHeader && split.rest.length > 0) {
        const parts = splitEntryHeader(split.rest, kind as 'experience' | 'education' | 'projects');
        if (!parts.confident) notes.push(`Could not tell which part of "${split.rest}" is the ${kind === 'education' ? 'school' : 'company'}; check the order.`);
        const entryConfident = parts.confident && dated;
        if (!entryConfident) unsorted.push({ id: unsortedId(), text, page: line.page, reason: 'entry header is a guess' });
        const headerAt = out.length;
        // An education entry is "### School" with its degree in the meta line; a role and a company
        // share the header line
        const degreeInMeta = kind === 'education' && parts.detail !== undefined;
        out.push(
          kind === 'projects' || degreeInMeta ? `### ${parts.head}` : `### ${parts.head}${parts.detail ? ` — ${parts.detail}` : ''}`
        );
        if (degreeInMeta) out.push(`*${[parts.detail, dated ? split.dates : ''].filter(Boolean).join(' | ')}*`);
        else if (dated) out.push(`*${split.dates}*`);
        roleAfterDates = kind === 'experience' && !parts.detail ? { index: headerAt, head: parts.head } : null;
        sections[sectionIndex].entries += 1;
        (current as { hasEntry: boolean; hasMeta?: boolean }).hasEntry = true;
        (current as { hasMeta?: boolean }).hasMeta = dated || degreeInMeta;
        prevWasBullet = false;
        prev = line;
        continue;
      }
      if (!(current as { hasEntry: boolean }).hasEntry) {
        unsorted.push({ id: unsortedId(), text, page: line.page, reason: 'before the first entry in this section' });
        out.push(text);
      } else if (!(current as { bodyLines?: number }).bodyLines && text.length < 60 && !/[.!?]$/.test(text) && text.split(/\s+/).length <= 6) {
        // The first line straight under a header is usually the location
        out.push(`*${text}*`);
        (current as { bodyLines?: number }).bodyLines = 1;
      } else {
        out.push(text);
        (current as { bodyLines?: number }).bodyLines = ((current as { bodyLines?: number }).bodyLines ?? 0) + 1;
      }
      prev = line;
      prevWasBullet = false;
      continue;
    }

    // Custom and certifications: keep the lines as they are
    out.push(text);
    prev = line;
    prevWasBullet = false;
  }

  out.splice(headerEnd, 0, ...sideContact);

  // Remove the blank line the writer may have left between a bullet and its continuation
  const markdown = out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  return { markdown, name, sections, unsorted, notes };
}

/**
 * Move one line of text from its current place to the end of a section.
 * Used by the review screen to resolve unsorted lines without drag and drop.
 * Returns the new markdown, or the original if the line is not found.
 */
export function moveLineToSection(markdown: string, lineText: string, sectionTitle: string): string {
  const lines = markdown.split('\n');
  const index = lines.findIndex((l) => l.trim() === lineText.trim());
  if (index < 0) return markdown;
  const [moved] = lines.splice(index, 1);
  const bullet = moved.trim().startsWith('- ') ? moved.trim() : `- ${moved.trim()}`;

  const heading = lines.findIndex((l) => l.trim().toLowerCase() === `## ${sectionTitle}`.toLowerCase());
  // Never drop the line: if the target section is missing, the text stays as it was
  if (heading < 0) return markdown;
  let insertAt = heading + 1;
  while (insertAt < lines.length && !lines[insertAt].startsWith('## ')) insertAt++;
  lines.splice(insertAt, 0, bullet);
  return lines.join('\n');
}
