/**
 * Pure edits to the Resume model. The form editor and the store both use these,
 * so every change is a plain function that can be tested without React.
 */

import {
  Resume,
  Section,
  SectionKind,
  Bullet,
  Line,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillGroup,
  YearMonth,
  ContactLink,
  sectionItems,
} from './resume';

export const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const newBullet = (text = ''): Bullet => ({ id: newId(), text });

/** Move the element at `from` to `to` (both inside the array bounds) */
export function moveIndex<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function newSection(kind: SectionKind, title?: string): Section {
  const id = newId();
  switch (kind) {
    case 'summary':
      return { id, kind, title: title ?? 'Summary', paragraphs: [''] };
    case 'experience':
      return { id, kind, title: title ?? 'Experience', items: [] };
    case 'education':
      return { id, kind, title: title ?? 'Education', items: [] };
    case 'projects':
      return { id, kind, title: title ?? 'Projects', items: [] };
    case 'skills':
      return { id, kind, title: title ?? 'Skills', groups: [] };
    default:
      return { id, kind, title: title ?? 'Section', lines: [] };
  }
}

export function newEntry(kind: 'experience' | 'education' | 'projects'): ExperienceItem | EducationItem | ProjectItem {
  const base = { id: newId(), tags: [], bullets: [], notes: [] };
  if (kind === 'experience') return { ...base, company: '', role: '' } as ExperienceItem;
  if (kind === 'education') return { ...base, school: '' } as EducationItem;
  return { ...base, title: '' } as ProjectItem;
}

/** Map one section by id (other sections are returned unchanged) */
export function mapSection(resume: Resume, sectionId: string, fn: (s: Section) => Section): Resume {
  return { ...resume, sections: resume.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

/** Map one entry (experience, education or project item) inside a section */
export function mapItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  fn: <T extends ExperienceItem | EducationItem | ProjectItem>(item: T) => T
): Resume {
  return mapSection(resume, sectionId, (s) => {
    if (s.kind !== 'experience' && s.kind !== 'education' && s.kind !== 'projects') return s;
    return { ...s, items: (s.items as any[]).map((it) => (it.id === itemId ? fn(it) : it)) } as Section;
  });
}

/** Map one bullet inside an entry */
export function mapBullet(
  resume: Resume,
  sectionId: string,
  itemId: string,
  bulletId: string,
  fn: (b: Bullet) => Bullet | null
): Resume {
  return mapItem(resume, sectionId, itemId, (item) => ({
    ...item,
    bullets: item.bullets.flatMap((b) => {
      if (b.id !== bulletId) return [b];
      const edited = fn(b);
      return edited ? [edited] : [];
    }),
  }));
}

export function addBullet(resume: Resume, sectionId: string, itemId: string, text = ''): Resume {
  return mapItem(resume, sectionId, itemId, (item) => ({ ...item, bullets: [...item.bullets, newBullet(text)] }));
}

export function moveBullet(resume: Resume, sectionId: string, itemId: string, from: number, to: number): Resume {
  return mapItem(resume, sectionId, itemId, (item) => ({ ...item, bullets: moveIndex(item.bullets, from, to) }));
}

export function moveItem(resume: Resume, sectionId: string, from: number, to: number): Resume {
  return mapSection(resume, sectionId, (s) => {
    if (s.kind !== 'experience' && s.kind !== 'education' && s.kind !== 'projects') return s;
    return { ...s, items: moveIndex(s.items as any[], from, to) } as Section;
  });
}

export function moveSection(resume: Resume, from: number, to: number): Resume {
  return { ...resume, sections: moveIndex(resume.sections, from, to) };
}

export function setSectionHidden(resume: Resume, sectionId: string, hidden: boolean): Resume {
  return mapSection(resume, sectionId, (s) => ({ ...s, hidden }));
}

export function setBulletHidden(resume: Resume, sectionId: string, itemId: string, bulletId: string, hidden: boolean): Resume {
  return mapBullet(resume, sectionId, itemId, bulletId, (b) => ({ ...b, hidden }));
}

export function removeSection(resume: Resume, sectionId: string): Resume {
  return { ...resume, sections: resume.sections.filter((s) => s.id !== sectionId) };
}

export function setYearMonth(value: YearMonth | 'present' | undefined, patch: Partial<YearMonth>): YearMonth {
  const base: YearMonth = typeof value === 'object' && value ? value : { year: new Date().getFullYear() };
  return { ...base, ...patch };
}

/** Icon for a contact link, detected from its URL (the user can still change it later) */
export function detectIcon(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('github.com')) return 'github';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('twitter.com') || u.includes('x.com/')) return 'twitter';
  if (u.includes('mailto:')) return 'email';
  if (u.includes('tel:')) return 'phone';
  return 'globe';
}

