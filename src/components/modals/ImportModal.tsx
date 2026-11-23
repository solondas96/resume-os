/**
 * Import with review. A file (or pasted text) is parsed first and shown back to the user:
 * the original text beside the detected structure, a confidence for each section,
 * and the lines the parser could not place, each with a way to move it into a section.
 * Nothing is saved until the user confirms.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2, GripVertical } from 'lucide-react';
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { importResume, ImportResult } from '../../services/importResume';
import { markdownToResume } from '../../model/serialize';
import { allBullets, sectionItems } from '../../model/resume';
import { moveLineToSection, UnsortedLine } from '../../import/structure';

const ACCEPT = '.pdf,.docx,.txt,.md';

/** An unsorted line that can be dragged onto a section (the select and Move button stay as the keyboard path) */
const DraggableUnsorted: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({ id: `unsorted-${id}` });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <li ref={setNodeRef} style={style} className={`flex flex-wrap items-center gap-2 text-xs ${isDragging ? 'opacity-70' : ''}`}>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        aria-label="Drag this line onto a section, or use the menu"
        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      {children}
    </li>
  );
};

/** A section in the review that accepts a dropped line */
const DroppableSection: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `section-${index}` });
  return (
    <div ref={setNodeRef} className={`rounded-lg ${isOver ? 'ring-2 ring-brand/50' : ''}`}>
      {children}
    </div>
  );
};

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  low: 'bg-destructive/10 text-destructive',
};

