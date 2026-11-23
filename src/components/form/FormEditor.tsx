/**
 * The default editor. Edits the structured model directly: basics, sections,
 * entries and bullets, with drag-to-reorder (keyboard accessible) and inline findings.
 */

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Eye, EyeOff, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { Resume, Section, SectionKind, YearMonth, Bullet, ExperienceItem, EducationItem, ProjectItem, SkillGroup, Line, ContactLink } from '../../model/resume';
import * as edit from '../../model/edit';
import { bulletFindings, findingsByBullet, Finding } from '../../intelligence/findings';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const inputClass =
  'w-full bg-background border border-border rounded-lg px-2.5 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30 focus:border-brand';
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';
const iconButton =
  'min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition';

// ---- small controls ----------------------------------------------------------

/** Text input that updates the model on every keystroke */
const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}) => (
  <label className="block min-w-0">
    <span className={labelClass}>{label}</span>
    <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
  </label>
);

/** Text input that commits on blur or Enter, so typing a comma does not split the list mid-word */
const DraftField: React.FC<{ label: string; value: string; onCommit: (v: string) => void; placeholder?: string }> = ({
  label,
  value,
  onCommit,
  placeholder,
}) => {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? draft : value;
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <input
        value={shown}
        placeholder={placeholder}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setFocused(false);
          if (draft !== value) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className={inputClass}
      />
    </label>
  );
};

/** Month and year picker with a "Present" option for end dates */
export const DateField: React.FC<{
  label: string;
  value: YearMonth | 'present' | undefined;
  allowPresent?: boolean;
  onChange: (v: YearMonth | 'present' | undefined) => void;
}> = ({ label, value, allowPresent = false, onChange }) => {
  const isPresent = value === 'present';
  const ym = typeof value === 'object' ? value : undefined;
  const yearValue = ym ? String(ym.year) : '';
  return (
    <fieldset className="min-w-0">
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {isPresent ? (
          <span className="text-sm text-foreground px-2 py-2">Present</span>
        ) : (
          <>
            <select
              aria-label={`${label} month`}
              value={ym?.month ?? ''}
              onChange={(e) => {
                const month = e.target.value ? parseInt(e.target.value, 10) : undefined;
                onChange(ym ? { ...ym, month } : undefined);
              }}
              className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground min-h-[40px]"
            >
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <input
              aria-label={`${label} year`}
              inputMode="numeric"
              value={yearValue}
              placeholder="Year"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (!digits) return onChange(undefined);
                onChange({ year: parseInt(digits, 10), month: ym?.month });
              }}
              className="w-24 bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground min-h-[40px]"
            />
          </>
        )}
        {allowPresent && (
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground min-h-[40px]">
            <input
              type="checkbox"
              checked={isPresent}
              onChange={(e) => onChange(e.target.checked ? 'present' : { year: new Date().getFullYear() })}
            />
            Present
          </label>
        )}
      </div>
    </fieldset>
  );
};

const DragHandle: React.FC<{ label: string; listeners?: any; attributes?: any }> = ({ label, listeners, attributes }) => (
  <button
    type="button"
    aria-label={label}
    title="Drag to reorder (or focus and press Space, then the arrow keys)"
    className={`${iconButton} cursor-grab active:cursor-grabbing touch-none`}
    {...attributes}
    {...listeners}
  >
    <GripVertical className="w-4 h-4" />
  </button>
);

