/**
 * Application tracker: a board (columns by status; drag a card to a column) and a table
 * (sortable columns). Each application can link to the tailored resume it was made with,
 * and shows the match score recorded for it.
 */

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Plus, Trash2, Briefcase, LayoutGrid, Table as TableIcon, ArrowUpDown, FileText } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import {
  ApplicationStatus,
  JobApplication,
  STATUS_ORDER,
  groupByStatus,
  sortApplications,
  SortKey,
} from '../../model/tracker';

type View = 'board' | 'table';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const iconButton = 'min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition';

export const TrackerModal: React.FC = () => {
  const activeModal = useResumeStoreV2((s) => s.activeModal);
  const setActiveModal = useResumeStoreV2((s) => s.setActiveModal);
  const applications = useResumeStoreV2((s) => s.applications);
  const addApplication = useResumeStoreV2((s) => s.addApplication);
  const updateApplication = useResumeStoreV2((s) => s.updateApplication);
  const deleteApplication = useResumeStoreV2((s) => s.deleteApplication);
  const resumes = useResumeStoreV2((s) => s.resumes);
  const switchResume = useResumeStoreV2((s) => s.switchResume);
  const stats = useResumeStoreV2((s) => s.stats);

  const [view, setView] = useState<View>('board');
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'lastUpdated', direction: 'desc' });
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => groupByStatus(applications), [applications]);
  const sorted = useMemo(() => sortApplications(applications, sort.key, sort.direction), [applications, sort]);
  const resumeTitle = (id?: string) => resumes.find((r) => r.id === id)?.meta.title;

  if (activeModal !== 'tracker') return null;

  const handleAdd = () => {
    if (!company.trim() && !role.trim()) return;
    addApplication(company.trim() || 'Unknown company', role.trim() || 'Unknown role');
    setCompany('');
    setRole('');
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    // Dropped on a column, or on a card in that column
    const overApp = applications.find((a) => a.id === over.id);
    const target = (overApp ? overApp.status : over.id) as ApplicationStatus;
    const app = applications.find((a) => a.id === active.id);
    if (app && app.status !== target && STATUS_ORDER.includes(target)) {
      updateApplication(app.id, { status: target, ...(target === 'applied' && !app.appliedAt ? { appliedAt: Date.now() } : {}) });
    }
  };

  const openResume = (id: string) => {
    switchResume(id);
    setActiveModal(null);
  };

  const header = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }))}
      className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-card border border-border rounded-2xl w-full max-w-5xl shadow-lifted flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Briefcase className="w-4 h-4 text-brand" />
            <span>Application Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border" role="group" aria-label="View">
              <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 ${view === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </button>
              <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                <TableIcon className="w-3.5 h-3.5" /> Table
              </button>
            </div>
            <button onClick={() => setActiveModal(null)} className={iconButton} aria-label="Close tracker">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-border grid grid-cols-4 gap-3 text-center">
          <Stat label="Total" value={stats.total} />
          <Stat label="Applied" value={stats.byStatus.applied} />
          <Stat label="Interviews" value={stats.byStatus.interview} />
          <Stat label="Conversion" value={`${Math.round(stats.conversionRate)}%`} />
        </div>

        <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row gap-2">
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" aria-label="Company" className="flex-1 bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" aria-label="Role" className="flex-1 bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30" />
          <button type="button" onClick={handleAdd} disabled={!company.trim() && !role.trim()} className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground disabled:opacity-40 text-xs font-medium rounded-lg min-h-[40px]">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          {applications.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              No applications yet. Add one here, or use "Add to tracker" in the Job Match panel.
            </p>
          )}

          {view === 'board' && applications.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
                {STATUS_ORDER.map((status) => (
                  <Column key={status} status={status} title={STATUS_LABEL[status]} count={columns[status].length}>
                    {columns[status].map((app) => (
                      <Card key={app.id} app={app} resumeTitle={resumeTitle(app.tailoredResumeId)} onOpenResume={openResume} onDelete={() => deleteApplication(app.id)} onNotes={(notes) => updateApplication(app.id, { notes })} />
                    ))}
                  </Column>
                ))}
              </div>
            </DndContext>
          )}

          {view === 'table' && applications.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-2 pr-3">{header('company', 'Company')}</th>
                    <th className="py-2 pr-3">{header('role', 'Role')}</th>
                    <th className="py-2 pr-3">{header('status', 'Status')}</th>
                    <th className="py-2 pr-3">{header('matchScore', 'Match')}</th>
                    <th className="py-2 pr-3">Resume</th>
                    <th className="py-2 pr-3">{header('lastUpdated', 'Updated')}</th>
                    <th className="py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((app) => (
                    <tr key={app.id} className="border-b border-border align-top">
                      <td className="py-2 pr-3 text-foreground">{app.company}</td>
                      <td className="py-2 pr-3 text-foreground">{app.role}</td>
                      <td className="py-2 pr-3">
                        <select aria-label={`Status for ${app.company}`} value={app.status} onChange={(e) => updateApplication(app.id, { status: e.target.value as ApplicationStatus })} className="bg-background border border-border rounded-md px-2 py-1">
                          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-3 font-mono">{app.matchScore !== undefined ? `${app.matchScore}%` : '—'}</td>
                      <td className="py-2 pr-3">
                        {app.tailoredResumeId && resumeTitle(app.tailoredResumeId) ? (
                          <button type="button" onClick={() => openResume(app.tailoredResumeId!)} className="inline-flex items-center gap-1 text-brand hover:underline">
                            <FileText className="w-3 h-3" /> {resumeTitle(app.tailoredResumeId)}
                          </button>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-3 font-mono text-muted-foreground">{new Date(app.lastUpdated).toLocaleDateString()}</td>
                      <td className="py-2"><button type="button" onClick={() => deleteApplication(app.id)} className={`${iconButton} hover:text-destructive`} aria-label={`Delete ${app.company}`}><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Column: React.FC<{ status: ApplicationStatus; title: string; count: number; children: React.ReactNode }> = ({ status, title, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} aria-label={`${title} column, ${count} applications`} className={`rounded-xl border p-2 min-h-[120px] space-y-2 ${isOver ? 'border-brand bg-brand/5' : 'border-border bg-background'}`}>
      <header className="flex items-center justify-between px-1">
        <span className="text-[11px] font-medium text-foreground">{title}</span>
        <span className="text-[11px] font-mono text-muted-foreground">{count}</span>
      </header>
      {children}
    </section>
  );
};

const Card: React.FC<{
  app: JobApplication;
  resumeTitle?: string;
  onOpenResume: (id: string) => void;
  onDelete: () => void;
  onNotes: (notes: string) => void;
}> = ({ app, resumeTitle, onOpenResume, onDelete, onNotes }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: app.id });
  const [notesOpen, setNotesOpen] = useState(false);
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform) }} className={`bg-card border border-border rounded-lg p-2 space-y-1 text-xs ${isDragging ? 'opacity-70 shadow-lifted' : ''}`}>
      <div className="flex items-start gap-1">
        <button type="button" {...attributes} {...listeners} aria-label={`Move ${app.company}`} className="cursor-grab touch-none text-muted-foreground min-h-[28px] px-1">⠿</button>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground truncate">{app.company}</div>
          <div className="text-muted-foreground truncate">{app.role}</div>
        </div>
      </div>
      {app.matchScore !== undefined && <div className="font-mono text-[11px] text-brand">match {app.matchScore}%</div>}
      {resumeTitle && app.tailoredResumeId && (
        <button type="button" onClick={() => onOpenResume(app.tailoredResumeId!)} className="text-[11px] text-brand hover:underline truncate block max-w-full text-left">
          Resume: {resumeTitle}
        </button>
      )}
      <div className="flex items-center justify-between gap-1">
        <button type="button" onClick={() => setNotesOpen((o) => !o)} className="text-[11px] text-muted-foreground hover:text-foreground min-h-[28px]">{app.notes ? 'Notes' : 'Add note'}</button>
        <button type="button" onClick={onDelete} className={`${iconButton} min-h-[28px] min-w-[28px] hover:text-destructive`} aria-label={`Delete ${app.company}`}><Trash2 className="w-3 h-3" /></button>
      </div>
      {notesOpen && (
        <textarea aria-label={`Notes for ${app.company}`} defaultValue={app.notes ?? ''} onBlur={(e) => onNotes(e.target.value)} rows={2} className="w-full bg-background border border-border rounded-md p-1.5 text-[11px]" />
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div>
    <div className="text-lg font-bold font-mono text-foreground">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);
