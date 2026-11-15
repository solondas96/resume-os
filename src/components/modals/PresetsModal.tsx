import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { ROLE_PRESETS } from '../../data/rolePresets';
import {
  X,
  Sparkles,
  Check,
  Code,
  Palette,
  Briefcase,
  GraduationCap
} from 'lucide-react';

export const PresetsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    setMarkdown,
    setTheme,
    setAccentColor,
    setDocumentTitle,
    saveRevision
  } = useResumeStore();

  if (activeModal !== 'presets') return null;

  const handleSelectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    saveRevision(`Before loading ${preset.roleName}`);
    setMarkdown(preset.markdown);
    setTheme(preset.theme);
    setAccentColor(preset.accentColor);
    setDocumentTitle(`${preset.candidateName} - Resume`);
    saveRevision(`Loaded ${preset.roleName} Preset`);
    setActiveModal(null);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'code':
        return <Code className="w-5 h-5 text-blue-400" />;
      case 'palette':
        return <Palette className="w-5 h-5 text-purple-400" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5 text-amber-400" />;
      case 'graduation-cap':
        return <GraduationCap className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Starter Role Presets</h2>
              <p className="text-xs text-slate-400">
                Choose a battle-tested professional English resume blueprint crafted for your field.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 rounded-xl p-5 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 group-hover:scale-105 transition">
                      {getPresetIcon(preset.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition">
                        {preset.roleName}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {preset.candidateName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                    {preset.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {preset.description}
                </p>

                <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                    Color
                  </span>
                  <span>•</span>
                  <span className="capitalize">Theme: {preset.theme}</span>
                  <span>•</span>
                  <span>STAR Format</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => handleSelectPreset(preset)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use This Blueprint</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Loading a preset replaces your editor content. (A revision backup will be automatically saved).</span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
