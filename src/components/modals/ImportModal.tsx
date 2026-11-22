/**
 * Import with review. A PDF, DOCX, text or Markdown file (or pasted text) is
 * parsed first and shown back to the user: detected sections, warnings and
 * what would be created. Nothing is saved until the user confirms.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { importResume, ImportResult } from '../../services/importResume';
import { markdownToResume } from '../../model/serialize';
import { allBullets, sectionItems } from '../../model/resume';

const ACCEPT = '.pdf,.docx,.txt,.md';

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

  const summary = useMemo(() => {
    const resume = result?.resume;
    if (!resume) return null;
    const bullets = allBullets(resume).length;
    return {
      name: resume.basics.name || '(not detected)',
      sections: resume.sections.map((s) => {
        const count = s.kind === 'skills' ? s.groups.length : s.kind === 'summary' ? s.paragraphs.length : s.kind === 'custom' || s.kind === 'certifications' ? s.lines.length : sectionItems(s).length;
        return `${s.title} (${count})`;
      }),
      bullets,
    };
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
    });
    setTitle('Pasted resume');
  };

  const text = result?.text ?? '';
  const canCreate = !!result?.success && text.trim().length > 0;

  const createNew = () => {
    if (!canCreate) return;
    createResume(title.trim() || 'Imported resume', text);
    close();
  };

  const replaceCurrent = () => {
    if (!canCreate || !currentResume) return;
    saveRevision('Snapshot before import');
    setMarkdown(text);
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-lifted flex flex-col max-h-[88vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Upload className="w-4 h-4 text-brand" />
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
                <FileText className="w-8 h-8 text-muted-foreground group-hover:text-brand transition mb-2" />
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
                <>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Review what will be created</span>
                  </div>

                  <div className="bg-background border border-border rounded-xl p-3 text-xs space-y-2">
                    <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{summary.name}</span></div>
                    <div><span className="text-muted-foreground">Bullets found:</span> <span className="font-mono">{summary.bullets}</span></div>
                    <div>
                      <span className="text-muted-foreground">Sections:</span>{' '}
                      {summary.sections.length > 0 ? summary.sections.join(', ') : <span className="text-muted-foreground">none detected</span>}
                    </div>
                  </div>

                  {result.warnings.map((w, i) => (
                    <div key={`w${i}`} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}

                  <label className="block text-xs">
                    <span className="block font-medium text-foreground mb-1">Resume title</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
                    />
                  </label>

                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Show extracted text</summary>
                    <pre className="mt-2 max-h-48 overflow-auto bg-background border border-border rounded-lg p-2 whitespace-pre-wrap font-mono text-[11px]">{text}</pre>
                  </details>
                </>
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
