import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { useEffect, useRef } from 'react';

export type EditorLanguage = 'html' | 'css' | 'javascript';

interface CodeEditorProps {
  label: string;
  language: EditorLanguage;
  value: string;
  theme: 'light' | 'dark';
  onChange: (value: string) => void;
}

const lightTheme = EditorView.theme({
  '&': { backgroundColor: '#fbf7ec', color: '#1f1b14' },
  '.cm-gutters': { backgroundColor: '#f5ecd1', color: '#55503f', borderRight: '1px solid #c9bfa3' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#efe7d1' },
  '.cm-content': { caretColor: '#b4322b' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#d9c9a8' },
});

function languageExtension(language: EditorLanguage) {
  if (language === 'html') return html();
  if (language === 'css') return css();
  return javascript();
}

export function CodeEditor({ label, language, value, theme, onChange }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | undefined>(undefined);
  const themeCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          dropCursor(),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          bracketMatching(),
          rectangularSelection(),
          crosshairCursor(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
          languageExtension(language),
          themeCompartment.current.of(theme === 'dark' ? oneDark : lightTheme),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = undefined;
    };
  }, [language]);

  useEffect(() => {
    view.current?.dispatch({ effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : lightTheme) });
  }, [theme]);

  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);

  return <div className="code-editor" role="group" aria-label={label} ref={host} />;
}
