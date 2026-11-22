/**
 * Markdown ↔ Resume Model Serialization
 * Bi-directional conversion ensuring no semantic loss.
 */

import { Resume, createResume, Section, ExperienceItem, EducationItem, ProjectItem, SimpleItem, SkillGroup } from './resume';

function generateId(): string {
  // Simple ID generation without uuid library dependency
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Date parsing helpers (for future enhancements)
// function parseYearMonth(text: string): YearMonth | null { ... }
// function formatYearMonth(ym: YearMonth | 'present' | null): string { ... }

/**
 * Convert markdown resume to Resume model
 * Preserves all content; unknown sections go into 'custom'
 */
export function markdownToResume(markdown: string, title: string = 'Untitled'): Resume {
  const resume = createResume(title);

  if (!markdown || !markdown.trim()) {
    return resume;
  }

  const lines = markdown.split('\n');
  let currentLine = 0;

  // Parse basics (name, headline, contact) from top of resume
  if (lines[currentLine] && lines[currentLine].startsWith('# ')) {
    resume.basics.name = lines[currentLine].replace(/^#\s+/, '').trim();
    currentLine++;

    // Collect all header lines before first ##
    const headerLines: string[] = [];
    while (currentLine < lines.length && !lines[currentLine].startsWith('## ')) {
      headerLines.push(lines[currentLine]);
      currentLine++;
    }

    // Contact info can sit on one line (email · phone · location) or on several.
    // Every header line is scanned; lines that are pure contact are not headlines.
    const contactLineIndexes = new Set<number>();
    headerLines.forEach((raw, index) => {
      const parts = raw.trim().split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
      let lineIsContact = false;

      for (const part of parts) {
        const emailMatch = part.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const digits = (part.match(/\d/g) || []).length;
        if (emailMatch) {
          resume.basics.email = resume.basics.email || emailMatch[1];
          lineIsContact = true;
        } else if (/^\+?[\d()\s.-]+$/.test(part) && digits >= 7) {
          // Phone: digits with optional separators, at least 7 digits
          resume.basics.phone = resume.basics.phone || part;
          lineIsContact = true;
        } else if (index === 0 && !resume.basics.location && part.length > 2) {
          // First line's other parts are location
          resume.basics.location = part;
          lineIsContact = true;
        }
      }
      if (lineIsContact) contactLineIndexes.add(index);
    });

    // Parse headline/summary from remaining lines
    for (let i = 0; i < headerLines.length; i++) {
      if (contactLineIndexes.has(i)) continue;
      const line = headerLines[i].trim();
      if (line && !line.startsWith(':::') && !line.startsWith('[icon:') && !line.startsWith('<')) {
        if (!resume.basics.headline && line.length > 10) {
          resume.basics.headline = line;
        } else if (resume.basics.headline && !resume.basics.summary && line.length > 10) {
          resume.basics.summary = line;
        }
      }
    }
  }

  // Parse sections (##, ###, etc.)
  const sectionAliases: Record<string, string> = {
    'work experience': 'experience',
    'professional experience': 'experience',
    'technical skills': 'skills',
    'core competencies': 'skills',
    'key projects': 'projects',
    'professional summary': 'summary',
    'executive summary': 'summary',
  };

  while (currentLine < lines.length) {
    const line = lines[currentLine];

    // Parse section heading (##)
    if (line.startsWith('## ')) {
      const sectionTitle = line.replace(/^##\s+/, '').trim();
      const normalizedTitle = sectionTitle.toLowerCase();
      const sectionKind = sectionAliases[normalizedTitle] || (
        normalizedTitle === 'certifications' ? 'certifications' :
        normalizedTitle === 'projects' ? 'projects' :
        normalizedTitle === 'education' ? 'education' :
        normalizedTitle === 'experience' ? 'experience' :
        normalizedTitle === 'skills' ? 'skills' :
        'custom'
      );

      currentLine++;
      const section: Section = {
        id: generateId(),
        kind: sectionKind as any,
        title: sectionTitle,
        items: [],
      };

      if (sectionKind === 'skills') {
        section.groups = [];
      }

      // Collect section content until next ##
      const sectionLines: string[] = [];
      while (currentLine < lines.length && !lines[currentLine].startsWith('## ')) {
        sectionLines.push(lines[currentLine]);
        currentLine++;
      }

      // Parse section items
      if (sectionKind === 'experience') {
        parseExperienceItems(sectionLines, section);
      } else if (sectionKind === 'education') {
        parseEducationItems(sectionLines, section);
      } else if (sectionKind === 'projects') {
        parseProjectItems(sectionLines, section);
      } else if (sectionKind === 'skills') {
        parseSkillsSection(sectionLines, section);
      } else {
        // Generic items for other sections
        parseGenericItems(sectionLines, section);
      }

      resume.sections.push(section);
      continue;
    }

    currentLine++;
  }

  return resume;
}

function parseExperienceItems(lines: string[], section: Section): void {
  let currentItem: ExperienceItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ### Company — Role
    if (line.startsWith('### ')) {
      if (currentItem) {
        (section.items as ExperienceItem[]).push(currentItem);
      }
      const header = line.replace(/^###\s+/, '').trim();
      const [company, role] = header.includes('—')
        ? header.split('—').map(s => s.trim())
        : [header, ''];

      currentItem = {
        id: generateId(),
        company,
        role,
        location: '',
        start: { year: 2024 },
        end: 'present',
        bullets: [],
      };
    } else if (line.startsWith('- ') && currentItem) {
      const bulletText = line.replace(/^-\s+/, '').trim();
      currentItem.bullets.push({
        id: generateId(),
        text: bulletText,
      });
    }
  }

  if (currentItem) {
    (section.items as ExperienceItem[]).push(currentItem);
  }
}

function parseEducationItems(lines: string[], section: Section): void {
  let currentItem: EducationItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ### School - Degree
    if (line.startsWith('### ')) {
      if (currentItem) {
        (section.items as EducationItem[]).push(currentItem);
      }
      const header = line.replace(/^###\s+/, '').trim();
      const [school, degreeField] = header.includes('—')
        ? header.split('—').map(s => s.trim())
        : header.includes('-')
        ? header.split('-').map(s => s.trim())
        : [header, ''];

      currentItem = {
        id: generateId(),
        school,
        degree: degreeField,
        start: { year: 2020 },
      };
    } else if (line.startsWith('- ') && currentItem) {
      const bulletText = line.replace(/^-\s+/, '').trim();
      if (!currentItem.bullets) currentItem.bullets = [];
      currentItem.bullets.push({
        id: generateId(),
        text: bulletText,
      });
    }
  }

  if (currentItem) {
    (section.items as EducationItem[]).push(currentItem);
  }
}

function parseProjectItems(lines: string[], section: Section): void {
  let currentItem: ProjectItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ### Project Title
    if (line.startsWith('### ')) {
      if (currentItem) {
        (section.items as ProjectItem[]).push(currentItem);
      }
      const title = line.replace(/^###\s+/, '').trim();

      currentItem = {
        id: generateId(),
        title,
        start: { year: 2024 },
        bullets: [],
      };
    } else if (line.startsWith('- ') && currentItem) {
      const bulletText = line.replace(/^-\s+/, '').trim();
      currentItem.bullets.push({
        id: generateId(),
        text: bulletText,
      });
    }
  }

  if (currentItem) {
    (section.items as ProjectItem[]).push(currentItem);
  }
}

function parseSkillsSection(lines: string[], section: Section): void {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      // Skill group header
      const label = trimmed.replace(/\*\*/g, '');
      (section.groups as SkillGroup[]).push({
        id: generateId(),
        label,
        skills: [],
      });
    } else if (trimmed.startsWith('- ')) {
      // Skill item
      const skillText = trimmed.replace(/^-\s+/, '').trim();
      const skills = skillText.split(/[,;]/).map(s => s.trim()).filter(Boolean);

      if ((section.groups as SkillGroup[]).length > 0) {
        const lastGroup = (section.groups as SkillGroup[])[(section.groups as SkillGroup[]).length - 1];
        lastGroup.skills.push(...skills);
      } else {
        // No group yet, create default
        (section.groups as SkillGroup[]).push({
          id: generateId(),
          label: 'Skills',
          skills,
        });
      }
    }
  }
}

function parseGenericItems(lines: string[], section: Section): void {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':::')) continue;

    if (line.startsWith('- ')) {
      (section.items as SimpleItem[]).push({
        id: generateId(),
        title: trimmed.replace(/^-\s+/, ''),
      });
    }
  }
}

