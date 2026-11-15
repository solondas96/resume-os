import React from 'react';
import { ParsedResume } from '../../services/parsing';
import { CheckCircle2, Briefcase, Wrench, FileText } from 'lucide-react';

interface ParsedResumeCardProps {
  parsedResume: ParsedResume;
  rawText: string;
  onApply?: () => void;
  className?: string;
}

export const ParsedResumeCard: React.FC<ParsedResumeCardProps> = ({
  parsedResume,
  rawText,
  onApply,
  className = '',
}) => {
  // Derive text directly from prop (no frozen useState)
  const text = rawText || parsedResume.rawText || '';

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 text-foreground shadow-card transition-all duration-200 ${className}`}
    >
      {/* Header with Title and Eyebrow */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground block mb-1">
            Parsed Resume Structure
          </span>
          <h3 className="text-lg font-semibold tracking-tight text-foreground [text-wrap:balance]">
            {parsedResume.summary.slice(0, 80)}...
          </h3>
        </div>

        {parsedResume.experienceYears && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
            <Briefcase className="w-3.5 h-3.5 text-brand" />
            <span>{parsedResume.experienceYears}+ Years</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4">
        <label className="text-xs font-medium text-foreground mb-1 block">Summary</label>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {parsedResume.summary}
        </p>
      </div>

      {/* Skills Pill Cloud */}
      {parsedResume.skills.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-brand" />
              Detected Skills ({parsedResume.skills.length})
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {parsedResume.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-foreground border border-border"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parsed Sections */}
      {parsedResume.sections.length > 0 && (
        <div className="mt-5 space-y-3">
          <label className="text-xs font-medium text-foreground block">
            Extracted Sections ({parsedResume.sections.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {parsedResume.sections.map((sec) => (
              <div
                key={sec.name}
                className="p-3 rounded-xl bg-background border border-border text-xs"
              >
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>{sec.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {sec.content.length} items
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1 text-muted-foreground list-disc list-inside">
                  {sec.content.slice(0, 2).map((item, i) => (
                    <li key={i} className="truncate">
                      {item}
                    </li>
                  ))}
                  {sec.content.length > 2 && (
                    <li className="text-[10px] italic text-muted-foreground/75 list-none">
                      +{sec.content.length - 2} more items
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source preview footer */}
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-mono">
          <FileText className="w-3.5 h-3.5" />
          <span>{text.split(/\s+/).filter(Boolean).length} words</span>
        </div>

        {onApply && (
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-hidden transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
            <span>Apply to Resume</span>
          </button>
        )}
      </div>
    </div>
  );
};
