/**
 * Job application tracker: add, update status and notes, remove, and see conversion stats.
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Briefcase } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { ApplicationStatus } from '../../model/tracker';

const STATUSES: ApplicationStatus[] = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];

export const TrackerModal: React.FC = () => {
  const activeModal = useResumeStoreV2((s) => s.activeModal);
  const setActiveModal = useResumeStoreV2((s) => s.setActiveModal);
  const applications = useResumeStoreV2((s) => s.applications);
  const stats = useResumeStoreV2((s) => s.stats);
  const addApplication = useResumeStoreV2((s) => s.addApplication);
  const updateApplication = useResumeStoreV2((s) => s.updateApplication);
  const deleteApplication = useResumeStoreV2((s) => s.deleteApplication);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  if (activeModal !== 'tracker') return null;

  const handleAdd = () => {
    if (!company.trim() && !role.trim()) return;
    addApplication(company.trim() || 'Unknown company', role.trim() || 'Unknown role');
    setCompany('');
    setRole('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-lifted flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Briefcase className="w-4 h-4 text-brand" />
            <span>Application Tracker</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition"
            aria-label="Close tracker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border grid grid-cols-4 gap-3 text-center">
          <Stat label="Total" value={stats.total} />
          <Stat label="Applied" value={stats.byStatus.applied} />
          <Stat label="Interviews" value={stats.byStatus.interview} />
          <Stat label="Conversion" value={`${Math.round(stats.conversionRate)}%`} />
        </div>

        <div className="px-5 py-3 border-b border-border flex gap-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={handleAdd}
            disabled={!company.trim() && !role.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground disabled:opacity-40 text-xs font-medium rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {applications.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              No applications yet. Add one here, or use "Add to tracker" in the Job Match panel.
            </p>
          )}
          {applications.map((app) => (
            <div key={app.id} className="bg-background border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{app.role}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {app.company}
                    {app.matchScore !== undefined && <span className="font-mono"> · match {app.matchScore}%</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={app.status}
                    onChange={(e) => updateApplication(app.id, { status: e.target.value as ApplicationStatus, ...(e.target.value === 'applied' && !app.appliedAt ? { appliedAt: Date.now() } : {}) })}
                    className="bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground"
                    aria-label={`Status for ${app.role} at ${app.company}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition"
                    aria-label="Delete application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                value={app.notes ?? ''}
                onChange={(e) => updateApplication(app.id, { notes: e.target.value })}
                placeholder="Notes"
                className="w-full bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-hidden"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div>
    <div className="text-lg font-bold font-mono text-foreground">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);
