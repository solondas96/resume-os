import React, { useState, useMemo } from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2
} from 'lucide-react';

interface ParsedSection {
  id: string;
  title: string;
  rawContent: string;
}

export const SectionCardView: React.FC = () => {
  const { markdown, setMarkdown, saveRevision } = useResumeStore();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Parse markdown into Header block and ## Sections
  const { headerBlock, sections } = useMemo(() => {
    const lines = markdown.split('\n');
    let headerLines: string[] = [];
    const parsedSections: ParsedSection[] = [];
    let currentTitle = '';
    let currentLines: string[] = [];
    let inHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        if (inHeader) {
          headerLines = currentLines;
          inHeader = false;
        } else if (currentTitle) {
          parsedSections.push({
            id: currentTitle.toLowerCase().replace(/\s+/g, '-'),
            title: currentTitle,
            rawContent: currentLines.join('\n').trim(),
          });
        }
        currentTitle = line.replace('## ', '').trim();
        currentLines = [];
      } else {
        currentLines.push(line);
      }
    }

    if (inHeader) {
      headerLines = currentLines;
    } else if (currentTitle) {
      parsedSections.push({
        id: currentTitle.toLowerCase().replace(/\s+/g, '-'),
        title: currentTitle,
        rawContent: currentLines.join('\n').trim(),
      });
    }

    return {
      headerBlock: headerLines.join('\n').trim(),
      sections: parsedSections,
    };
  }, [markdown]);

  const toggleCollapse = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateHeaderBlock = (newHeader: string) => {
    const reconstructed =
      newHeader.trim() +
      '\n\n' +
      sections.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
  };

  const updateSectionContent = (index: number, newContent: string) => {
    const updated = [...sections];
    updated[index].rawContent = newContent;
    const reconstructed =
      headerBlock +
      '\n\n' +
      updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
  };

  const addBulletToSection = (index: number) => {
    saveRevision('Add bullet to section');
    const updated = [...sections];
    const bulletTemplate = '- Spearheaded [initiative], achieving [quantified impact] through [how].';
    updated[index].rawContent = updated[index].rawContent
      ? updated[index].rawContent + '\n' + bulletTemplate
      : bulletTemplate;

    const reconstructed =
      headerBlock +
      '\n\n' +
      updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
  };

  const deleteSection = (index: number) => {
    if (confirm(`Delete the "${sections[index].title}" section?`)) {
      saveRevision(`Delete section ${sections[index].title}`);
      const updated = sections.filter((_, idx) => idx !== index);
      const reconstructed =
        headerBlock +
        '\n\n' +
        updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
      setMarkdown(reconstructed);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    saveRevision(`Move ${sections[index].title} ${direction}`);
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reconstructed =
      headerBlock +
      '\n\n' +
      updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
  };

  const getSectionIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('experience') || lower.includes('work')) {
      return <Briefcase className="w-4 h-4 text-blue-400" />;
    }
    if (lower.includes('education') || lower.includes('school')) {
      return <GraduationCap className="w-4 h-4 text-emerald-400" />;
    }
    if (lower.includes('skill')) {
      return <Wrench className="w-4 h-4 text-purple-400" />;
    }
    if (lower.includes('project')) {
      return <FolderGit2 className="w-4 h-4 text-amber-400" />;
    }
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-slate-900 text-slate-200">
      {/* 1. Header Card (Contact & Intro) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
            <span className="font-bold text-xs text-slate-100">Personal Info & Header</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Title & Contact Layout</span>
        </div>
        <div className="p-3">
          <textarea
            value={headerBlock}
            onChange={(e) => updateHeaderBlock(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Structured Section Cards */}
      {sections.map((section, idx) => {
        const isCollapsed = collapsedSections[section.id];
        return (
          <div
            key={section.id + idx}
            className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all"
          >
            {/* Card Header */}
            <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-slate-600 cursor-grab hover:text-slate-400" />
                {getSectionIcon(section.title)}
                <span className="font-bold text-xs text-slate-100">{section.title}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 border-r border-slate-800 pr-1.5 mr-0.5">
                  <button
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-25 disabled:hover:text-slate-400 rounded transition"
                    title="Move section up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-25 disabled:hover:text-slate-400 rounded transition"
                    title="Move section down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => addBulletToSection(idx)}
                  className="flex items-center gap-1 text-[11px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded transition"
                  title="Add bullet point"
                >
                  <Plus className="w-3 h-3" />
                  <span>Bullet</span>
                </button>

                <button
                  onClick={() => deleteSection(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                  title="Delete section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleCollapse(section.id)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded transition"
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Card Body */}
            {!isCollapsed && (
              <div className="p-3">
                <textarea
                  value={section.rawContent}
                  onChange={(e) => updateSectionContent(idx, e.target.value)}
                  rows={Math.max(4, section.rawContent.split('\n').length + 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
