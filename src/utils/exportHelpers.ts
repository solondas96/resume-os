/**
 * Trigger browser file download helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Text-based PDF export using native browser print dialog.
 * User prints to PDF via File > Save as PDF / "Print to File".
 * This ensures selectable text, proper ATS parsing, and no rasterization.
 */
export async function exportDirectPdf(
  element: HTMLElement | null,
  filename: string = 'Resume.pdf'
): Promise<boolean> {
  if (!element) {
    console.error('Target element for PDF export not found');
    return false;
  }

  // Store current page title
  const originalTitle = document.title;

  try {
    // Set the page title to the filename (shows in PDF metadata)
    document.title = filename.replace('.pdf', '');

    // Clone the sheet element so we can sanitize it without mutating the live UI
    const clone = element.cloneNode(true) as HTMLElement;

    // 1. Remove editor visual overlays (.page-break-indicator, .no-print)
    clone.querySelectorAll('.page-break-indicator, .no-print').forEach((el) => el.remove());

    // 2. Normalize styles on the clone to ensure exact 1:1 A4 canvas dimensions
    clone.style.boxShadow = 'none';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.transform = 'none';
    clone.style.width = '210mm';
    clone.style.minWidth = '210mm';
    clone.style.maxWidth = '210mm';
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = '#ffffff';

    // Copy CSS variables from original element
    const computed = window.getComputedStyle(element);
    const primaryColor = computed.getPropertyValue('--primary-color') || '#c96442';
    const primaryLight = computed.getPropertyValue('--primary-light') || '#f5e9e2';
    clone.style.setProperty('--primary-color', primaryColor);
    clone.style.setProperty('--primary-light', primaryLight);

    // 3. Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!doc) {
      throw new Error('Could not access iframe document');
    }

    // 4. Build complete HTML document with print-friendly styles
    const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.pdf', '')}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0;
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      background: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: #000;
    }

    .a4-sheet {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      page-break-after: always;
      background: #ffffff;
    }

    .a4-sheet:last-child {
      page-break-after: avoid;
    }

    .manual-page-break {
      page-break-after: always;
      display: none;
    }

    .no-print {
      display: none !important;
    }

    /* Preserve structure and text */
    section, div, p, ul, ol, li, h1, h2, h3, h4, h5, h6 {
      page-break-inside: avoid;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* SVG icons in print */
    svg {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: -0.125em;
    }

    @media print {
      body, html {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
      }

      .a4-sheet {
        margin: 0;
        padding: 0;
        box-shadow: none;
        border: none;
      }

      .no-print, .page-break-indicator {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>
    `;

    doc.open();
    doc.write(printHtml);
    doc.close();

    // 5. Wait for content to render, then print
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.print();
            setTimeout(() => {
              document.body.removeChild(printFrame);
              resolve(true);
            }, 100);
          } else {
            resolve(false);
          }
        } catch (err) {
          console.error('Print dialog error:', err);
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
          resolve(false);
        }
      }, 300);
    });
  } finally {
    document.title = originalTitle;
  }
}

/**
 * Clean plain-text converter for pasting into Applicant Tracking Systems (ATS)
 */
export function exportPlainText(markdown: string, filename: string = 'Resume.txt') {
  const cleanFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;

  let text = markdown;

  // Remove ::: container lines
  text = text.replace(/:::[a-zA-Z0-9_\-\s]*/g, '');

  // Convert markdown links [icon:name label](url) or [label](url) -> label (url)
  text = text.replace(/\[(?:icon:[a-zA-Z0-9_-]+\s*)?([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Convert icon:name tags
  text = text.replace(/icon:[a-zA-Z0-9_-]+/g, '');

  // Convert inline code tags `Skill` -> Skill
  text = text.replace(/`([^`]+)`/g, '$1');

  // Convert bold/italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');

  // Convert headers
  text = text.replace(/^#\s+(.+)$/gm, '\n==============================\n$1\n==============================\n');
  text = text.replace(/^##\s+(.+)$/gm, '\n--- $1 ---\n');
  text = text.replace(/^###\s+(.+)$/gm, '\n* $1');

  // Convert list markers
  text = text.replace(/^-\s+/gm, '• ');

  // Clean extra blank lines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  downloadFile(text, cleanFilename, 'text/plain;charset=utf-8');
}

/**
 * Standard JSON Resume format converter (schema.jsonresume.org)
 */
export function exportJsonResume(markdown: string, filename: string = 'resume.json') {
  const cleanFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

  const lines = markdown.split('\n');
  let name = '';
  let headline = '';
  const emailMatch = markdown.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = markdown.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  const linkedinMatch = markdown.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
  const githubMatch = markdown.match(/github\.com\/([a-zA-Z0-9_-]+)/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      name = line.replace('# ', '').trim();
    } else if (name && !headline && line && !line.startsWith(':') && !line.startsWith('[')) {
      headline = line;
      break;
    }
  }

  // Extract sections
  const sections: { title: string; content: string[] }[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines });
      }
      currentTitle = line.replace('## ', '').trim();
      currentLines = [];
    } else if (currentTitle) {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines });
  }

  // Construct JSON Resume schema object
  const jsonResume: Record<string, any> = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: name || 'Candidate',
      label: headline || 'Professional',
      email: emailMatch ? emailMatch[1] : '',
      phone: phoneMatch ? phoneMatch[1] : '',
      url: '',
      summary: '',
      location: {},
      profiles: [] as any[],
    },
    work: [] as any[],
    education: [] as any[],
    skills: [] as any[],
    projects: [] as any[],
  };

  if (linkedinMatch) {
    jsonResume.basics.profiles.push({
      network: 'LinkedIn',
      username: linkedinMatch[1],
      url: `https://linkedin.com/in/${linkedinMatch[1]}`,
    });
  }
  if (githubMatch) {
    jsonResume.basics.profiles.push({
      network: 'GitHub',
      username: githubMatch[1],
      url: `https://github.com/${githubMatch[1]}`,
    });
  }

  // Populate sections into JSON Resume schema
  for (const sec of sections) {
    const lower = sec.title.toLowerCase();
    const joined = sec.content.join('\n').trim();

    if (lower.includes('summary')) {
      jsonResume.basics.summary = joined;
    } else if (lower.includes('experience') || lower.includes('work')) {
      // Split experience blocks by ###
      const entries = joined.split(/###\s+/).filter(Boolean);
      for (const entry of entries) {
        const entryLines = entry.split('\n');
        const header = entryLines[0] || '';
        const [comp, role] = header.includes('—') ? header.split('—').map((s) => s.trim()) : [header, ''];
        const highlights = entryLines
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => l.replace(/^-\s*/, '').trim());

        jsonResume.work.push({
          name: comp || header,
          position: role || header,
          summary: '',
          highlights,
        });
      }
    } else if (lower.includes('education')) {
      const entries = joined.split(/###\s+/).filter(Boolean);
      for (const entry of entries) {
        const entryLines = entry.split('\n');
        const institution = entryLines[0] || '';
        const courses = entryLines
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => l.replace(/^-\s*/, '').trim());

        jsonResume.education.push({
          institution,
          area: '',
          studyType: '',
          courses,
        });
      }
    } else if (lower.includes('skill')) {
      const skillMatches = joined.match(/`([^`]+)`/g);
      if (skillMatches) {
        const keywords = skillMatches.map((s) => s.replace(/`/g, ''));
        jsonResume.skills.push({
          name: sec.title,
          keywords,
        });
      } else {
        jsonResume.skills.push({
          name: sec.title,
          keywords: [joined],
        });
      }
    } else if (lower.includes('project')) {
      const entries = joined.split(/###\s+/).filter(Boolean);
      for (const entry of entries) {
        const entryLines = entry.split('\n');
        const name = entryLines[0] || '';
        const highlights = entryLines
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => l.replace(/^-\s*/, '').trim());

        jsonResume.projects.push({
          name,
          description: '',
          highlights,
        });
      }
    }
  }

  downloadFile(JSON.stringify(jsonResume, null, 2), cleanFilename, 'application/json');
}
