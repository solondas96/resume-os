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

/**
 * Tokens of a text: lowercase words (keeping + # . / inside, so "C++", "node.js", "CI/CD" stay whole),
 * each stemmed the same way as the dictionary, so lookups agree on both sides.
 */
export function tokensOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#./-]+/)
    .map((t) => t.replace(/[./-]+$/, ''))
    .filter(Boolean)
    .map(stemWord)
    .filter(Boolean);
}

const MAX_PHRASE_TOKENS = 6;

interface Index {
  /** stemmed phrase (tokens joined by a space) -> canonical name */
  phrases: Map<string, string>;
  maxTokens: number;
}

function buildIndex(entries: { canonical: string; aliases: string[] }[]): Index {
  const phrases = new Map<string, string>();
  let maxTokens = 1;
  const add = (phrase: string, canonical: string) => {
    const tokens = tokensOf(phrase);
    if (tokens.length === 0 || tokens.length > MAX_PHRASE_TOKENS) return;
    const k = tokens.join(' ');
    if (!phrases.has(k)) phrases.set(k, canonical); // the first source to name a phrase keeps it
    maxTokens = Math.max(maxTokens, tokens.length);
  };
  for (const e of entries) {
    add(e.canonical, e.canonical);
    for (const a of e.aliases) add(a, e.canonical);
  }
  return { phrases, maxTokens };
}

const curatedEntries = SKILLS.map((e) => ({ canonical: e.canonical, aliases: e.aliases }));
let index: Index = buildIndex(curatedEntries);

/**
 * Install the generated dataset (public/data/skills.json). The curated entries stay first,
 * so their names and synonyms always win. Safe to call more than once.
 */
export function installSkillsDataset(data: { skills: { c: string; a: string[] }[] }): void {
  index = buildIndex([
    ...curatedEntries,
    ...data.skills.map((s) => ({ canonical: s.c, aliases: s.a })),
  ]);
}

/** Back to the curated dictionary only (used by tests and when a dataset fails to load) */
export function resetSkillsDataset(): void {
  index = buildIndex(curatedEntries);
}

/** Canonical skill for a single term (name or synonym), or null */
export function canonicalSkill(term: string): string | null {
  const k = tokensOf(term).join(' ');
  return k ? index.phrases.get(k) ?? null : null;
}

/**
 * All canonical skills mentioned in a text, in order of first mention, without duplicates.
 * Longest phrase first, so "Spring Boot" is one skill and not "Spring" plus "Boot".
 */
export function extractSkills(text: string): string[] {
  const toks = tokensOf(text);
  const found: string[] = [];
  let i = 0;
  while (i < toks.length) {
    let matched = 0;
    const longest = Math.min(index.maxTokens, toks.length - i);
    for (let len = longest; len >= 1; len--) {
      const canonical = index.phrases.get(toks.slice(i, i + len).join(' '));
      if (canonical) {
        found.push(canonical);
        matched = len;
        break;
      }
    }
    i += matched > 0 ? matched : 1;
  }
  return [...new Set(found)];
}
