/**
 * Cover letter template generator
 * Generates structured cover letter template from resume + job info
 */

import { Resume } from '../model/resume';

export interface CoverLetterData {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  companyName: string;
  position: string;
  hiringManagerName?: string;
  date: string;
  topAchievements: string[]; // Top 3 from resume
  content: string; // Template with [PLACEHOLDER] tags
}

/**
 * Extract top achievements from resume for cover letter
 */
function extractTopAchievements(resume: Resume): string[] {
  const achievements: string[] = [];

  resume.sections.forEach((section) => {
    if (section.kind === 'experience' && section.items) {
      section.items.forEach((item: any) => {
        item.bullets?.slice(0, 2).forEach((bullet: any) => {
          if (bullet.text.length > 20) {
            achievements.push(bullet.text);
          }
        });
      });
    }
  });

  return achievements.slice(0, 3);
}

/**
 * Generate cover letter template
 */
export function generateCoverLetterTemplate(
  resume: Resume,
  companyName: string,
  position: string
): CoverLetterData {
  const achievements = extractTopAchievements(resume);

  const content = `[Date]

[Hiring Manager Name]
[Company Address]
[City, State ZIP]

Dear [Hiring Manager/Hiring Team],

I am writing to express my strong interest in the ${position} position at ${companyName}. With [X years] of experience in [industry/field] and a proven track record of [key achievement], I am confident in my ability to contribute meaningfully to your team.

In my current/previous role at [Company], I have demonstrated expertise in:
- ${achievements[0] || 'Key accomplishment 1'}
- ${achievements[1] || 'Key accomplishment 2'}
- ${achievements[2] || 'Key accomplishment 3'}

I am particularly drawn to ${companyName} because [research about company/why you're interested]. I am excited about the opportunity to [specific role responsibility] and believe my skills in [relevant skills] align well with your team's needs.

Thank you for considering my application. I would welcome the opportunity to discuss how I can contribute to ${companyName}'s continued success. Please feel free to contact me at [Phone Number] or [Email Address].

Sincerely,

[Your Name]
[Your Title]
[LinkedIn Profile URL]`;

  return {
    candidateName: resume.basics.name,
    candidateEmail: resume.basics.email || '[your@email.com]',
    candidatePhone: resume.basics.phone || '[Your Phone]',
    companyName,
    position,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    topAchievements: achievements,
    content,
  };
}

/**
 * Convert cover letter template to markdown for editing
 */
export function coverLetterToMarkdown(data: CoverLetterData): string {
  return `# Cover Letter

**To:** ${data.hiringManagerName || '[Hiring Manager]'}
**Company:** ${data.companyName}
**Position:** ${data.position}
**Date:** ${data.date}

---

${data.content}

---

**Contact Info:**
- Email: ${data.candidateEmail}
- Phone: ${data.candidatePhone}
`;
}

/**
 * Convert cover letter markdown back to data
 */
export function markdownToCoverLetter(markdown: string): Partial<CoverLetterData> {
  const emailMatch = markdown.match(/Email:\s*([^\n]+)/);
  const phoneMatch = markdown.match(/Phone:\s*([^\n]+)/);

  return {
    candidateEmail: emailMatch?.[1]?.trim(),
    candidatePhone: phoneMatch?.[1]?.trim(),
    content: markdown.replace(/# Cover Letter[\s\S]*?---\n/, '').replace(/---[\s\S]*?$/,''),
  };
}