/** A sortable row: wraps children with the dnd-kit transform */
const Sortable: React.FC<{ id: string; children: (handle: { listeners: any; attributes: any }) => React.ReactNode }> = ({
  id,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${isDragging ? 'opacity-70 shadow-lifted rounded-xl' : ''}`}
    >
      {children({ listeners, attributes })}
    </div>
  );
};

/** Wire a DndContext to a list: calls onMove(from, to) with indices */
function useReorder(ids: string[], onMove: (from: number, to: number) => void) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  };
  return { sensors, handleEnd };
}

// ---- findings ----------------------------------------------------------------

const DOT: Record<string, string> = {
  warning: 'bg-destructive',
  suggestion: 'bg-brand',
  info: 'bg-muted-foreground/60',
};

const BulletRow: React.FC<{
  sectionId: string;
  itemId: string;
  bullet: Bullet;
  index: number;
  findings: Finding[];
  onText: (text: string) => void;
  onRemove: () => void;
  onToggleHidden: () => void;
  onImprove: () => void;
}> = ({ bullet, findings, onText, onRemove, onToggleHidden, onImprove }) => {
  const [open, setOpen] = useState(false);
  const finding = findings[0];
  return (
    <div className={`flex items-start gap-1.5 ${bullet.hidden ? 'opacity-50' : ''}`}>
      <div className="pt-1.5 w-4 shrink-0 flex justify-center">
        {finding ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={`${finding.severity}: ${finding.message}`}
            aria-expanded={open}
            className={`w-2.5 h-2.5 rounded-full ${DOT[finding.severity]} ring-2 ring-transparent focus:ring-brand/40`}
          />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" aria-label="No findings" title="No findings" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <textarea
          aria-label="Bullet text"
          value={bullet.text}
          rows={2}
          onChange={(e) => onText(e.target.value)}
          className={`${inputClass} resize-y min-h-[44px]`}
        />
        {open && findings.length > 0 && (
          <div className="text-xs bg-muted/60 border border-border rounded-lg p-2.5 space-y-2" role="note">
            {findings.map((f) => (
              <div key={f.id} className="space-y-0.5">
                <div className="text-foreground">{f.message}</div>
                <div className="text-muted-foreground">{f.why}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          <button type="button" onClick={onImprove} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-brand-text hover:bg-brand/10 transition min-h-[32px]">
            <Sparkles className="w-3.5 h-3.5" />
            Improve
          </button>
          <button type="button" onClick={onToggleHidden} className={`${iconButton} min-h-[32px] min-w-[32px]`} aria-label={bullet.hidden ? 'Show bullet' : 'Hide bullet'}>
            {bullet.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onRemove} className={`${iconButton} min-h-[32px] min-w-[32px] hover:text-destructive`} aria-label="Remove bullet">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- entries -----------------------------------------------------------------

const EntryEditor: React.FC<{
  section: Section;
  item: ExperienceItem | EducationItem | ProjectItem;
  findings: Map<string, Finding[]>;
}> = ({ section, item, findings }) => {
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const openBulletBuilder = useResumeStoreV2((s) => s.openBulletBuilder);
  const sectionId = section.id;
  const itemId = item.id;
  const bulletIds = item.bullets.map((b) => b.id);
  const { sensors, handleEnd } = useReorder(bulletIds, (from, to) =>
    updateModel((r) => edit.moveBullet(r, sectionId, itemId, from, to))
  );

  const patch = (fields: Record<string, unknown>) =>
    updateModel((r) => edit.mapItem(r, sectionId, itemId, (it) => ({ ...it, ...fields }) as any));

  return (
    <div className="border border-border rounded-xl p-3 space-y-3 bg-background">
      {section.kind === 'experience' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Company" value={(item as ExperienceItem).company} onChange={(v) => patch({ company: v })} />
          <Field label="Role" value={(item as ExperienceItem).role} onChange={(v) => patch({ role: v })} />
          <Field label="Location" value={(item as ExperienceItem).location ?? ''} onChange={(v) => patch({ location: v || undefined })} />
        </div>
      )}
      {section.kind === 'education' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="School" value={(item as EducationItem).school} onChange={(v) => patch({ school: v })} />
          <Field label="Degree" value={(item as EducationItem).degree ?? ''} onChange={(v) => patch({ degree: v || undefined })} />
        </div>
      )}
      {section.kind === 'projects' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Project" value={(item as ProjectItem).title} onChange={(v) => patch({ title: v })} />
          <Field label="Subtitle" value={(item as ProjectItem).subtitle ?? ''} onChange={(v) => patch({ subtitle: v || undefined })} />
          <Field
            label="Link label"
            value={(item as ProjectItem).link?.label ?? ''}
            onChange={(v) => patch({ link: { ...((item as ProjectItem).link ?? { url: '' }), label: v } })}
          />
          <Field
            label="Link URL"
            value={(item as ProjectItem).link?.url ?? ''}
            onChange={(v) => patch({ link: { ...((item as ProjectItem).link ?? { label: '' }), url: v, icon: edit.detectIcon(v) } })}
          />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <DateField label="Start" value={item.start} onChange={(v) => patch({ start: v === 'present' ? undefined : v })} />
        <DateField
          label="End"
          value={item.end}
          allowPresent
          onChange={(v) => patch({ end: v })}
        />
      </div>

      <DraftField
        label="Tags (comma separated)"
        value={item.tags.join(', ')}
        placeholder="Go, Kafka, Postgres"
        onCommit={(v) => patch({ tags: edit.skillsFromText(v) })}
      />

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Bullets</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
          <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
            {item.bullets.map((b, index) => (
              <Sortable key={b.id} id={b.id}>
                {({ listeners, attributes }) => (
                  <div className="flex items-start gap-1">
                    <div className="pt-1.5"><DragHandle label={`Reorder bullet ${index + 1}`} listeners={listeners} attributes={attributes} /></div>
                    <div className="flex-1 min-w-0">
                      <BulletRow
                        sectionId={sectionId}
                        itemId={itemId}
                        bullet={b}
                        index={index}
                        findings={findings.get(b.id) ?? []}
                        onText={(text) => updateModel((r) => edit.mapBullet(r, sectionId, itemId, b.id, (x) => ({ ...x, text })))}
                        onRemove={() => updateModel((r) => edit.mapBullet(r, sectionId, itemId, b.id, () => null))}
                        onToggleHidden={() => updateModel((r) => edit.setBulletHidden(r, sectionId, itemId, b.id, !b.hidden))}
                        onImprove={() => openBulletBuilder(b.text)}
                      />
                    </div>
                  </div>
                )}
              </Sortable>
            ))}
          </SortableContext>
        </DndContext>
        <button
          type="button"
          onClick={() => updateModel((r) => edit.addBullet(r, sectionId, itemId, ''))}
          className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" /> Add bullet
        </button>
      </div>
    </div>
  );
};

// ---- sections ----------------------------------------------------------------

const SkillsEditor: React.FC<{ section: Extract<Section, { kind: 'skills' }> }> = ({ section }) => {
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const setGroup = (groupId: string, fields: Partial<SkillGroup>) =>
    updateModel((r) => edit.mapSection(r, section.id, (s) => (s.kind === 'skills' ? { ...s, groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...fields } : g)) } : s)));
  return (
    <div className="space-y-3">
      {section.groups.map((g) => (
        <div key={g.id} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-end">
          <Field label="Group label" value={g.label} onChange={(v) => setGroup(g.id, { label: v })} placeholder="Languages" />
          <DraftField label="Skills (comma separated)" value={g.skills.join(', ')} onCommit={(v) => setGroup(g.id, { skills: edit.skillsFromText(v) })} />
          <button
            type="button"
            aria-label="Remove group"
            onClick={() => updateModel((r) => edit.mapSection(r, section.id, (s) => (s.kind === 'skills' ? { ...s, groups: s.groups.filter((x) => x.id !== g.id) } : s)))}
            className={`${iconButton} hover:text-destructive`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => updateModel((r) => edit.mapSection(r, section.id, (s) => (s.kind === 'skills' ? { ...s, groups: [...s.groups, edit.newGroup('')] } : s)))}
        className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline min-h-[36px]"
      >
        <Plus className="w-3.5 h-3.5" /> Add skill group
      </button>
    </div>
  );
};

const LinesEditor: React.FC<{ section: Extract<Section, { kind: 'custom' | 'certifications' }> }> = ({ section }) => {
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const setLines = (fn: (lines: Line[]) => Line[]) =>
    updateModel((r) => edit.mapSection(r, section.id, (s) => (s.kind === 'custom' || s.kind === 'certifications' ? { ...s, lines: fn(s.lines) } : s)));
  return (
    <div className="space-y-2">
      {section.lines.map((line) => (
        <div key={line.id} className="flex items-center gap-2">
          <select
            aria-label="Line type"
            value={line.kind}
            onChange={(e) => setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, kind: e.target.value as Line['kind'] } : l)))}
            className="bg-background border border-border rounded-lg px-2 py-2 text-xs min-h-[40px]"
          >
            <option value="bullet">Bullet</option>
            <option value="text">Text</option>
          </select>
          {line.kind === 'pagebreak' ? (
            <span className="text-xs text-muted-foreground flex-1">Page break</span>
          ) : (
            <input
              aria-label="Line text"
              value={line.text}
              onChange={(e) => setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, text: e.target.value } : l)))}
              className={inputClass}
            />
          )}
          <button type="button" aria-label="Remove line" onClick={() => setLines((ls) => ls.filter((l) => l.id !== line.id))} className={`${iconButton} hover:text-destructive`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setLines((ls) => [...ls, edit.newLine('bullet', '')])} className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline min-h-[36px]">
        <Plus className="w-3.5 h-3.5" /> Add line
      </button>
    </div>
  );
};

const SummaryEditor: React.FC<{ section: Extract<Section, { kind: 'summary' }> }> = ({ section }) => {
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const setParagraphs = (fn: (p: string[]) => string[]) =>
    updateModel((r) => edit.mapSection(r, section.id, (s) => (s.kind === 'summary' ? { ...s, paragraphs: fn(s.paragraphs) } : s)));
  return (
    <div className="space-y-2">
      {section.paragraphs.map((p, i) => (
        <textarea
          key={i}
          aria-label={`Summary paragraph ${i + 1}`}
          value={p}
          rows={3}
          onChange={(e) => setParagraphs((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))}
          className={`${inputClass} resize-y`}
        />
      ))}
      <button type="button" onClick={() => setParagraphs((ps) => [...ps, ''])} className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline min-h-[36px]">
        <Plus className="w-3.5 h-3.5" /> Add paragraph
      </button>
    </div>
  );
};

const SectionCard: React.FC<{ section: Section; findings: Map<string, Finding[]>; handle: { listeners: any; attributes: any } }> = ({
  section,
  findings,
  handle,
}) => {
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const [collapsed, setCollapsed] = useState(false);
  const itemIds = section.kind === 'experience' || section.kind === 'education' || section.kind === 'projects' ? section.items.map((i) => i.id) : [];
  const { sensors, handleEnd } = useReorder(itemIds, (from, to) => updateModel((r) => edit.moveItem(r, section.id, from, to)));

  const addEntry = () => {
    if (section.kind !== 'experience' && section.kind !== 'education' && section.kind !== 'projects') return;
    updateModel((r) => edit.mapSection(r, section.id, (s) => ({ ...s, items: [...(s as any).items, edit.newEntry(section.kind as any)] }) as Section));
  };

  return (
    <section className={`border border-border rounded-2xl bg-card shadow-card ${section.hidden ? 'opacity-60' : ''}`} aria-label={`Section ${section.title}`}>
      <header className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <DragHandle label={`Reorder section ${section.title}`} listeners={handle.listeners} attributes={handle.attributes} />
        <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand section' : 'Collapse section'} className={iconButton}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <input
          aria-label="Section title"
          value={section.title}
          onChange={(e) => updateModel((r) => edit.mapSection(r, section.id, (s) => ({ ...s, title: e.target.value })))}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/30 rounded px-1 py-1"
        />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline">{section.kind}</span>
        <button
          type="button"
          aria-label={section.hidden ? 'Show section' : 'Hide section'}
          onClick={() => updateModel((r) => edit.setSectionHidden(r, section.id, !section.hidden))}
          className={iconButton}
        >
          {section.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button type="button" aria-label="Delete section" onClick={() => updateModel((r) => edit.removeSection(r, section.id))} className={`${iconButton} hover:text-destructive`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {(section.kind === 'experience' || section.kind === 'education' || section.kind === 'projects') && (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                  {section.items.map((item, index) => (
                    <Sortable key={item.id} id={item.id}>
                      {({ listeners, attributes }) => (
                        <div className="flex items-start gap-2">
                          <div className="pt-3"><DragHandle label={`Reorder entry ${index + 1}`} listeners={listeners} attributes={attributes} /></div>
                          <div className="flex-1 min-w-0">
                            <EntryEditor section={section} item={item} findings={findings} />
                          </div>
                          <button
                            type="button"
                            aria-label="Remove entry"
                            onClick={() => updateModel((r) => edit.mapSection(r, section.id, (s) => ({ ...s, items: (s as any).items.filter((x: any) => x.id !== item.id) }) as Section))}
                            className={`${iconButton} hover:text-destructive mt-3`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Sortable>
                  ))}
                </SortableContext>
              </DndContext>
              <button type="button" onClick={addEntry} className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline min-h-[36px]">
                <Plus className="w-3.5 h-3.5" /> Add {section.kind === 'experience' ? 'role' : section.kind === 'education' ? 'school' : 'project'}
              </button>
            </>
          )}
          {section.kind === 'skills' && <SkillsEditor section={section} />}
          {(section.kind === 'custom' || section.kind === 'certifications') && <LinesEditor section={section} />}
          {section.kind === 'summary' && <SummaryEditor section={section} />}
        </div>
      )}
    </section>
  );
};

// ---- basics ------------------------------------------------------------------

const BasicsCard: React.FC<{ resume: Resume }> = ({ resume }) => {
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const b = resume.basics;
  const setBasics = (fields: Partial<Resume['basics']>) => updateModel((r) => ({ ...r, basics: { ...r.basics, ...fields } }));
  const setLink = (id: string, fields: Partial<ContactLink>) =>
    setBasics({ links: b.links.map((l) => (l.id === id ? { ...l, ...fields } : l)) });

  return (
    <section aria-label="Basics" className="border border-border rounded-2xl bg-card shadow-card p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Basics</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Full name" value={b.name} onChange={(v) => setBasics({ name: v })} />
        <Field label="Headline" value={b.headline ?? ''} placeholder="Staff Software Engineer | Platforms" onChange={(v) => setBasics({ headline: v })} />
        <Field label="Email" type="email" value={b.email ?? ''} onChange={(v) => setBasics({ email: v })} />
        <Field label="Phone" value={b.phone ?? ''} onChange={(v) => setBasics({ phone: v })} />
        <Field label="Location" value={b.location ?? ''} onChange={(v) => setBasics({ location: v })} />
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Links</div>
        {b.links.map((l) => (
          <div key={l.id} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-end">
            <Field label="Label" value={l.label} onChange={(v) => setLink(l.id, { label: v })} />
            <Field label={`URL (icon: ${l.icon ?? 'link'})`} value={l.url} onChange={(v) => setLink(l.id, { url: v, icon: edit.detectIcon(v) })} />
            <button type="button" aria-label="Remove link" onClick={() => setBasics({ links: b.links.filter((x) => x.id !== l.id) })} className={`${iconButton} hover:text-destructive`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setBasics({ links: [...b.links, edit.newLink()] })} className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline min-h-[36px]">
          <Plus className="w-3.5 h-3.5" /> Add link
        </button>
      </div>
    </section>
  );
};

// ---- root --------------------------------------------------------------------

const NEW_SECTION_KINDS: { kind: SectionKind; label: string }[] = [
  { kind: 'experience', label: 'Experience' },
  { kind: 'education', label: 'Education' },
  { kind: 'projects', label: 'Projects' },
  { kind: 'skills', label: 'Skills' },
  { kind: 'summary', label: 'Summary' },
  { kind: 'custom', label: 'Custom' },
];

export const FormEditor: React.FC = () => {
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  const updateModel = useResumeStoreV2((s) => s.updateModel);
  const [newKind, setNewKind] = useState<SectionKind>('experience');
  const [newTitle, setNewTitle] = useState('');

  const findings = useMemo(
    () => (currentResume ? findingsByBullet(bulletFindings(currentResume)) : new Map<string, Finding[]>()),
    [currentResume]
  );
  const sectionIds = currentResume ? currentResume.sections.map((s) => s.id) : [];
  const { sensors, handleEnd } = useReorder(sectionIds, (from, to) => updateModel((r) => edit.moveSection(r, from, to)));

  if (!currentResume) return null;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-background" data-testid="form-editor">
      <BasicsCard resume={currentResume} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {currentResume.sections.map((section) => (
            <Sortable key={section.id} id={section.id}>
              {(handle) => <SectionCard section={section} findings={findings} handle={handle} />}
            </Sortable>
          ))}
        </SortableContext>
      </DndContext>

      <section aria-label="Add a section" className="border border-dashed border-border rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="min-w-0">
          <span className={labelClass}>Section type</span>
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as SectionKind)} className="bg-background border border-border rounded-lg px-2.5 py-2 text-sm min-h-[40px]">
            {NEW_SECTION_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>{k.label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0 flex-1">
          <span className={labelClass}>Title (optional)</span>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Volunteering" className={inputClass} />
        </label>
        <button
          type="button"
          onClick={() => {
            updateModel((r) => ({ ...r, sections: [...r.sections, edit.newSection(newKind, newTitle.trim() || undefined)] }));
            setNewTitle('');
          }}
          className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 min-h-[40px]"
        >
          <Plus className="w-4 h-4" /> Add section
        </button>
      </section>
    </div>
  );
};

export const __test = { Field, DraftField, DateField };
