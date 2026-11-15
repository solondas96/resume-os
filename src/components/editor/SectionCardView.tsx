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

  const updateSectionTitle = (index: number, newTitle: string) => {
    const updated = [...sections];
    updated[index].title = newTitle;
    const reconstructed =
      headerBlock +
      '\n\n' +
      updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
  };

  const addBulletToSection = (index: number) => {
    saveRevision(`Add bullet point to ${sections[index].title}`);
    const updated = [...sections];
    updated[index].rawContent =
      updated[index].rawContent +
      '\n- Spearheaded key initiative delivering measurable impact.';
    const reconstructed =
      headerBlock +
      '\n\n' +
      updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
  };

  const deleteSection = (index: number) => {
    if (!confirm(`Are you sure you want to delete the "## ${sections[index].title}" section?`)) {
      return;
    }
    saveRevision(`Delete section ${sections[index].title}`);
    const updated = [...sections];
    updated.splice(index, 1);
    const reconstructed =
      headerBlock +
      '\n\n' +
      updated.map((s) => `## ${s.title}\n${s.rawContent}`).join('\n\n');
    setMarkdown(reconstructed);
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
      return <Briefcase className="w-4 h-4 text-brand" />;
    }
    if (lower.includes('education') || lower.includes('school')) {
      return <GraduationCap className="w-4 h-4 text-brand" />;
    }
    if (lower.includes('skill')) {
      return <Wrench className="w-4 h-4 text-brand" />;
    }
    if (lower.includes('project')) {
      return <FolderGit2 className="w-4 h-4 text-brand" />;
    }
    return <FileText className="w-4 h-4 text-brand" />;
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-background text-foreground transition-colors duration-150">
      {/* 1. Header Card (Contact & Intro) */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            <span className="font-semibold text-xs text-foreground">Personal Info & Header</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Title & Contact Layout</span>
        </div>
        <div className="p-3">
          <textarea
            value={headerBlock}
            onChange={(e) => updateHeaderBlock(e.target.value)}
            rows={6}
            className="w-full bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Structured Section Cards */}
      {sections.map((section, idx) => {
        const isCollapsed = collapsedSections[section.id];
        return (
          <div
            key={section.id + idx}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-card transition-all"
          >
            {/* Card Header */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                {getSectionIcon(section.title)}
                <span className="font-semibold text-xs text-foreground">{section.title}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-0.5">
                  <button
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-25 rounded transition"
                    title="Move section up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-25 rounded transition"
                    title="Move section down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => addBulletToSection(idx)}
                  className="flex items-center gap-1 text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border px-2 py-0.5 rounded transition"
                  title="Add bullet point"
                >
                  <Plus className="w-3 h-3 text-brand" />
                  <span>Bullet</span>
                </button>

                <button
                  onClick={() => toggleCollapse(section.id)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                  title={isCollapsed ? 'Expand section' : 'Collapse section'}
                >
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => deleteSection(idx)}
                  className="p-1 text-muted-foreground hover:text-destructive rounded transition ml-1"
                  title="Delete section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card Body */}
            {!isCollapsed && (
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">Heading:</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSectionTitle(idx, e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground font-medium focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden"
                  />
                </div>

                <textarea
                  value={section.rawContent}
                  onChange={(e) => updateSectionContent(idx, e.target.value)}
                  rows={Math.max(4, section.rawContent.split('\n').length + 1)}
                  className="w-full bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none leading-relaxed"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
