/**
 * Loads the generated skills dataset (public/data/skills.json) at runtime, from the app's own
 * static files. It is not part of the JavaScript bundle. Until it loads, the curated dictionary
 * is used, and the app keeps working if the file is missing.
 */

import { installSkillsDataset } from './skills';

let loading: Promise<boolean> | null = null;

/** Forget the cached load (tests) */
export function resetSkillsDataLoader(): void {
  loading = null;
}

/**
 * The core file, then the ESCO file if the build wrote one (it is only written when the full set is
 * over the size budget). A missing ESCO file is not an error.
 */
export function loadSkillsDataset(url = './data/skills.json', escoUrl = './data/skills-esco.json'): Promise<boolean> {
  if (!loading) {
    loading = fetch(url)
      .then(async (res) => {
        if (!res.ok) return false;
        const core = await res.json();
        const esco = await fetch(escoUrl)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null);
        installSkillsDataset(esco ? { skills: [...core.skills, ...esco.skills] } : core);
        return true;
      })
      .catch(() => false);
  }
  return loading;
}
