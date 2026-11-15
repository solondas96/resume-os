import { describe, it, expect } from 'vitest';
import { analyzeBullets, quickFixBulletVerb } from '../utils/bulletLinter';
import { encodeResumeForShare, decodeSharedResume } from '../utils/shareResume';
import { parseResumeMarkdown } from '../parser/markdown';
import { SAMPLE_RESUME } from '../data/sampleResume';
import { SAMPLE_COVER_LETTER } from '../data/sampleCoverLetter';
import { TEMPLATES } from '../data/templates';

describe('New Features Test Suite', () => {
  describe('Bullet Point Linter & XYZ Impact Scorer', () => {
    it('accurately identifies strong action verbs and quantifiable metrics', () => {
      const sampleText = `
## Experience
### Stripe — Staff Software Engineer
- Spearheaded the architectural redesign of the core merchant settlement pipeline, processing **$12B+ in annualized volume**.
- Reduced p99 payment processing latency by **42% (280ms to 162ms)** by transitioning to gRPC.
- Mentored 12 senior engineers across 4 squads.
`;
      const result = analyzeBullets(sampleText);
      expect(result.totalBullets).toBe(3);
      expect(result.strongBullets).toBe(3);
      expect(result.metricsBullets).toBe(3);
      expect(result.weakVerbBullets).toBe(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(85);
    });

    it('flags weak passive verbs and suggests strong action verbs', () => {
      const weakText = `
## Experience
- Worked on settlement pipeline bugs.
- Helped with database migrations.
- Responsible for writing unit tests.
`;
      const result = analyzeBullets(weakText);
      expect(result.totalBullets).toBe(3);
      expect(result.weakVerbBullets).toBe(3);
      expect(result.bullets[0].weakVerb).toBe('worked on');
      expect(result.bullets[0].suggestedVerb).toBe('Engineered');
      expect(result.bullets[1].weakVerb).toBe('helped with');
      expect(result.bullets[2].weakVerb).toBe('responsible for');
    });

    it('replaces weak verbs accurately in markdown source', () => {
      const original = '- Worked on the transaction caching layer.';
      const updated = quickFixBulletVerb(original, original, 'worked on', 'Engineered');
      expect(updated).toBe('- Engineered the transaction caching layer.');
    });
  });

  describe('Shareable Web Resume Encoding & Decoding', () => {
    it('encodes and decodes resume state losslessly', () => {
      const source = {
        title: 'Jane Doe - Staff Architect',
        markdown: '# Jane Doe\nStaff Architect\n- Architected high-scale platform.',
        theme: 'swiss' as const,
        accentColor: '#c96442',
        fontSize: 'medium' as const,
        marginSize: 'normal' as const,
        lineHeight: 'tight' as const,
      };

      const encoded = encodeResumeForShare(source);
      expect(encoded).toBeTypeOf('string');
      expect(encoded.length).toBeGreaterThan(20);

      const decoded = decodeSharedResume(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded?.title).toBe(source.title);
      expect(decoded?.markdown).toBe(source.markdown);
      expect(decoded?.theme).toBe(source.theme);
      expect(decoded?.accentColor).toBe(source.accentColor);
      expect(decoded?.fontSize).toBe(source.fontSize);
      expect(decoded?.lineHeight).toBe(source.lineHeight);
    });

    it('returns null on invalid share code without throwing', () => {
      const invalid = decodeSharedResume('invalid---garbage---string');
      expect(invalid).toBeNull();
    });
  });

  describe('Swiss Editorial and Academic CV Templates', () => {
    it('registers swiss and academic templates in template registry', () => {
      const swiss = TEMPLATES.find((t) => t.id === 'swiss');
      const academic = TEMPLATES.find((t) => t.id === 'academic');
      expect(swiss).toBeDefined();
      expect(swiss?.name).toBe('Swiss Editorial');
      expect(academic).toBeDefined();
      expect(academic?.name).toBe('Academic CV');
    });

    it('renders resume with all templates cleanly without layout breakage', () => {
      const html = parseResumeMarkdown(SAMPLE_RESUME);
      expect(html).not.toContain(':::');
      expect(html).toContain('class="resume-columns"');
      expect(html).toContain('class="resume-col resume-col-left"');
      expect(html).toContain('class="resume-col resume-col-right"');
    });

    it('renders cover letter markdown with contact headers and structure', () => {
      const html = parseResumeMarkdown(SAMPLE_COVER_LETTER);
      expect(html).not.toContain(':::');
      expect(html).toContain('class="resume-columns"');
      expect(html).toContain('alex.morgan@example.com');
      expect(html).toContain('Application for Staff Software Engineer');
    });
  });
});
