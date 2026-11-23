/**
 * Loads the generated skills dataset (public/data/skills.json) at runtime, from the app's own
 * static files. It is not part of the JavaScript bundle. Until it loads, the curated dictionary
 * is used, and the app keeps working if the file is missing.
 */

import { installSkillsDataset } from './skills';

let loading: Promise<boolean> | null = null;

export function loadSkillsDataset(url = './data/skills.json'): Promise<boolean> {
  if (!loading) {
    loading = fetch(url)
      .then(async (res) => {
        if (!res.ok) return false;
        installSkillsDataset(await res.json());
        return true;
      })
      .catch(() => false);
  }
  return loading;
}
