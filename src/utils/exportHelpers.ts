import html2pdf from 'html2pdf.js';

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
 * Direct client-side PDF export using html2pdf.js
 * Renders the A4 canvas into high-DPI vector/canvas PDF without opening the system print dialog.
 */
export async function exportDirectPdf(
  element: HTMLElement | null,
  filename: string = 'Resume.pdf'
): Promise<boolean> {
  if (!element) {
    console.error('Target element for PDF export not found');
    return false;
  }

  // Ensure clean filename
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Clone the sheet element so we can sanitize it without mutating the live UI
  const clone = element.cloneNode(true) as HTMLElement;

  // 1. Remove editor visual overlays (.page-break-indicator, .no-print)
  clone.querySelectorAll('.page-break-indicator, .no-print').forEach((el) => el.remove());

  // 2. Normalize styles on the clone to ensure exact 1:1 A4 canvas dimensions
  clone.style.boxShadow = 'none';
  clone.style.margin = '0 auto';
  clone.style.transform = 'none';
  clone.style.width = '794px';
  clone.style.minWidth = '794px';
  clone.style.maxWidth = '794px';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';

  // Copy CSS variables from original element
  const computed = window.getComputedStyle(element);
  const primaryColor = computed.getPropertyValue('--primary-color') || '#c96442';
  const primaryLight = computed.getPropertyValue('--primary-light') || '#f5e9e2';
  clone.style.setProperty('--primary-color', primaryColor);
  clone.style.setProperty('--primary-light', primaryLight);

  // 3. Mount clone into a clean temporary container offscreen
  const container = document.createElement('div');
  container.id = 'pdf-export-temp-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-9999';
  container.appendChild(clone);
  document.body.appendChild(container);

  // 4. Configure html2pdf with zero margins (since .a4-sheet already has its own user-chosen padding)
  const opt = {
    margin: [0, 0, 0, 0] as [number, number, number, number],
    filename: cleanFilename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: false,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 794,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      avoid: ['.resume-section', 'h1', 'h2', 'h3'],
      before: '.manual-page-break',
    },
  };

  try {
    await html2pdf().set(opt).from(clone).save();
    return true;
  } catch (err) {
    console.error('Direct PDF export error:', err);
    return false;
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
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
