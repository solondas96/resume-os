/**
 * The one inspector: Health, Match, Design and History, as tabs. It replaces the separate
 * side panels and modals for these, so there is one place to look.
 */

import React from 'react';
import { X } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { InspectorTab } from '../../types';
import { BulletLinterDrawer } from '../audit/BulletLinterDrawer';
import { JobMatchPanel } from '../match/JobMatchPanel';
import { DesignPanel } from '../design/DesignPanel';
import { HistoryPanel } from '../modals/HistoryModal';
import { DataPanel } from '../data/DataPanel';

const TABS: { id: InspectorTab; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'match', label: 'Match' },
  { id: 'design', label: 'Design' },
  { id: 'history', label: 'History' },
];

export const Inspector: React.FC = () => {
  const inspectorTab = useResumeStoreV2((s) => s.inspectorTab);
  const openInspector = useResumeStoreV2((s) => s.openInspector);
  const closeInspector = useResumeStoreV2((s) => s.closeInspector);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  if (!inspectorTab) return null;

  // Arrow keys move between tabs, as in any tab list
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    openInspector(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  return (
    <aside
      aria-label="Inspector"
      className="no-print fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[420px] bg-card border-l border-border shadow-lifted flex flex-col"
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Inspector</h2>
        <button
          onClick={() => closeInspector()}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div role="tablist" aria-label="Inspector sections" className="flex border-b border-border px-2">
        {TABS.map((tab, index) => {
          const selected = tab.id === inspectorTab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              id={`inspector-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls="inspector-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => openInspector(tab.id)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 -mb-px transition ${
                selected ? 'border-brand text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="inspector-panel"
        aria-labelledby={`inspector-tab-${inspectorTab}`}
        className="flex-1 min-h-0 flex flex-col"
      >
        {inspectorTab === 'health' && <BulletLinterDrawer embedded />}
        {inspectorTab === 'match' && <JobMatchPanel embedded />}
        {inspectorTab === 'design' && <DesignPanel embedded isOpen onClose={closeInspector} />}
        {inspectorTab === 'history' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <HistoryPanel />
            <div className="border-t border-border">
              <DataPanel />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
