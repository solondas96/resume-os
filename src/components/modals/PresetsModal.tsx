import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { ROLE_PRESETS } from '../../data/rolePresets';
import {
  X,
  Sparkles,
  Code,
  Palette,
  Briefcase,
  GraduationCap,
  Cpu,
  Database,
  Users,
  Server,
  BookOpen,
  Megaphone
} from 'lucide-react';

export const PresetsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    setMarkdown,
    setTheme,
    setAccentColor,
    setDocumentTitle,
    saveRevision,
    currentResume,
    createResume,
  } = useResumeStoreV2();

  if (activeModal !== 'presets') return null;

  const handleSelectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    const title = `${preset.candidateName} - Resume`;
    if (!currentResume) {
      // First run: there is no resume yet, so create one from the preset
      createResume(title, preset.markdown, preset.roleName);
    } else {
      saveRevision(`Before loading ${preset.roleName}`);
      setMarkdown(preset.markdown);
      saveRevision(`Loaded ${preset.roleName} Preset`);
    }
    setTheme(preset.theme);
    setAccentColor(preset.accentColor);
    setDocumentTitle(title);
    setActiveModal(null);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'code':
        return <Code className="w-5 h-5 text-brand-text" />;
      case 'palette':
        return <Palette className="w-5 h-5 text-brand-text" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5 text-brand-text" />;
      case 'graduation-cap':
        return <GraduationCap className="w-5 h-5 text-brand-text" />;
      case 'cpu':
        return <Cpu className="w-5 h-5 text-brand-text" />;
      case 'database':
        return <Database className="w-5 h-5 text-brand-text" />;
      case 'users':
        return <Users className="w-5 h-5 text-brand-text" />;
      case 'server':
        return <Server className="w-5 h-5 text-brand-text" />;
      case 'book-open':
        return <BookOpen className="w-5 h-5 text-brand-text" />;
      case 'megaphone':
        return <Megaphone className="w-5 h-5 text-brand-text" />;
      default:
        return <Sparkles className="w-5 h-5 text-brand-text" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-lifted overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent text-accent-foreground border border-brand/20">
              <Sparkles className="w-5 h-5 text-brand-text" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Starter Role Presets</h2>
              <p className="text-xs text-muted-foreground">
                Choose a professional resume blueprint crafted for your field.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="p-5 rounded-2xl border border-border bg-card hover:bg-muted/40 hover:border-brand/40 shadow-card transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      {getPresetIcon(preset.iconName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-text transition">
                        {preset.roleName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{preset.candidateName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                    {preset.theme}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    {preset.badge}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Click to load blueprint</span>
                <span className="text-xs font-medium text-brand-text group-hover:underline flex items-center gap-1">
                  Use Preset →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Loading a preset preserves previous edits in your revision history.</span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
