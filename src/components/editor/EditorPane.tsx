import React, { useCallback, useRef } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useResumeStore } from '../../store/useResumeStore';
import {
  Bold,
  Italic,
  Heading2,
  List,
  Columns,
  Sparkles,
  Save
} from 'lucide-react';

export const EditorPane: React.FC = () => {
  const { markdown: content, setMarkdown, saveRevision } = useResumeStore();
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const insertSnippet = useCallback((snippet: string) => {
    const view = editorRef.current?.view;
    if (!view) {
      setMarkdown(content + '\n' + snippet);
      return;
    }
    const state = view.state;
    const ranges = state.selection.ranges;
    const from = ranges[0].from;
    const to = ranges[0].to;

    view.dispatch({
      changes: { from, to, insert: snippet },
      selection: { anchor: from + snippet.length },
    });
    view.focus();
  }, [content, setMarkdown]);

  return (
    <div className="editor-pane-container flex flex-col h-full bg-slate-900 border-r border-slate-800 select-none">
      {/* Editor Sub-Header / Quick Action Toolbar */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <button
            onClick={() => insertSnippet('**Bold Text**')}
            title="Bold"
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('*Italic Text*')}
            title="Italic"
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('\n## Section Heading\n')}
            title="Section Heading"
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('\n- Bullet point metric or task achievement\n')}
            title="Bullet Point"
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />
          <button
            onClick={() => insertSnippet('\n::: left\n[icon:email user@domain.com](mailto:user@domain.com)\n:::\n\n::: right\n[icon:linkedin linkedin.com/in/user](https://linkedin.com)\n:::\n')}
            title="Insert Two-Column Container"
            className="flex items-center gap-1 px-1.5 py-1 hover:bg-slate-800 hover:text-blue-300 rounded transition text-[11px]"
          >
            <Columns className="w-3.5 h-3.5 text-blue-400" />
            <span>2-Col</span>
          </button>
          <button
            onClick={() => insertSnippet('[icon:github github.com/user](https://github.com)')}
            title="Insert Icon Link"
            className="flex items-center gap-1 px-1.5 py-1 hover:bg-slate-800 hover:text-purple-300 rounded transition text-[11px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Icon Link</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <button
            onClick={() => saveRevision()}
            title="Commit revision snapshot now"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-0.5 rounded transition"
          >
            <Save className="w-3 h-3" />
            <span>Snapshot</span>
          </button>
        </div>
      </div>

      {/* CodeMirror Surface */}
      <div className="flex-1 overflow-hidden relative">
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          theme={oneDark}
          extensions={[markdown()]}
          onChange={(val) => setMarkdown(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full text-[13px] font-mono leading-relaxed"
        />
      </div>
    </div>
  );
};
