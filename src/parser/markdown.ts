import MarkdownIt from 'markdown-it';
import MdContainer from 'markdown-it-container';
import { getIconSvg } from './iconMap';

// Initialize DOMPurify - in browser use window.DOMPurify, in tests use direct import
let DOMPurify: any = null;

// Check if we're in browser environment
if (typeof window !== 'undefined' && (window as any).DOMPurify) {
  DOMPurify = (window as any).DOMPurify;
} else {
  // For Node.js tests, we'll initialize it lazily when first needed
  DOMPurify = null;
}

// Lazy initialization for Node.js
function getDOMPurify(): any {
  if (DOMPurify) return DOMPurify;

  try {
    // Try to import DOMPurify with JSDOM support
    const purify = require('dompurify');
    const { JSDOM } = require('jsdom');
    const jsdom = new JSDOM('');
    DOMPurify = purify(jsdom.window);
    return DOMPurify;
  } catch (e) {
    // Fallback: return a no-op sanitizer
    return { sanitize: (html: string) => html };
  }
}

// Core markdown-it instance
export const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

// 1. Two-Column Layout Container Plugins
md.use(MdContainer as any, 'left', {
  render: function (tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<div class="resume-col resume-col-left">';
    } else {
      return '</div>';
    }
  },
});

md.use(MdContainer as any, 'right', {
  render: function (tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<div class="resume-col resume-col-right">';
    } else {
      return '</div>';
    }
  },
});

md.use(MdContainer as any, 'cols', {
  render: function (tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<div class="resume-columns">';
    } else {
      return '</div>';
    }
  },
});

// Manual Page Break Container Plugin
md.use(MdContainer as any, 'page-break', {
  render: function (tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<div class="manual-page-break"></div>';
    } else {
      return '';
    }
  },
});

md.use(MdContainer as any, 'pagebreak', {
  render: function (tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<div class="manual-page-break"></div>';
    } else {
      return '';
    }
  },
});

// 2. Custom Sectioning Plugin: Wraps ## H2 sections into <section class="resume-section">
function sectionPlugin(mdInstance: MarkdownIt) {
  mdInstance.core.ruler.push('wrap_sections', function (state) {
    const tokens = state.tokens;
    const newTokens: any[] = [];
    let inSection = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check for H2 open
      if (token.type === 'heading_open' && token.tag === 'h2') {
        if (inSection) {
          // Close prior section
          const closeToken = new state.Token('section_close', 'section', -1);
          newTokens.push(closeToken);
        }
        // Open new section
        const openToken = new state.Token('section_open', 'section', 1);
        openToken.attrJoin('class', 'resume-section');
        newTokens.push(openToken);
        inSection = true;
      }

      newTokens.push(token);
    }

    if (inSection) {
      const closeToken = new state.Token('section_close', 'section', -1);
      newTokens.push(closeToken);
    }

    state.tokens = newTokens;
    return true;
  });
}

md.use(sectionPlugin);

// 3. DOMPurify configuration: allow only safe resume classes and SVG icons
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'div',
    'section',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'b',
    'i',
    'a',
    'br',
    'span',
    'svg',
    'path',
    'circle',
    'line',
    'polyline',
    'polygon',
    'rect',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points', 'x', 'y', 'width', 'height'],
  KEEP_CONTENT: true,
} as const;

// 3. Post-processing for Icons, Tag Pills, and Links
export function parseResumeMarkdown(content: string): string {
  if (!content) return '';

  let processed = content;

  // 1. Pre-process manual page breaks (::: page-break :::, ::: pagebreak, ---page-break---, <!-- pagebreak -->)
  processed = processed.replace(
    /(?:::+|---|<!--)[ \t]*page[-]?break[ \t]*(?:::+|---|-->|\r?\n[ \t]*:::+)?/gi,
    '\n<div class="manual-page-break"></div>\n'
  );

  // 2. Strip explicit ::: cols or :::: cols wrappers if present
  processed = processed.replace(/^[ \t]*:{3,}[ \t]*cols[ \t]*$/gm, '');

  // 3. Transform paired ::: left and ::: right into a single .resume-columns wrapper
  processed = processed.replace(
    /:::[ \t]*left[ \t]*(?:\r?\n)([\s\S]*?)(?:\r?\n):::[ \t]*(?:\r?\n\s*)*:::[ \t]*right[ \t]*(?:\r?\n)([\s\S]*?)(?:\r?\n):::[ \t]*/g,
    '\n<div class="resume-columns">\n<div class="resume-col resume-col-left">\n\n$1\n\n</div>\n<div class="resume-col resume-col-right">\n\n$2\n\n</div>\n</div>\n'
  );

  // 4. Transform any standalone ::: left or ::: right blocks
  processed = processed.replace(
    /:::[ \t]*left[ \t]*(?:\r?\n)([\s\S]*?)(?:\r?\n):::[ \t]*/g,
    '\n<div class="resume-col resume-col-left">\n\n$1\n\n</div>\n'
  );
  processed = processed.replace(
    /:::[ \t]*right[ \t]*(?:\r?\n)([\s\S]*?)(?:\r?\n):::[ \t]*/g,
    '\n<div class="resume-col resume-col-right">\n\n$1\n\n</div>\n'
  );

  // 5. Clean up any remaining standalone container markers
  processed = processed.replace(/^[ \t]*:{3,}[ \t]*$/gm, '');

  // 6. Render raw HTML through markdown-it
  let html = md.render(processed);

  // 7. Transform [icon:name text](url) into rich clickable icon links
  html = html.replace(
    /<a\s+href="([^"]+)">\[icon:([a-zA-Z0-9_-]+)\s*([^\]]*)\]<\/a>/g,
    (_, href, iconName, text) => {
      const svg = getIconSvg(iconName);
      const label = text.trim() || href;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="resume-contact-link"><span class="icon-badge">${svg}</span><span class="link-label">${label}</span></a>`;
    }
  );

  // 8. Transform raw icon:name in text into inline SVG
  html = html.replace(/\bicon:([a-zA-Z0-9_-]+)\b/g, (_, iconName) => {
    const svg = getIconSvg(iconName);
    return `<span class="inline-icon-badge">${svg}</span>`;
  });

  // 9. Transform standard inline code tags `Tech` into skill pills
  html = html.replace(/<code>(.*?)<\/code>/g, '<span class="skill-pill">$1</span>');

  // 10. Clean up any leaked colons or empty paragraph wrappers
  html = html.replace(/<p>\s*:{3,}\s*<\/p>/g, '');
  html = html.replace(/::{3,}/g, '');

  // 11. Sanitize the HTML to prevent XSS attacks
  const purifier = getDOMPurify();
  const sanitized = purifier.sanitize(html, PURIFY_CONFIG as any) as string;

  return sanitized;
}
