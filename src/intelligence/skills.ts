/**
 * Skills dictionary with synonyms, and rule-based word normalisation.
 * Deterministic: lookup tables and suffix rules only.
 */

export interface SkillEntry {
  canonical: string;
  category: 'language' | 'framework' | 'cloud' | 'data' | 'tool' | 'practice' | 'design' | 'product';
  aliases: string[]; // lowercase synonyms and abbreviations, not including the canonical name
}

export const SKILLS: SkillEntry[] = [
  { canonical: 'JavaScript', category: 'language', aliases: ['js', 'es6', 'ecmascript'] },
  { canonical: 'TypeScript', category: 'language', aliases: ['ts'] },
  { canonical: 'Python', category: 'language', aliases: ['py'] },
  { canonical: 'Java', category: 'language', aliases: [] },
  { canonical: 'Go', category: 'language', aliases: ['golang'] },
  { canonical: 'Rust', category: 'language', aliases: [] },
  { canonical: 'C#', category: 'language', aliases: ['csharp', 'c sharp', 'dotnet c#'] },
  { canonical: 'C++', category: 'language', aliases: ['cpp'] },
  { canonical: 'SQL', category: 'language', aliases: ['structured query language'] },
  { canonical: 'Scala', category: 'language', aliases: [] },
  { canonical: 'Haskell', category: 'language', aliases: [] },
  { canonical: 'Ruby', category: 'language', aliases: [] },
  { canonical: 'Swift', category: 'language', aliases: [] },
  { canonical: 'Kotlin', category: 'language', aliases: [] },
  { canonical: 'React', category: 'framework', aliases: ['reactjs', 'react.js'] },
  { canonical: 'Next.js', category: 'framework', aliases: ['nextjs', 'next js'] },
  { canonical: 'Node.js', category: 'framework', aliases: ['nodejs', 'node', 'node js'] },
  { canonical: 'Vue', category: 'framework', aliases: ['vuejs', 'vue.js'] },
  { canonical: 'Angular', category: 'framework', aliases: ['angularjs'] },
  { canonical: 'Django', category: 'framework', aliases: [] },
  { canonical: 'Spring', category: 'framework', aliases: ['spring boot', 'springboot'] },
  { canonical: 'GraphQL', category: 'framework', aliases: ['graph ql'] },
  { canonical: 'REST APIs', category: 'framework', aliases: ['rest', 'restful', 'rest api', 'restful api'] },
  { canonical: 'Kubernetes', category: 'cloud', aliases: ['k8s', 'kube'] },
  { canonical: 'Docker', category: 'cloud', aliases: ['containers', 'containerization'] },
  { canonical: 'Terraform', category: 'cloud', aliases: ['tf', 'infrastructure as code', 'iac'] },
  { canonical: 'AWS', category: 'cloud', aliases: ['amazon web services'] },
  { canonical: 'GCP', category: 'cloud', aliases: ['google cloud', 'google cloud platform'] },
  { canonical: 'Azure', category: 'cloud', aliases: ['microsoft azure'] },
  { canonical: 'CI/CD', category: 'practice', aliases: ['ci cd', 'cicd', 'continuous integration', 'continuous delivery', 'continuous deployment'] },
  { canonical: 'PostgreSQL', category: 'data', aliases: ['postgres', 'psql'] },
  { canonical: 'MySQL', category: 'data', aliases: [] },
  { canonical: 'MongoDB', category: 'data', aliases: ['mongo'] },
  { canonical: 'Redis', category: 'data', aliases: [] },
  { canonical: 'Kafka', category: 'data', aliases: ['apache kafka'] },
  { canonical: 'Spark', category: 'data', aliases: ['apache spark', 'pyspark'] },
  { canonical: 'Airflow', category: 'data', aliases: ['apache airflow'] },
  { canonical: 'dbt', category: 'data', aliases: ['data build tool'] },
  { canonical: 'Snowflake', category: 'data', aliases: [] },
  { canonical: 'Databricks', category: 'data', aliases: [] },
  { canonical: 'Machine Learning', category: 'data', aliases: ['ml'] },
  { canonical: 'Data Analysis', category: 'data', aliases: ['data analytics', 'analytics'] },
  { canonical: 'Git', category: 'tool', aliases: ['github', 'gitlab', 'version control'] },
  { canonical: 'Jira', category: 'tool', aliases: [] },
  { canonical: 'Figma', category: 'design', aliases: [] },
  { canonical: 'User Research', category: 'design', aliases: ['user interviews', 'ux research'] },
  { canonical: 'Accessibility', category: 'design', aliases: ['a11y', 'wcag'] },
  { canonical: 'Agile', category: 'practice', aliases: ['scrum', 'kanban', 'agile methodology'] },
  { canonical: 'Product Management', category: 'product', aliases: ['product manager', 'product strategy'] },
  { canonical: 'Roadmapping', category: 'product', aliases: ['product roadmap', 'roadmap'] },
  { canonical: 'A/B Testing', category: 'product', aliases: ['ab testing', 'experimentation', 'split testing'] },
  { canonical: 'Stakeholder Management', category: 'product', aliases: ['stakeholders'] },
  { canonical: 'Testing', category: 'practice', aliases: ['unit testing', 'test automation', 'qa'] },
  { canonical: 'Observability', category: 'practice', aliases: ['monitoring', 'logging', 'tracing'] },
  { canonical: 'Distributed Systems', category: 'practice', aliases: ['distributed computing'] },
  { canonical: 'Microservices', category: 'practice', aliases: ['microservice', 'micro services', 'service oriented architecture'] },
  { canonical: 'Performance Optimization', category: 'practice', aliases: ['performance tuning', 'optimization'] },
  { canonical: 'Leadership', category: 'practice', aliases: ['people management'] },
];

