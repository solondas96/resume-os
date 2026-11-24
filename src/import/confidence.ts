/**
 * How much to trust an import, from the parsed resume alone (no model, no guessing about the file).
 * The rules are plain counts, so the reasons can be shown to the user in words:
 *
 *   high    the name, a contact detail and two or more sections were found, almost every line was
 *           placed, and every job has dates and bullets
 *   low     no name, no sections, more than 30% of lines unplaced, or most jobs have no dates
 *   medium  everything else: the parts are there, but something needs checking
 */

import { Resume, ExperienceItem, sectionItems } from '../model/resume';

export type ImportConfidence = 'high' | 'medium' | 'low';

export interface ConfidenceReport {
  level: ImportConfidence;
  /** One plain sentence per problem found, in the order they matter most */
  reasons: string[];
  facts: {
    name: boolean;
    contact: boolean;
    sections: number;
    unsortedShare: number;
    roles: number;
    rolesWithoutDates: number;
    rolesWithoutBullets: number;
  };
}

/** Counts for the rules. `unsorted` is the number of lines the parser could not place; `lines` is every line read */
export function importConfidence(resume: Resume, input: { unsorted: number; lines: number }): ConfidenceReport {
  const roles = resume.sections
    .filter((s) => s.kind === 'experience')
    .flatMap((s) => sectionItems(s) as ExperienceItem[]);
  const rolesWithoutDates = roles.filter((r) => !r.start).length;
  const rolesWithoutBullets = roles.filter((r) => r.bullets.length === 0).length;
  const unsortedShare = input.lines > 0 ? input.unsorted / input.lines : 0;
  const name = resume.basics.name.trim().length > 0;
  const contact = !!(resume.basics.email || resume.basics.phone);
  const sections = resume.sections.length;

  const reasons: string[] = [];
  if (!name) reasons.push('We could not find a name at the top.');
  if (!contact) reasons.push('We could not find an email address or phone number.');
  if (sections === 0) reasons.push('We could not find any section headings.');
  else if (sections === 1) reasons.push('We found only one section.');
  if (input.unsorted > 0) {
    reasons.push(`${input.unsorted} ${input.unsorted === 1 ? 'line is' : 'lines are'} not in a section yet.`);
  }
  if (rolesWithoutDates > 0) {
    reasons.push(`${rolesWithoutDates} of ${roles.length} ${roles.length === 1 ? 'job has' : 'jobs have'} no dates.`);
  }
  if (rolesWithoutBullets > 0) {
    reasons.push(`${rolesWithoutBullets} of ${roles.length} ${roles.length === 1 ? 'job has' : 'jobs have'} no bullet points.`);
  }

  const low =
    !name ||
    sections === 0 ||
    unsortedShare > 0.3 ||
    (roles.length > 0 && rolesWithoutDates / roles.length > 0.5);
  const high =
    name && contact && sections >= 2 && unsortedShare <= 0.05 && rolesWithoutDates === 0 && rolesWithoutBullets === 0;
  const level: ImportConfidence = low ? 'low' : high ? 'high' : 'medium';

  return {
    level,
    reasons: level === 'high' ? [] : reasons,
    facts: { name, contact, sections, unsortedShare, roles: roles.length, rolesWithoutDates, rolesWithoutBullets },
  };
}
