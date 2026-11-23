import React from 'react';
import { useResumeStoreV2 } from '../../store/useResumeStoreV2';
import { X, HelpCircle, Copy, Check } from 'lucide-react';
import { ICON_SVGS } from '../../parser/iconMap';

export const ShortcutsModal: React.FC = () => {
  const { activeModal, setActiveModal, openTour } = useResumeStoreV2();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (activeModal !== 'shortcuts') return null;

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-lifted flex flex-col max-h-[85vh] transition-colors duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-brand-text" />
            <span>Markdown & Icon Shortcuts</span>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveModal(null);
              openTour();
            }}
            className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium"
          >
            Take the tour again
          </button>
          <button
            onClick={() => setActiveModal(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-foreground">
          {/* Section 1: Two Column Layout */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">
              1. Two-Column Layout (Header / Skills)
            </h3>
            <p className="text-muted-foreground">
              Wrap left and right blocks in containers to create clean two-column contact headers or divided skill matrices:
            </p>
            <div className="relative bg-background p-3.5 rounded-xl border border-border font-mono text-[11px] text-foreground">
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
                className="absolute top-3 right-3 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition"
                title="Copy snippet"
              >
                {copiedKey === 'col-sample' ? (
                  <Check className="w-3.5 h-3.5 text-brand-text" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Interactive SVG Contact Icons */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">
              2. Available Icon Tags
            </h3>
            <p className="text-muted-foreground">
              Embed clean inline icons by typing <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">icon:name</code> or clickable icon links <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">[icon:name Label](url)</code>:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {Object.keys(ICON_SVGS).map((iconName) => (
                <div
                  key={iconName}
                  onClick={() => copySnippet(`icon:${iconName}`, iconName)}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-background hover:bg-muted transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 text-brand-text inline-flex items-center"
                      dangerouslySetInnerHTML={{ __html: ICON_SVGS[iconName] }}
                    />
                    <span className="font-mono text-[11px] text-foreground">
                      icon:{iconName}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                    {copiedKey === iconName ? 'Copied' : 'Copy'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Skill Pills & Formatting */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">
              3. Skill Badges & Manual Page Breaks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                <span className="font-medium text-foreground">Skill Pills:</span>
                <p className="text-muted-foreground text-[11px]">
                  Surround any technology or keyword with backticks <code className="bg-muted px-1 rounded text-foreground font-mono">`Python`</code> to automatically render as a styled badge.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                <span className="font-medium text-foreground">Manual Page Break:</span>
                <p className="text-muted-foreground text-[11px]">
                  Insert <code className="bg-muted px-1 rounded text-foreground font-mono">::: page-break :::</code> or <code className="bg-muted px-1 rounded text-foreground font-mono">---page-break---</code> to force following text onto Page 2 in prints.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3 bg-card">
          <p className="text-[11px] text-muted-foreground">
            About data: skill and job-title names from O*NET 29.1 (CC BY 4.0). Everything is processed in your browser. See ATTRIBUTIONS.md.
          </p>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
