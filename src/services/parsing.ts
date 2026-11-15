export interface ParsedResumeSection {
  name: string;
  content: string[];
}

export interface ParsedResume {
  summary: string;
  experienceYears?: number;
  skills: string[];
  sections: ParsedResumeSection[];
  rawText: string;
}

// Broad skills taxonomy covering data, cloud, engineering, AI/ML, product & design
export const SKILLS_TAXONOMY: string[] = [
  'PySpark',
  'Databricks',
  'Snowflake',
  'Kafka',
  'Delta Lake',
  'Airflow',
  'dbt',
  'Azure',
  'Power BI',
  'Palantir Foundry',
  'RAG',
  'LLM',
  'Python',
  'SQL',
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'Redis',
  'Go',
  'AWS',
  'GCP',
  'Git',
  'CI/CD',
  'Terraform',
  'GraphQL',
  'Java',
  'C++',
  'Rust',
  'Spark',
  'Hadoop',
  'BigQuery',
  'Redshift',
  'MongoDB',
  'Elasticsearch',
  'Tableau',
  'Looker',
  'UI/UX',
  'Product Management',
  'Figma',
  'User Research',
  'A/B Testing',
  'Wireframing',
  'Design Systems',
  'Agile',
  'Scrum',
];

const SECTION_ALIASES: Record<string, string> = {
  'work experience': 'Experience',
  'professional experience': 'Experience',
  experience: 'Experience',
  'technical skills': 'Skills',
  skills: 'Skills',
  'core competencies': 'Skills',
  education: 'Education',
  projects: 'Projects',
  'key projects': 'Projects',
  summary: 'Summary',
  'professional summary': 'Summary',
  'executive summary': 'Summary',
  certifications: 'Certifications',
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts explicit years of experience (e.g. "6 years of experience", "10+ years of total experience")
 * and returns the maximum found.
 */
function extractExperienceYears(text: string): number | undefined {
  const pattern = /\b(\d+)\+?\s*(?:years|yrs)(?:\s+of)?(?:\s+total)?\s+experience\b/gi;
  let maxYears = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const years = parseInt(match[1], 10);
    if (!isNaN(years) && years > maxYears) {
      maxYears = years;
    }
  }

  return maxYears > 0 ? maxYears : undefined;
}

/**
 * Extracts matching skills from text in order of first appearance.
 * Matches whole tokens only, supports multi-word terms.
 */
function extractSkills(text: string): string[] {
  const found: Array<{ skill: string; index: number }> = [];

  for (const skill of SKILLS_TAXONOMY) {
    const escaped = escapeRegex(skill);
    // Boundary check that works for words and special symbols like C++, CI/CD, Next.js
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'gi');
    const match = regex.exec(text);
    if (match) {
      // Find the actual start index of the matched skill
      const idx = match.index + (match[0].toLowerCase().indexOf(skill.toLowerCase()));
      found.push({ skill, index: idx });
    }
  }

  // Sort by first appearance in text
  found.sort((a, b) => a.index - b.index);

  // Deduplicate
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of found) {
    const lower = item.skill.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item.skill);
    }
  }

  return result;
}

export function parseResume(rawText: string): ParsedResume {
  if (!rawText || !rawText.trim()) {
    return {
      summary: 'Resume content parsed successfully.',
      experienceYears: undefined,
      skills: [],
      sections: [],
      rawText: rawText || '',
    };
  }

  // Normalize line by line (preserve newlines, trim trailing whitespace)
  const normalizedText = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join('\n');

  const lines = normalizedText.split('\n');

  // Find headings and collect sections
  const sectionMap = new Map<string, string[]>();
  let currentSection = '';
  const preHeadingLines: string[] = [];
  let foundFirstHeading = false;

  for (const line of lines) {
    if (!line) continue;

    const trimmed = line.replace(/^#+\s*/, '').trim();
    const isHeadingCandidate =
      line.startsWith('#') ||
      line.endsWith(':') ||
      SECTION_ALIASES[trimmed.toLowerCase()] !== undefined;

    let matchedCanonical: string | undefined;

    if (isHeadingCandidate) {
      const cleanCandidate = trimmed.replace(/:$/, '').trim().toLowerCase();
      if (SECTION_ALIASES[cleanCandidate]) {
        matchedCanonical = SECTION_ALIASES[cleanCandidate];
      }
    }

    if (matchedCanonical) {
      foundFirstHeading = true;
      currentSection = matchedCanonical;
      if (!sectionMap.has(currentSection)) {
        sectionMap.set(currentSection, []);
      }
      continue;
    }

    if (!foundFirstHeading) {
      preHeadingLines.push(line);
    } else if (currentSection) {
      const existing = sectionMap.get(currentSection) || [];
      existing.push(line);
      sectionMap.set(currentSection, existing);
    }
  }

  // Extract Summary: use the first sentence before the first heading that has at least 4 words
  let summary = '';
  const candidateSentences: string[] = [];

  for (const line of preHeadingLines) {
    // Split line into sentences if it contains multiple sentences
    const sents = line
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    candidateSentences.push(...sents);
  }

  for (const s of candidateSentences) {
    const wordCount = s.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 4) {
      summary = s;
      break;
    }
  }

  // Fallback: check Summary section
  if (!summary && sectionMap.has('Summary')) {
    const summaryLines = sectionMap.get('Summary') || [];
    const joined = summaryLines.join(' ');
    if (joined.trim()) {
      summary = joined.trim();
    }
  }

  // Fallback: first sentence anywhere or default message
  if (!summary) {
    summary = candidateSentences[0] || 'Resume content parsed successfully.';
  }

  // Build ParsedResumeSection array
  const sections: ParsedResumeSection[] = [];
  for (const [name, rawLines] of sectionMap.entries()) {
    const content: string[] = [];
    const isSkills = name.toLowerCase() === 'skills';

    for (const rawLine of rawLines) {
      if (isSkills) {
        // Split skills on commas, semicolons, and bullets
        const tokens = rawLine
          .split(/[,;•*]/)
          .map((t) => t.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean);
        for (const token of tokens) {
          if (token && !content.includes(token)) {
            content.push(token);
          }
        }
      } else {
        // Split on lines and bullets
        const tokens = rawLine
          .split(/[•*]/)
          .map((t) => t.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean);
        for (const token of tokens) {
          if (token) {
            content.push(token);
          }
        }
      }
    }

    sections.push({
      name,
      content,
    });
  }

  const experienceYears = extractExperienceYears(rawText);
  const skills = extractSkills(rawText);

  return {
    summary,
    experienceYears,
    skills,
    sections,
    rawText,
  };
}
