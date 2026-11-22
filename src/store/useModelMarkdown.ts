import { useMemo } from 'react';
import { useResumeStoreV2 } from './useResumeStoreV2';
import { resumeToMarkdown } from '../model/serialize';
import { forOutput } from '../model/edit';

/**
 * The current resume as Markdown, rendered from the structured model.
 * Used for the preview, the share link and exports. The editor's own text
 * buffer is not used here, so the model is the single source for every output.
 */
export function useModelMarkdown(): string {
  const currentResume = useResumeStoreV2((s) => s.currentResume);
  // Hidden sections and bullets are left out of every output (the form still shows them)
  return useMemo(() => (currentResume ? resumeToMarkdown(forOutput(currentResume)) : ''), [currentResume]);
}