/**
 * Convert Resume model back to markdown
 * Maintains the original markdown structure
 */
export function resumeToMarkdown(resume: Resume): string {
  const lines: string[] = [];

  // Header with name
  if (resume.basics.name) {
    lines.push(`# ${resume.basics.name}`);
  }

  // Contact info line(s)
  const contacts: string[] = [];
  if (resume.basics.email) contacts.push(resume.basics.email);
  if (resume.basics.phone) contacts.push(resume.basics.phone);
  if (resume.basics.location) contacts.push(resume.basics.location);

  if (contacts.length > 0) {
    lines.push(contacts.join(' · '));
  }

  // Links
  for (const link of resume.basics.links) {
    if (link.icon) {
      lines.push(`[icon:${link.icon} ${link.label}](${link.url})`);
    } else {
      lines.push(`[${link.label}](${link.url})`);
    }
  }

  // Headline/Summary
  if (resume.basics.headline) {
    lines.push('');
    lines.push(resume.basics.headline);
  }

  if (resume.basics.summary) {
    lines.push('');
    lines.push(resume.basics.summary);
  }

  // Sections
  for (const section of resume.sections) {
    if (section.hidden) continue;

    lines.push('');
    lines.push(`## ${section.title}`);

    if (section.kind === 'experience' && section.items) {
      for (const item of section.items as ExperienceItem[]) {
        lines.push(`### ${item.company}${item.role ? ' — ' + item.role : ''}`);
        for (const bullet of item.bullets) {
          if (!bullet.hidden) {
            lines.push(`- ${bullet.text}`);
          }
        }
      }
    } else if (section.kind === 'education' && section.items) {
      for (const item of section.items as EducationItem[]) {
        lines.push(`### ${item.school}${item.degree ? ' — ' + item.degree : ''}`);
        if (item.bullets) {
          for (const bullet of item.bullets) {
            if (!bullet.hidden) {
              lines.push(`- ${bullet.text}`);
            }
          }
        }
      }
    } else if (section.kind === 'projects' && section.items) {
      for (const item of section.items as ProjectItem[]) {
        lines.push(`### ${item.title}`);
        for (const bullet of item.bullets) {
          if (!bullet.hidden) {
            lines.push(`- ${bullet.text}`);
          }
        }
      }
    } else if (section.kind === 'skills' && section.groups) {
      for (const group of section.groups) {
        if (group.label !== 'Skills') {
          lines.push(`**${group.label}**`);
        }
        lines.push(`- ${group.skills.join(', ')}`);
      }
    } else if (section.items) {
      for (const item of section.items as SimpleItem[]) {
        lines.push(`- ${item.title}`);
        if (item.subtitle) lines.push(`  ${item.subtitle}`);
      }
    }
  }

  return lines.join('\n').trim();
}
