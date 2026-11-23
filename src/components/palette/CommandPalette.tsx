import React, { useState, useEffect, useRef } from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { TEMPLATES, ACCENT_COLORS } from '../../data/templates';
import { exportDirectPdf, exportPlainText, exportJsonResume } from '../../utils/exportHelpers';
import { useModelMarkdown } from '../../store/useModelMarkdown';
import { downloadBundle } from '../../services/exportBundle';
import {
  Search,
  Layout,
  Sliders,
  FileText,
  Printer,
  Upload,
  History,
  Sun,
  Moon,
  Columns,
  PlusCircle,
  HelpCircle,
  Target,
  Sparkles,
  Download,
  FileCode,
  FileSpreadsheet,
  FolderGit2,
  Share2,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommandItem {
  id: string;
  category: 'Design' | 'Export' | 'AI' | 'Appearance' | 'Sections' | 'Help';
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC = () => {
  const modelMarkdown = useModelMarkdown();
  const markdown = useResumeStoreV2((s) => s.markdown); // editor text, for inserting sections
  const {
    currentResume,
    pageSize,
    resumes,
    coverLetterMarkdown,
    applications,
    commandPaletteOpen,
    setCommandPaletteOpen,
    setTheme,
    setAccentColor,
    compactSpacing,
    setCompactSpacing,
    onePageMode,
    setOnePageMode,
    uiTheme,
    toggleUiTheme,
    setActiveModal,
    
    setMarkdown,
    saveRevision,
    editorViewMode,
    setEditorViewMode,
    setLibraryModalOpen,
    setShareModalOpen,
    workspaceMode,
    setWorkspaceMode,
    openInspector,
    fitToOnePage
  } = useResumeStoreV2();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape or open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const insertSectionAtEnd = (title: string, sampleContent: string) => {
    setMarkdown(markdown.trim() + `\n\n## ${title}\n` + sampleContent);
  };

  const commands: CommandItem[] = [
    // Export & Print
    {
      id: 'direct-pdf',
      category: 'Export',
      title: '1-Click Direct Download PDF',
      description: 'Download high-DPI A4 PDF directly in the browser',
      icon: <Download className="w-4 h-4 text-blue-400" />,
      action: async () => {
        saveRevision('Pre-export save');
        const target = document.querySelector('.a4-sheet') as HTMLElement;
        const success = await exportDirectPdf(target, 'resume.pdf');
        if (success) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.1 } });
        }
      },
      keywords: ['export', 'pdf', 'download', 'direct', 'instant'],
    },
    {
      id: 'print-pdf',
      category: 'Export',
      title: 'Print / Save as Vector PDF',
      description: 'Trigger browser print dialog with @page vector CSS',
      icon: <Printer className="w-4 h-4 text-blue-400" />,
      action: () => {
        saveRevision('Pre-print save');
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.1 } });
        window.print();
      },
      keywords: ['export', 'pdf', 'download', 'print'],
    },
    {
      id: 'export-txt',
      category: 'Export',
      title: 'Export Plain Text (.txt for ATS)',
      description: 'Clean formatted plain text without markdown symbols',
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      action: () => exportPlainText(modelMarkdown, 'resume.txt'),
      keywords: ['txt', 'text', 'ats', 'plain', 'export'],
    },
    {
      id: 'export-json',
      category: 'Export',
      title: 'Export JSON Resume Schema (.json)',
      description: 'Export structured resume data per schema.jsonresume.org',
      icon: <FileSpreadsheet className="w-4 h-4 text-purple-400" />,
      action: () => exportJsonResume(modelMarkdown, 'resume.json'),
      keywords: ['json', 'resume', 'schema', 'export', 'data'],
    },
    {
      id: 'export-bundle',
      category: 'Export',
      title: 'Export Bundle (.zip): resume and cover letter PDFs, text, backup',
      description: 'One zip with PDFs, plain text, Markdown and a full backup. Nothing is uploaded.',
      icon: <FileSpreadsheet className="w-4 h-4 text-purple-400" />,
      action: () =>
        downloadBundle(
          {
            resume: currentResume!,
            allResumes: resumes,
            coverLetterMarkdown,
            applications,
          },
          pageSize
        ),
      keywords: ['bundle', 'zip', 'backup', 'export', 'all', 'download'],
    },
    {
      id: 'resume-library',
      category: 'Sections',
      title: 'Open Resume Library',
      description: 'Switch between tailored resumes, clone, or create new versions',
      icon: <FolderGit2 className="w-4 h-4 text-brand-text" />,
      action: () => setLibraryModalOpen(true),
      keywords: ['library', 'resumes', 'profiles', 'switch', 'clone', 'duplicate'],
    },
    {
      id: 'job-match-side',
      category: 'AI',
      title: 'Open Job Match Panel',
      description: 'Score this resume against a job posting, then tailor a copy or track it',
      icon: <Target className="w-4 h-4 text-brand-text" />,
      action: () => openInspector('match'),
      keywords: ['match', 'tailor', 'job', 'side', 'keywords', 'ats', 'score'],
    },
    {
      id: 'bullet-linter-side',
      category: 'AI',
      title: 'Open Inspector (Health & Bullet Linter)',
      description: 'Resume health breakdown, bullet verbs, metrics and impact scores',
      icon: <Sparkles className="w-4 h-4 text-brand-text" />,
      action: () => openInspector('health'),
      keywords: ['inspector', 'health', 'linter', 'bullets', 'verbs', 'star', 'impact', 'audit'],
    },
    {
      id: 'share-resume-web',
      category: 'Export',
      title: 'Share Web Resume (Recruiter Link)',
      description: 'Generate private client-side URL link to share with recruiters',
      icon: <Share2 className="w-4 h-4 text-brand-text" />,
      action: () => setShareModalOpen(true),
      keywords: ['share', 'link', 'url', 'recruiter', 'public', 'portfolio'],
    },
    {
      id: 'auto-fit-onepage',
      category: 'Design',
      title: 'Auto-Fit Content to Exactly 1 Page',
      description: 'Intelligently optimize margins, line height and font scale to fit on 1 page',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => fitToOnePage(),
      keywords: ['autofit', 'fit', '1-page', 'one page', 'shrink', 'compact'],
    },
    {
      id: 'toggle-workspace-mode',
      category: 'Sections',
      title: `Switch Workspace to ${workspaceMode === 'resume' ? 'Cover Letter' : 'Resume'}`,
      description: 'Toggle between Resume and matching Cover Letter companion',
      icon: <Mail className="w-4 h-4 text-blue-400" />,
      action: () => setWorkspaceMode(workspaceMode === 'resume' ? 'cover-letter' : 'resume'),
      keywords: ['cover letter', 'letter', 'mode', 'switch', 'resume'],
    },
    {
      id: 'tracker-open',
      category: 'AI',
      title: 'Open Application Tracker',
      description: 'Track applications, statuses and conversion',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      action: () => setActiveModal('tracker'),
      keywords: ['tracker', 'applications', 'jobs', 'status', 'interview', 'offer'],
    },
    {
      id: 'cover-letter-generate',
      category: 'AI',
      title: 'Generate Cover Letter',
      description: 'Build a cover letter template from your resume and a company and role',
      icon: <Sparkles className="w-4 h-4 text-brand-text" />,
      action: () => setActiveModal('cover-letter'),
      keywords: ['cover', 'letter', 'generate', 'template', 'application'],
    },
    {
      id: 'role-presets',
      category: 'Design',
      title: 'Browse Starter Role Presets',
      description: 'Load pre-built templates for SWE, Product Designer, PM, or New Grad',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />,
      action: () => setActiveModal('presets'),
      keywords: ['presets', 'templates', 'starter', 'roles', 'sample'],
    },
    {
      id: 'download-md',
      category: 'Export',
      title: 'Download Markdown (.md)',
      description: 'Export local source markdown file',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      action: () => {
        const blob = new Blob([modelMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.md';
        a.click();
        URL.revokeObjectURL(url);
      },
      keywords: ['markdown', 'export', 'download', 'source'],
    },
    {
      id: 'import-md',
      category: 'Export',
      title: 'Import Markdown File',
      description: 'Upload an existing .md file or paste text',
      icon: <Upload className="w-4 h-4 text-purple-400" />,
      action: () => setActiveModal('import'),
      keywords: ['import', 'upload', 'load'],
    },
    {
      id: 'history',
      category: 'Export',
      title: 'View Revision History',
      description: 'Go back to a saved version of this resume',
      icon: <History className="w-4 h-4 text-amber-400" />,
      action: () => openInspector('history'),
      keywords: ['undo', 'history', 'revisions', 'restore', 'versions', 'snapshots'],
    },

    // Appearance & Views
    {
      id: 'toggle-theme',
      category: 'Appearance',
      title: `Switch to ${uiTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle application chrome theme',
      icon: uiTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => toggleUiTheme(),
      keywords: ['theme', 'dark', 'light', 'mode'],
    },
    {
      id: 'toggle-view-mode',
      category: 'Appearance',
      title: `Switch to ${editorViewMode === 'markdown' ? 'Form Editor' : 'Advanced Markdown View'}`,
      description: 'Toggle between code editor and structured card editor',
      icon: <Columns className="w-4 h-4 text-blue-400" />,
      action: () => setEditorViewMode(editorViewMode === 'markdown' ? 'form' : 'markdown'),
      keywords: ['form', 'cards', 'view', 'sections', 'toggle', 'editor', 'markdown'],
    },

    // Layout & Density
    {
      id: 'toggle-compact',
      category: 'Design',
      title: `Toggle Compact Spacing (${compactSpacing ? 'Currently On' : 'Currently Off'})`,
      description: 'Tighten line-height and margins to fit on fewer pages',
      icon: <Sliders className="w-4 h-4 text-blue-400" />,
      action: () => setCompactSpacing(!compactSpacing),
      keywords: ['density', 'compact', 'spacing', 'tight', 'margin'],
    },
    {
      id: 'toggle-onepage',
      category: 'Design',
      title: `Toggle 1-Page Fit Mode (${onePageMode ? 'Currently On' : 'Currently Off'})`,
      description: 'Lock canvas strictly to 1123px A4 height',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      action: () => setOnePageMode(!onePageMode),
      keywords: ['1-page', 'one page', 'clamp', 'fit'],
    },

    // Templates
    ...TEMPLATES.map((tmpl) => ({
      id: `tmpl-${tmpl.id}`,
      category: 'Design' as const,
      title: `Template: ${tmpl.name}`,
      description: tmpl.description,
      icon: <Layout className="w-4 h-4 text-blue-400" />,
      action: () => setTheme(tmpl.id),
      keywords: ['template', tmpl.name.toLowerCase(), tmpl.id],
    })),

    // Accent Colors
    ...ACCENT_COLORS.map((col) => ({
      id: `color-${col.id}`,
      category: 'Design' as const,
      title: `Accent Color: ${col.name}`,
      description: `Apply ${col.hex} to titles, dividers, and skill chips`,
      icon: <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: col.hex }} />,
      action: () => setAccentColor(col.hex),
      keywords: ['color', col.name.toLowerCase(), col.hex],
    })),

    // Insert Sections
    {
      id: 'insert-exp',
      category: 'Sections',
      title: 'Insert Work Experience Section',
      description: 'Add a new company, title, dates, and STAR bullet template',
      icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
      action: () =>
        insertSectionAtEnd(
          'Work Experience',
          '\n### Company Name — Senior Role\n*Location* | *2022 – Present*\n\n`Skill 1` `Skill 2`\n\n- Spearheaded [initiative], delivering [X% measurable outcome] by [action].\n- Engineered [system], scaling throughput from [X] to [Y].\n'
        ),
      keywords: ['experience', 'work', 'job', 'insert', 'add'],
    },
    {
      id: 'insert-projects',
      category: 'Sections',
      title: 'Insert Key Projects Section',
      description: 'Add open source or product achievements',
      icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
      action: () =>
        insertSectionAtEnd(
          'Key Projects',
          '\n### Project Name — Title\n*Role* | [icon:github github.com/user/repo](https://github.com)\n\n- Built [product description] solving [problem].\n'
        ),
      keywords: ['projects', 'portfolio', 'insert'],
    },
    {
      id: 'insert-edu',
      category: 'Sections',
      title: 'Insert Education Section',
      description: 'Add university, degree, graduation year, and GPA',
      icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
      action: () =>
        insertSectionAtEnd(
          'Education',
          '\n### University of California, Berkeley\n*Bachelor of Science in Computer Science* | *2018 – 2022*\n- Graduated with Honors (GPA: 3.8/4.0)\n'
        ),
      keywords: ['education', 'degree', 'university', 'school'],
    },

    // Help
    {
      id: 'help-shortcuts',
      category: 'Help',
      title: 'Markdown & Icon Syntax Guide',
      description: 'View cheat-sheet for two-column headers and icon badges',
      icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
      action: () => setActiveModal('shortcuts'),
      keywords: ['help', 'shortcuts', 'syntax', 'icons', 'guide'],
    },
  ];

  // Filter commands by query
  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.description && cmd.description.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.includes(q))
    );
  });

  const handleSelect = (cmd: CommandItem) => {
    setCommandPaletteOpen(false);
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-24 p-4 select-none animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl max-w-xl w-full shadow-lifted overflow-hidden flex flex-col max-h-[70vh] transition-colors duration-150"
      >
        {/* Search Input Bar */}
        <div className="h-13 px-4 border-b border-border flex items-center gap-3 bg-card">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search (e.g. 'pdf', 'template', 'compact', 'star')..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="overflow-y-auto p-2 flex-1 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found for "{query}".
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition ${
                  selectedIndex === idx
                    ? 'bg-accent/60 text-accent-foreground border border-brand/30 shadow-card'
                    : 'text-foreground hover:bg-muted border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-brand-text">
                    {cmd.icon}
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">{cmd.title}</span>
                    {cmd.description && (
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {cmd.description}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] uppercase font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="h-8 px-4 bg-card border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>↵ Select</span>
            <span>•</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono text-[10px]">ResumeLabs Cmd+K</span>
        </div>
      </div>
    </div>
  );
};
