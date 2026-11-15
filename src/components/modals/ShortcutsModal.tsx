import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { X, HelpCircle, Copy, Check } from 'lucide-react';
import { ICON_SVGS } from '../../parser/iconMap';

export const ShortcutsModal: React.FC = () => {
  const { activeModal, setActiveModal } = useResumeStore();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (activeModal !== 'shortcuts') return null;

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 rounded-t-xl">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Markdown & Icon Shortcuts</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {/* Section 1: Two Column Layout */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <span>1. Two-Column Layout (Header / Skills)</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Wrap left and right blocks in containers to create clean two-column contact headers or divided skill matrices:
            </p>
            <div className="relative bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-blue-700 dark:text-blue-300">
              <pre className="whitespace-pre-wrap">{`::: left
[icon:email alex@example.com](mailto:alex@example.com)
[icon:phone +1 555-0192](tel:+15550192)
:::

::: right
[icon:linkedin linkedin.com/in/alex](https://linkedin.com)
[icon:github github.com/alex](https://github.com)
:::`}</pre>
              <button
                onClick={() =>
                  copySnippet(
                    '::: left\n[icon:email user@domain.com](mailto:user@domain.com)\n:::\n\n::: right\n[icon:linkedin linkedin.com/in/user](https://linkedin.com)\n:::',
                    'col-sample'
                  )
                }
                className="absolute top-2 right-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-800"
              >
                {copiedKey === 'col-sample' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Section 2: Icons Library */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              <span>2. Supported Professional Icons</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Click any icon to copy its Markdown tag:
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.keys(ICON_SVGS).map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => copySnippet(`[icon:${iconName} Link Text](https://...)`, iconName)}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition text-left group"
                >
                  <span
                    className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"
                    dangerouslySetInnerHTML={{ __html: ICON_SVGS[iconName] }}
                  />
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                    {iconName}
                  </span>
                  {copiedKey === iconName ? (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-auto" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Skill Pills */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              <span>3. Skills Badges & Pills</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Wrap technologies in backticks to turn them into styled pill chips:
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-purple-700 dark:text-purple-300">
              `React` `TypeScript` `Go` `Kubernetes` `PostgreSQL`
            </div>
          </div>

          {/* Section 4: ATS Best Practices */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              <span>4. ATS (Applicant Tracking System) Tips</span>
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <li>Use standard section titles: <code className="text-blue-600 dark:text-blue-300">## Work Experience</code>, <code className="text-blue-600 dark:text-blue-300">## Education</code>, <code className="text-blue-600 dark:text-blue-300">## Technical Skills</code>.</li>
              <li>Quantify achievements with bold numbers: <strong className="text-slate-800 dark:text-slate-200">"Reduced latency by 42%"</strong> or <strong className="text-slate-800 dark:text-slate-200">"Generated $1.2M in annual savings"</strong>.</li>
              <li>When printing/saving to PDF, choose <strong>"Save as PDF"</strong> in Chrome/Edge/Safari with <strong>Margins: None or Default</strong> and <strong>Background Graphics: Enabled</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/60 rounded-b-xl">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
