import MarkdownIt from 'markdown-it';
import MdContainer from 'markdown-it-container';
import { getIconSvg } from './iconMap';

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

// 3. Post-processing for Icons, Tag Pills, and Links
export function parseResumeMarkdown(content: string): string {
  if (!content) return '';

  // Pre-process: Automatically pair ::: left and ::: right into a .resume-columns wrapper if not already wrapped
  let processed = content.replace(
    /(:::\s*left[\s\S]*?:::\s*\n+)(:::\s*right[\s\S]*?:::)/g,
    '::: cols\n$1$2\n:::'
  );

  // Pre-process: Handle raw page breaks such as ---page-break--- or <!-- pagebreak -->
  processed = processed.replace(/(?:---|<!--)\s*page[-]?break\s*(?:---|-->)/gi, '\n::: page-break\n:::\n');

  // Render raw HTML through markdown-it
  let html = md.render(processed);

  // Transform [icon:name text](url) into rich clickable icon links
  html = html.replace(
    /<a\s+href="([^"]+)">\[icon:([a-zA-Z0-9_-]+)\s*([^\]]*)\]<\/a>/g,
    (_, href, iconName, text) => {
      const svg = getIconSvg(iconName);
      const label = text.trim() || href;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="resume-contact-link"><span class="icon-badge">${svg}</span><span class="link-label">${label}</span></a>`;
    }
  );

  // Transform raw icon:name in text into inline SVG
  html = html.replace(/\bicon:([a-zA-Z0-9_-]+)\b/g, (_, iconName) => {
    const svg = getIconSvg(iconName);
    return `<span class="inline-icon-badge">${svg}</span>`;
  });

  // Transform standard inline code tags `Tech` into skill pills
  html = html.replace(/<code>(.*?)<\/code>/g, '<span class="skill-pill">$1</span>');

  return html;
}