export const ImportModal: React.FC = () => {
  const activeModal = useResumeStoreV2((s) => s.activeModal);
  const setActiveModal = useResumeStoreV2((s) => s.setActiveModal);
  const pendingImportFile = useResumeStoreV2((s) => s.pendingImportFile);
  const openImport = useResumeStoreV2((s) => s.openImport);
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const createResume = useResumeStoreV2((s) => s.createResume);
  const setMarkdown = useResumeStoreV2((s) => s.setMarkdown);
  const saveRevision = useResumeStoreV2((s) => s.saveRevision);

  const [pasteText, setPasteText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('Imported resume');
  // The review's own copy of the text: unsorted lines are moved here, and the preview follows it
  const [reviewText, setReviewText] = useState('');
  const [unsorted, setUnsorted] = useState<UnsortedLine[]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  // Drag sensors: declared with the other hooks, before any early return
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));

  const isOpen = activeModal === 'import';

  // Run the import when a file arrives (from first-run or the file picker)
  useEffect(() => {
    if (!isOpen || !pendingImportFile) return;
    let cancelled = false;
    setBusy(true);
    setResult(null);
    importResume(pendingImportFile).then((r) => {
      if (cancelled) return;
      setResult(r);
      setTitle(pendingImportFile.name.replace(/\.[^.]+$/, '') || 'Imported resume');
      setBusy(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, pendingImportFile]);

  // Reset the review's copy whenever a new result arrives
  useEffect(() => {
    if (!result) return;
    setReviewText(result.text ?? '');
    setUnsorted(result.structure?.unsorted ?? []);
    setTargets({});
  }, [result]);

  const reviewResume = useMemo(() => (reviewText.trim() ? markdownToResume(reviewText, title) : null), [reviewText, title]);

  const summary = useMemo(() => {
    if (!reviewResume) return null;
    return {
      name: reviewResume.basics.name || '(not detected)',
      bullets: allBullets(reviewResume).length,
      sections: reviewResume.sections.map((s) => {
        const count =
          s.kind === 'skills' ? s.groups.length : s.kind === 'summary' ? s.paragraphs.length : s.kind === 'custom' || s.kind === 'certifications' ? s.lines.length : sectionItems(s).length;
        return { title: s.title, count };
      }),
    };
  }, [reviewResume]);

  // Confidence for each detected section, from the structure stage (sections it did not name are custom)
  const confidenceByTitle = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of result?.structure?.sections ?? []) map.set(s.title.toLowerCase(), s.confidence);
    return map;
  }, [result]);

  if (!isOpen) return null;

  const close = () => {
    useResumeStoreV2.setState({ pendingImportFile: null });
    setActiveModal(null);
    setResult(null);
    setPasteText('');
  };

  const handleFile = (file: File) => openImport(file);

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    const resume = markdownToResume(pasteText, 'Pasted resume');
    setResult({
      success: true,
      text: pasteText,
      resume,
      detectedSections: [],
      warnings: resume.sections.length === 0 ? ['No structured sections detected. You may need to reorganize content.'] : [],
      errors: [],
      pageText: pasteText,
    });
    setTitle('Pasted resume');
  };

  const canCreate = !!result?.success && reviewText.trim().length > 0;

  const createNew = () => {
    if (!canCreate) return;
    createResume(title.trim() || 'Imported resume', reviewText);
    close();
  };

  const replaceCurrent = () => {
    if (!canCreate || !currentResume) return;
    saveRevision('Snapshot before import');
    setMarkdown(reviewText);
    close();
  };

  const moveUnsorted = (line: UnsortedLine, chosen: string | undefined = targets[line.id]) => {
    if (!chosen) return;
    setReviewText((t) => moveLineToSection(t, line.text, chosen));
    setUnsorted((list) => list.filter((u) => u.id !== line.id));
  };

  // Drag-out: a line dropped on a section moves there, exactly as Move does
  const onDragEnd = (e: DragEndEvent) => {
    const over = e.over?.id ? String(e.over.id) : '';
    const active = String(e.active.id);
    if (!over.startsWith('section-') || !active.startsWith('unsorted-') || !summary) return;
    const section = summary.sections[Number(over.slice('section-'.length))];
    const line = unsorted.find((u) => `unsorted-${u.id}` === active);
    if (section && line) moveUnsorted(line, section.title);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-4xl w-full shadow-lifted flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Upload className="w-4 h-4 text-brand-text" />
            <span>Import resume</span>
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition" aria-label="Close import">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!result && !busy && (
            <>
              <label className="border-2 border-dashed border-border hover:border-brand rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/30 transition group">
                <FileText className="w-8 h-8 text-muted-foreground group-hover:text-brand-text transition mb-2" />
                <span className="text-xs text-foreground font-medium">Choose a PDF, DOCX, TXT or Markdown file</span>
                <span className="text-[11px] text-muted-foreground mt-1">Processed in your browser. Nothing is uploaded.</span>
                <input
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-[1px] bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Or paste text</span>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste resume text or Markdown..."
                rows={6}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground font-mono focus:ring-2 focus:ring-brand/30 focus:border-brand focus:outline-hidden resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  disabled={!pasteText.trim()}
                  onClick={handlePaste}
                  className="px-4 py-1.5 bg-muted hover:bg-muted/80 disabled:opacity-40 text-foreground text-xs font-medium rounded-lg transition"
                >
                  Review pasted text
                </button>
              </div>
            </>
          )}

          {busy && <p className="text-xs text-muted-foreground">Reading the file…</p>}

          {result && !busy && (
            <>
              {result.errors.map((e, i) => (
                <div key={`e${i}`} className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{e}</span>
                </div>
              ))}

              {result.success && summary && (
                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <section aria-label="Original text" className="space-y-2 min-w-0">
                      <h3 className="text-xs font-medium text-foreground">What the file says</h3>
                      <pre className="max-h-[42vh] overflow-auto bg-background border border-border rounded-lg p-3 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{result.pageText}</pre>
                    </section>

                    <section aria-label="Detected structure" className="space-y-3 min-w-0">
                      <h3 className="text-xs font-medium text-foreground">What we found</h3>
                      <div className="bg-background border border-border rounded-lg p-3 text-xs space-y-1.5">
                        <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{summary.name}</span></div>
                        <div><span className="text-muted-foreground">Bullets:</span> <span className="font-mono">{summary.bullets}</span></div>
                      </div>
                      <ul className="space-y-1.5" aria-label="Sections">
                        {summary.sections.map((s, index) => {
                          const conf = confidenceByTitle.get(s.title.toLowerCase()) ?? 'high';
                          return (
                            <DroppableSection key={`${index}-${s.title}`} index={index}>
                            <li className="flex items-center justify-between gap-2 text-xs bg-background border border-border rounded-lg px-3 py-2">
                              <span className="text-foreground">{s.title} <span className="text-muted-foreground font-mono">({s.count})</span></span>
                              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${CONFIDENCE_STYLE[conf]}`}>
                                {conf === 'high' ? 'confident' : conf === 'medium' ? 'check this' : 'guess'}
                              </span>
                            </li>
                            </DroppableSection>
                          );
                        })}
                      </ul>
                    </section>
                  </div>

                  {unsorted.length > 0 && (
                    <section aria-label="Unsorted lines" className="space-y-2 border border-amber-500/40 rounded-lg p-3">
                      <h3 className="text-xs font-medium text-foreground">
                        Unsorted lines ({unsorted.length}) — these are kept, but we are not sure where they belong
                      </h3>
                      <ul className="space-y-2">
                        {unsorted.map((u) => (
                          <DraggableUnsorted key={u.id} id={u.id}>
                            <span className="flex-1 min-w-[12rem] text-foreground">{u.text}</span>
                            <span className="text-muted-foreground">{u.reason}</span>
                            <label className="sr-only" htmlFor={`move-${u.id}`}>Move to section</label>
                            <select
                              id={`move-${u.id}`}
                              value={targets[u.id] ?? ''}
                              onChange={(e) => setTargets((t) => ({ ...t, [u.id]: e.target.value }))}
                              className="bg-background border border-border rounded-md px-2 py-1 text-xs"
                            >
                              <option value="">Choose a section</option>
                              {summary.sections.map((s, index) => (
                                <option key={`${index}-${s.title}`} value={s.title}>{s.title}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={!targets[u.id]}
                              onClick={() => moveUnsorted(u)}
                              className="px-2.5 py-1 bg-muted hover:bg-muted/80 disabled:opacity-40 text-foreground rounded-md"
                            >
                              Move
                            </button>
                          </DraggableUnsorted>
                        ))}
                      </ul>
                    </section>
                  )}

                  {result.warnings.map((w, i) => (
                    <div key={`w${i}`} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Nothing is created until you confirm.</span>
                  </div>

                  <label className="block text-xs">
                    <span className="block font-medium text-foreground mb-1">Resume title</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
                    />
                  </label>
                </>
                </DndContext>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2 flex-wrap">
          <button onClick={close} className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition">
            Cancel
          </button>
          {currentResume && (
            <button
              disabled={!canCreate}
              onClick={replaceCurrent}
              className="px-4 py-1.5 bg-muted hover:bg-muted/80 disabled:opacity-40 text-foreground text-xs font-medium rounded-lg transition"
            >
              Replace current text
            </button>
          )}
          <button
            disabled={!canCreate}
            onClick={createNew}
            className="px-4 py-1.5 bg-primary text-primary-foreground disabled:opacity-40 text-xs font-medium rounded-lg hover:opacity-90 transition"
          >
            Create resume
          </button>
        </div>
      </div>
    </div>
  );
};
