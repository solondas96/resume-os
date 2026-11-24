/**
 * Structured Resume Data Model (v2).
 * The source of truth for resume content. Markdown is a view of this model:
 * markdownToResume parses it, resumeToMarkdown renders it (see serialize.ts).
 */

export interface Resume {
  id: string;
  schemaVersion: 2;
  meta: {
    title: string;
    targetRole?: string;
    targetJobId?: string;
    createdAt: number;
    updatedAt: number;
  };
  basics: {
    name: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    links: ContactLink[];
    /** True when the header contact block is laid out in two columns */
    headerColumns?: boolean;
  };
  sections: Section[];
  design: {
    template: string; // TemplateId
    accent: string;
    fontSize: string; // FontSizeOption
    margin: string; // MarginOption
    lineHeight: string; // LineHeightOption
    compactSpacing?: boolean;
    onePageMode?: boolean;
  };
}

export interface ContactLink {
  id: string;
  label: string;
  url: string;
  icon?: string; // e.g. 'github', 'linkedin', 'globe'
  column?: 'left' | 'right'; // header column, when headerColumns is set
}

export interface Bullet {
  id: string;
  text: string;
  pinned?: boolean;
  hidden?: boolean;
}

export interface YearMonth {
  year: number;
  month?: number; // 1-12, omitted if no month
  season?: 'Spring' | 'Summer' | 'Fall' | 'Winter'; // e.g. "Summer 2018"
}

export interface Line {
  id: string;
  kind: 'bullet' | 'text' | 'pagebreak';
  text: string;
}

interface DatedItem {
  start?: YearMonth;
  end?: YearMonth | 'present';
  tags: string[];
  bullets: Bullet[];
  /** Text that is part of the entry but not a bullet, kept in order */
  notes: string[];
}

export interface ExperienceItem extends DatedItem {
  id: string;
  company: string;
  role: string;
  location?: string;
}

export interface EducationItem extends DatedItem {
  id: string;
  school: string;
  degree?: string;
}

export interface ProjectItem extends DatedItem {
  id: string;
  title: string;
  subtitle?: string;
  link?: { label: string; url: string; icon?: string };
}

export interface SkillGroup {
  id: string;
  label: string; // '' for an ungrouped list
  skills: string[];
  column?: 'left' | 'right';
}

export type Section =
  | { id: string; kind: 'summary'; title: string; hidden?: boolean; paragraphs: string[] }
  | { id: string; kind: 'experience'; title: string; hidden?: boolean; items: ExperienceItem[] }
  | { id: string; kind: 'education'; title: string; hidden?: boolean; items: EducationItem[] }
  | { id: string; kind: 'projects'; title: string; hidden?: boolean; items: ProjectItem[] }
  | { id: string; kind: 'skills'; title: string; hidden?: boolean; groups: SkillGroup[] }
  | { id: string; kind: 'certifications' | 'custom'; title: string; hidden?: boolean; lines: Line[] };

export type SectionKind = Section['kind'];

/** Items that carry bullets (experience, education, projects) */
export function sectionItems(section: Section): (ExperienceItem | EducationItem | ProjectItem)[] {
  return section.kind === 'experience' || section.kind === 'education' || section.kind === 'projects'
    ? (section.items as (ExperienceItem | EducationItem | ProjectItem)[])
    : [];
}

/** Every bullet in the resume, with the section it belongs to */
export function allBullets(resume: Resume): { sectionId: string; bullet: Bullet }[] {
  return resume.sections.flatMap((section) =>
    sectionItems(section).flatMap((item) => item.bullets.map((bullet) => ({ sectionId: section.id, bullet })))
  );
}

/** Unique resume id. Time plus randomness, so two resumes made in the same millisecond never collide */
export function newResumeId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `resume-${Date.now().toString(36)}-${random}`;
}

/**
 * Create a new resume with defaults
 */
export function createResume(
  title: string = 'Untitled Resume',
  options: {
    targetRole?: string;
    template?: string;
    accent?: string;
  } = {}
): Resume {
  return {
    id: newResumeId(),
    schemaVersion: 2,
    meta: {
      title,
      targetRole: options.targetRole,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    basics: {
      name: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      links: [],
    },
    sections: [],
    design: {
      template: options.template || 'modern',
      accent: options.accent || '#1F3A5F',
      fontSize: 'medium',
      margin: 'normal',
      lineHeight: 'normal',
    },
  };
}

/**
 * Clone a resume with a new ID
 */
export function cloneResume(resume: Resume, newTitle?: string): Resume {
  return {
    ...resume,
    id: newResumeId(),
    meta: {
      ...resume.meta,
      title: newTitle || `${resume.meta.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}
