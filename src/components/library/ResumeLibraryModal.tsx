import React, { useState } from 'react';
import {
  X,
  Plus,
  Copy,
  Trash2,
  FileText,
  Calendar,
  Check,
  Edit2,
  Download,
  Upload,
  ArrowRight
} from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { SAMPLE_RESUME } from '../../data/sampleResume';

export const ResumeLibraryModal: React.FC = () => {
  const {
    resumes,
    activeResumeId,
    switchResume,
    createResume,
    duplicateResume,
    deleteResume,
    renameResume,
    libraryModalOpen,
    setLibraryModalOpen,
  } = useResumeStoreV2();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!libraryModalOpen) return null;

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameResume(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCreateNew = () => {
    const title = newTitle.trim() || `Resume ${resumes.length + 1}`;
    createResume(title, SAMPLE_RESUME);
    setNewTitle('');
    setIsCreating(false);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resumes, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `resumelabs-library-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem('resumeos_profiles_v1', JSON.stringify(parsed));
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid backup file JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Resume Library</h2>
              <p className="text-xs text-muted-foreground">Manage and tailor resumes for different target roles</p>
            </div>
          </div>
          <button
            onClick={() => setLibraryModalOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border flex items-center justify-between gap-3">
          {isCreating ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Stripe - Staff Backend Engineer"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand"
              />
              <button
                onClick={handleCreateNew}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-hover transition active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Resume</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              title="Download JSON Backup"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup Library</span>
            </button>
            <label
              title="Import JSON Backup"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border cursor-pointer transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Resumes List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {resumes.map((resume) => {
            const isActive = resume.id === activeResumeId;
            const isEditing = editingId === resume.id;

            return (
              <div
                key={resume.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                  isActive
                    ? 'border-brand bg-accent/30 shadow-xs'
                    : 'border-border bg-card hover:border-border/80 hover:bg-muted/20'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-brand text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(resume.id)}
                          autoFocus
                          className="px-2 py-1 text-xs bg-background border border-border rounded text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand"
                        />
                        <button
                          onClick={() => handleSaveRename(resume.id)}
                          className="p-1 text-xs text-brand hover:underline"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{resume.meta.title}</h3>
                        {isActive && (
                          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-1.5 py-0.5 bg-brand text-white rounded">
                            Active
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(resume.meta.updatedAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-mono text-[11px]">{resume.design.template} template</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => {
                        switchResume(resume.id);
                        setLibraryModalOpen(false);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition active:scale-[0.98]"
                    >
                      <span>Switch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => handleStartRename(resume.id, resume.meta.title)}
                    title="Rename"
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => duplicateResume(resume.id)}
                    title="Duplicate Resume"
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {resumes.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${resume.meta.title}"?`)) {
                          deleteResume(resume.id);
                        }
                      }}
                      title="Delete Resume"
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
