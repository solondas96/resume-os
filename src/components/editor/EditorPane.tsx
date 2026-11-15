import React, { useCallback, useRef, useState } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useResumeStore } from '../../store/useResumeStore';
import { SectionCardView } from './SectionCardView';
import {
  Bold,
  Italic,
  Heading2,
  List,
  Columns,
  Sparkles,
  Save,
  Link,
  Code,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  MapPin
} from 'lucide-react';

interface SlashCommand {
  id: string;
  category: 'Sections' | 'Icons' | 'Templates';
  title: string;
  desc: string;
  snippet: string;
  icon: React.ReactNode;
}

export const EditorPane: React.FC = () => {
  const {
    markdown: content,
    setMarkdown,
    saveRevision,
    editorViewMode,
    setEditorViewMode
  } = useResumeStore();

  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Slash Command Menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  // Selection Toolbar state
  const [selectionToolbarPos, setSelectionToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  const slashCommands: SlashCommand[] = [
    // Sections
    {
      id: 'sec-exp',
      category: 'Sections',
      title: 'Work Experience',
      desc: 'Insert job title, company, dates, and STAR bullet template',
      snippet: '\n## Work Experience\n\n### Company Name — Senior Role\n*San Francisco, CA* | *2022 – Present*\n\n`Skill 1` `Skill 2`\n\n- Spearheaded [initiative], delivering [X% measurable outcome] by [action].\n- Engineered [system], scaling throughput from [X] to [Y].\n',
      icon: <Briefcase className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'sec-summary',
      category: 'Sections',
      title: 'Executive Summary',
      desc: 'Brief 2-3 sentence overview of your profile and strengths',
      snippet: '\n## Summary\nResults-driven engineer with 8+ years of experience designing scalable platforms and cloud architectures.\n',
      icon: <Heading2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'sec-skills',
      category: 'Sections',
      title: 'Technical Skills Matrix',
      desc: 'Two-column categorized languages, frameworks, and cloud tools',
      snippet: '\n## Technical Skills\n\n::: left\n- **Languages:** TypeScript, Go, Python, SQL\n- **Frontend:** React, Next.js, Tailwind CSS\n:::\n\n::: right\n- **Backend:** Node.js, gRPC, Docker, Kubernetes\n- **Database:** PostgreSQL, Redis, Kafka\n:::\n',
      icon: <Wrench className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'sec-projects',
      category: 'Sections',
      title: 'Key Projects',
      desc: 'Open source projects or high-impact portfolio apps',
      snippet: '\n## Key Projects\n\n### Project Name — Architecture Title\n*Creator & Maintainer* | [icon:github github.com/user/repo](https://github.com)\n\n- Engineered high-throughput caching engine, earning **4.2k+ GitHub stars**.\n',
      icon: <FolderGit2 className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'sec-edu',
      category: 'Sections',
      title: 'Education',
      desc: 'University, degree, honors, and graduation year',
      snippet: '\n## Education\n\n### University Name\n*Bachelor of Science in Computer Science* | *2018 – 2022*\n- Graduated with Honors (GPA: 3.85/4.0)\n',
      icon: <GraduationCap className="w-4 h-4 text-cyan-400" />,
    },

    // Templates
    {
      id: 'tmpl-2col',
      category: 'Templates',
      title: 'Two-Column Layout',
      desc: 'Side-by-side ::: left and ::: right block containers',
      snippet: '\n::: left\n[icon:email user@example.com](mailto:user@example.com)\n[icon:phone +1 555-0192](tel:+15550192)\n:::\n\n::: right\n[icon:linkedin linkedin.com/in/user](https://linkedin.com)\n[icon:github github.com/user](https://github.com)\n:::\n',
      icon: <Columns className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'tmpl-star',
      category: 'Templates',
      title: 'STAR Impact Bullet Point',
      desc: 'Quantified accomplishment template with metric placeholders',
      snippet: '- Spearheaded [initiative], achieving **[X% metric]** improvement by [action].\n',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },

    // Icons
    {
      id: 'icon-email',
      category: 'Icons',
      title: 'Email Link',
      desc: '[icon:email email@example.com](mailto:...)',
      snippet: '[icon:email user@example.com](mailto:user@example.com)',
      icon: <Mail className="w-4 h-4 text-slate-400" />,
    },
    {
      id: 'icon-linkedin',
      category: 'Icons',
      title: 'LinkedIn Profile',
      desc: '[icon:linkedin linkedin.com/in/...](...)',
      snippet: '[icon:linkedin linkedin.com/in/username](https://linkedin.com/in/username)',
      icon: <Linkedin className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'icon-github',
      category: 'Icons',
      title: 'GitHub Profile',
      desc: '[icon:github github.com/...](...)',
      snippet: '[icon:github github.com/username](https://github.com/username)',
      icon: <Github className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'icon-phone',
      category: 'Icons',
      title: 'Phone Number',
      desc: '[icon:phone +1...](tel:...)',
      snippet: '[icon:phone +1 (555) 019-2834](tel:+15550192834)',
      icon: <Phone className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'icon-location',
      category: 'Icons',
      title: 'Location Tag',
      desc: '[icon:location City, ST](...)',
      snippet: '[icon:location San Francisco, CA](https://maps.google.com)',
      icon: <MapPin className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'icon-globe',
      category: 'Icons',
      title: 'Portfolio Website',
      desc: '[icon:globe website.dev](...)',
      snippet: '[icon:globe yoursite.dev](https://yoursite.dev)',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
    },
  ];

  const filteredCommands = slashCommands.filter((cmd) => {
    if (!slashFilter) return true;
    const q = slashFilter.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.desc.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const insertSnippet = useCallback(
    (snippet: string) => {
      const view = editorRef.current?.view;
      if (!view) {
        setMarkdown(content + '\n' + snippet);
        return;
      }
      const state = view.state;
      const ranges = state.selection.ranges;
      const from = ranges[0].from;
      const to = ranges[0].to;

      view.dispatch({
        changes: { from, to, insert: snippet },
        selection: { anchor: from + snippet.length },
      });
      view.focus();
    },
    [content, setMarkdown]
  );

  const executeSlashCommand = (cmd: SlashCommand) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const state = view.state;
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    const lineText = line.text;

    // Find the slash position on current line
    const slashIdx = lineText.lastIndexOf('/', pos - line.from);
    if (slashIdx !== -1) {
      const from = line.from + slashIdx;
      view.dispatch({
        changes: { from, to: pos, insert: cmd.snippet },
        selection: { anchor: from + cmd.snippet.length },
      });
    } else {
      insertSnippet(cmd.snippet);
    }

    setSlashOpen(false);
    view.focus();
  };

  // Wrap highlighted text
  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const state = view.state;
    const range = state.selection.main;
    const selected = state.sliceDoc(range.from, range.to);

    const replacement = `${prefix}${selected}${suffix}`;
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: replacement },
      selection: { anchor: range.from + replacement.length },
    });
    view.focus();
  };

  // Monitor cursor position & selection
  const handleUpdate = useCallback(
    (update: any) => {
      const view = update.view;
      if (!view) return;

      const state = view.state;
      const selection = state.selection.main;

      // 1. Check for text selection
      if (!selection.empty) {
        setHasSelection(true);
        try {
          const coords = view.coordsAtPos(selection.from);
          if (coords) {
            setSelectionToolbarPos({
              top: Math.max(50, coords.top - 44),
              left: Math.max(10, coords.left),
            });
          }
        } catch {
          setHasSelection(false);
        }
      } else {
        setHasSelection(false);
        setSelectionToolbarPos(null);
      }

      // 2. Check for slash trigger
      const pos = selection.head;
      const line = state.doc.lineAt(pos);
      const textBeforeCursor = line.text.slice(0, pos - line.from);
      const slashIndex = textBeforeCursor.lastIndexOf('/');

      if (slashIndex !== -1 && (slashIndex === 0 || /\s/.test(textBeforeCursor[slashIndex - 1]))) {
        const query = textBeforeCursor.slice(slashIndex + 1);
        if (!/\s/.test(query)) {
          setSlashOpen(true);
          setSlashFilter(query);
          return;
        }
      }
      setSlashOpen(false);
    },
    []
  );

  return (
    <div className="editor-pane-container flex flex-col h-full bg-slate-900 border-r border-slate-800 select-none relative">
      {/* Editor Sub-Header Toolbar */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        {/* Left: View Mode Segmented Switch */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setEditorViewMode('markdown')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              editorViewMode === 'markdown'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Markdown
          </button>
          <button
            onClick={() => setEditorViewMode('cards')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              editorViewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Section Cards
          </button>
        </div>

        {/* Center: Formatting Quick Actions (Active in Markdown mode) */}
        {editorViewMode === 'markdown' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertSnippet('**Bold Text**')}
              title="Bold (**text**)"
              className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertSnippet('*Italic Text*')}
              title="Italic (*text*)"
              className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertSnippet('\n## Section Heading\n')}
              title="Section Heading (##)"
              className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertSnippet('\n- Bullet point metric or task achievement\n')}
              title="Bullet Point (- )"
              className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-800 mx-1" />
            <button
              onClick={() =>
                insertSnippet(
                  '\n::: left\n[icon:email user@domain.com](mailto:user@domain.com)\n:::\n\n::: right\n[icon:linkedin linkedin.com/in/user](https://linkedin.com)\n:::\n'
                )
              }
              title="Insert Two-Column Container"
              className="flex items-center gap-1 px-1.5 py-1 hover:bg-slate-800 hover:text-blue-300 rounded transition text-[11px]"
            >
              <Columns className="w-3.5 h-3.5 text-blue-400" />
              <span>2-Col</span>
            </button>
          </div>
        )}

        {/* Right: Snapshot Button */}
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={() => saveRevision()}
            title="Commit revision snapshot now"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-0.5 rounded transition"
          >
            <Save className="w-3 h-3" />
            <span>Snapshot</span>
          </button>
        </div>
      </div>

      {/* Main Content: Section Cards OR CodeMirror */}
      {editorViewMode === 'cards' ? (
        <SectionCardView />
      ) : (
        <div className="flex-1 overflow-hidden relative">
          <CodeMirror
            ref={editorRef}
            value={content}
            height="100%"
            theme={oneDark}
            extensions={[markdown()]}
            onChange={(val) => setMarkdown(val)}
            onUpdate={handleUpdate}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              foldGutter: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
            }}
            className="h-full text-[13px] font-mono leading-relaxed"
          />

          {/* Floating Selection Toolbar */}
          {hasSelection && selectionToolbarPos && (
            <div
              style={{
                position: 'fixed',
                top: `${selectionToolbarPos.top}px`,
                left: `${selectionToolbarPos.left}px`,
                zIndex: 50,
              }}
              className="bg-slate-950 border border-slate-750 shadow-2xl rounded-lg flex items-center p-1 gap-1 text-slate-200 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                onClick={() => applyFormatting('**', '**')}
                title="Bold"
                className="p-1.5 hover:bg-slate-800 rounded text-xs hover:text-white"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => applyFormatting('*', '*')}
                title="Italic"
                className="p-1.5 hover:bg-slate-800 rounded text-xs hover:text-white"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => applyFormatting('`', '`')}
                title="Skill Tag Chip"
                className="p-1.5 hover:bg-slate-800 rounded text-xs hover:text-purple-300"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => applyFormatting('[', '](https://...)')}
                title="Link"
                className="p-1.5 hover:bg-slate-800 rounded text-xs hover:text-blue-300"
              >
                <Link className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => applyFormatting('\n- ')}
                title="Bullet"
                className="p-1.5 hover:bg-slate-800 rounded text-xs hover:text-emerald-300"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Slash (/) Command Menu */}
          {slashOpen && (
            <div className="absolute top-4 left-12 w-72 bg-slate-950 border border-slate-750 shadow-2xl rounded-xl z-50 overflow-hidden text-xs">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Insert Blocks (Type to filter)</span>
                <span className="text-blue-400">/{slashFilter}</span>
              </div>
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                {filteredCommands.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-[11px]">
                    No matching command.
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => (
                    <button
                      key={cmd.id}
                      onClick={() => executeSlashCommand(cmd)}
                      onMouseEnter={() => setSlashIndex(idx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 transition ${
                        slashIndex === idx
                          ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center rounded bg-slate-900 flex-shrink-0">
                        {cmd.icon}
                      </div>
                      <div className="flex-1 truncate">
                        <span className="font-semibold block text-[11px] text-slate-200 truncate">
                          {cmd.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {cmd.desc}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