export function newLink(): ContactLink {
  return { id: newId(), label: '', url: '' };
}

export const skillsFromText = (text: string): string[] =>
  text.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

export function newGroup(label = ''): SkillGroup {
  return { id: newId(), label, skills: [] };
}

export function newLine(kind: Line['kind'] = 'bullet', text = ''): Line {
  return { id: newId(), kind, text };
}

/** Items of a section, for counting and display */
export function itemCount(section: Section): number {
  if (section.kind === 'skills') return section.groups.length;
  if (section.kind === 'summary') return section.paragraphs.length;
  if (section.kind === 'custom' || section.kind === 'certifications') return section.lines.length;
  return sectionItems(section).length;
}

/**
 * Remove contact details for a shared copy. The phone or email is cleared from the header;
 * the form and the saved resume are not changed.
 */
export function redactContact(resume: Resume, opts: { email?: boolean; phone?: boolean }): Resume {
  return {
    ...resume,
    basics: {
      ...resume.basics,
      email: opts.email ? undefined : resume.basics.email,
      phone: opts.phone ? undefined : resume.basics.phone,
    },
  };
}

/**
 * The resume as it should appear in outputs (preview, share, export):
 * hidden sections and hidden bullets are removed. The form still shows them.
 */
export function forOutput(resume: Resume): Resume {
  return {
    ...resume,
    sections: resume.sections
      .filter((s) => !s.hidden)
      .map((s) => {
        if (s.kind !== 'experience' && s.kind !== 'education' && s.kind !== 'projects') return s;
        return {
          ...s,
          items: (s.items as any[]).map((item) => ({ ...item, bullets: item.bullets.filter((b: Bullet) => !b.hidden) })),
        } as Section;
      }),
  };
}

/** Set the order of an entry's bullets (ids must be the same set; unknown ids are ignored) */
export function setBulletOrder(resume: Resume, sectionId: string, itemId: string, orderedIds: string[]): Resume {
  return mapItem(resume, sectionId, itemId, (item) => {
    const byId = new Map(item.bullets.map((b) => [b.id, b]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter((b): b is Bullet => !!b);
    const rest = item.bullets.filter((b) => !orderedIds.includes(b.id));
    return { ...item, bullets: [...ordered, ...rest] };
  });
}

/** Set the skills of one group, in order */
export function setGroupSkills(resume: Resume, sectionId: string, groupId: string, skills: string[]): Resume {
  return mapSection(resume, sectionId, (s) => {
    if (s.kind !== 'skills') return s;
    return { ...s, groups: s.groups.map((g) => (g.id === groupId ? { ...g, skills: [...skills] } : g)) };
  });
}

/** Set the order of a section's skill groups */
export function setGroupOrder(resume: Resume, sectionId: string, orderedGroupIds: string[]): Resume {
  return mapSection(resume, sectionId, (s) => {
    if (s.kind !== 'skills') return s;
    const byId = new Map(s.groups.map((g) => [g.id, g]));
    const ordered = orderedGroupIds.map((id) => byId.get(id)).filter((g): g is SkillGroup => !!g);
    const rest = s.groups.filter((g) => !orderedGroupIds.includes(g.id));
    return { ...s, groups: [...ordered, ...rest] };
  });
}
