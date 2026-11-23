/**
 * The Markdown text editor (CodeMirror). Loaded on demand: the form is the default editor,
 * so the CodeMirror code is not part of the startup bundle.
 */

import { forwardRef } from 'react';
import CodeMirror, { ReactCodeMirrorRef, ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

type Props = ReactCodeMirrorProps & { dark: boolean };

const MarkdownCodeMirror = forwardRef<ReactCodeMirrorRef, Props>(function MarkdownCodeMirror({ dark, ...props }, ref) {
  return (
    <CodeMirror
      ref={ref}
      theme={dark ? oneDark : 'light'}
      extensions={[markdownLang()]}
      // Name the editable area, so screen readers announce what it is
      onCreateEditor={(view) => view.contentDOM.setAttribute('aria-label', 'Resume text in Markdown')}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        syntaxHighlighting: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
      }}
      {...props}
    />
  );
});

export default MarkdownCodeMirror;