/** Rule-based word normalisation: lowercase, strip punctuation, fold common suffixes */
export function stemWord(raw: string): string {
  let w = raw.toLowerCase().replace(/[^a-z0-9+#]/g, '');
  if (w.length <= 3) return w;
  // -ize / -ise / -ization / -isation / -izing ... all fold to "iz"
  w = w.replace(/(?:iz|is)(?:ation|ations|ing|ed|es|e)$/, 'iz').replace(/(?:iz|is)$/, 'iz');
  if (w.length > 5 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/** Alias (lowercase phrase) -> canonical name, longest phrases matched first */
const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const entry of SKILLS) {
  ALIAS_TO_CANONICAL.set(entry.canonical.toLowerCase(), entry.canonical);
  for (const alias of entry.aliases) ALIAS_TO_CANONICAL.set(alias.toLowerCase(), entry.canonical);
}
const PHRASES_LONGEST_FIRST = [...ALIAS_TO_CANONICAL.keys()].sort((a, b) => b.length - a.length);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Canonical skill for a single term (name or synonym), or null */
export function canonicalSkill(term: string): string | null {
  const key = term.toLowerCase().trim();
  if (ALIAS_TO_CANONICAL.has(key)) return ALIAS_TO_CANONICAL.get(key)!;
  // Try the stemmed form against stemmed aliases
  const stem = stemWord(key);
  for (const [alias, canonical] of ALIAS_TO_CANONICAL) {
    if (stemWord(alias) === stem && stem.length > 2) return canonical;
  }
  return null;
}

/** All canonical skills mentioned in a piece of text (deduplicated, in order of first mention) */
export function extractSkills(text: string): string[] {
  const lower = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
  const found: { canonical: string; index: number }[] = [];
  const masked = { text: lower };

  for (const phrase of PHRASES_LONGEST_FIRST) {
    const re = new RegExp(`(?<![a-z0-9+#])${escapeRe(phrase)}(?![a-z0-9+#])`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(masked.text)) !== null) {
      found.push({ canonical: ALIAS_TO_CANONICAL.get(phrase)!, index: m.index });
      // Mask the matched span so a shorter alias cannot match inside it
      masked.text = masked.text.slice(0, m.index) + ' '.repeat(phrase.length) + masked.text.slice(m.index + phrase.length);
    }
  }

  found.sort((a, b) => a.index - b.index);
  return [...new Set(found.map((f) => f.canonical))];
}
