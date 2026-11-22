/**
 * Structured Resume Data Model (v2)
 * Source of truth for resume content, replacing flat markdown string.
 * Supports round-trip serialization to markdown and back.
 */

export interface Resume {
  id: string;
  schemaVersion: 2;
  /**
   * The exact editor text this resume was written in. The structured fields
   * are parsed from it, and it is the buffer the editor shows, so text the
   * parser does not model is never lost.
   */
  source?: string;
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
    summary?: string;
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
  icon?: string; // e.g., 'github', 'linkedin', 'email'
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
}

export interface SimpleItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  start: YearMonth;
  end: YearMonth | 'present';
  bullets: Bullet[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree?: string;
  field?: string;
  start: YearMonth;
  end?: YearMonth;
  bullets?: Bullet[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
  start: YearMonth;
  end?: YearMonth | 'present';
  bullets: Bullet[];
}

export interface SkillGroup {
  id: string;
  label: string;
  skills: string[];
}

export type SectionKind = 'experience' | 'education' | 'projects' | 'skills' | 'certifications' | 'custom';

export interface Section {
  id: string;
  kind: SectionKind;
  title: string;
  hidden?: boolean;
  items?: ExperienceItem[] | EducationItem[] | ProjectItem[] | SimpleItem[];
  groups?: SkillGroup[]; // Only for 'skills' sections
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
    id: `resume-${Date.now()}`,
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
      summary: '',
    },
    sections: [],
    design: {
      template: options.template || 'modern',
      accent: options.accent || '#c96442',
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
    id: `resume-${Date.now()}`,
    meta: {
      ...resume.meta,
      title: newTitle || `${resume.meta.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}
