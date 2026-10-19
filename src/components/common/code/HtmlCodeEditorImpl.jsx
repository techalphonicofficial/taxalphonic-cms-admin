import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import { monaco, registerTailwind } from './monacoSetup';
import './HtmlCodeEditor.css';

// VS Code-style HTML editor (Monaco): syntax colours, Tailwind class suggestions, format, find /
// replace, folding, minimap, multi-cursor, Ctrl+S to save. Loaded lazily by HtmlCodeEditor.jsx.

const PREFS_KEY = 'ta-code-editor';
const readPrefs = () => {
  try {
    return { theme: 'vs-dark', wrap: true, minimap: true, fontSize: 14, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return { theme: 'vs-dark', wrap: true, minimap: true, fontSize: 14 };
  }
};

const countWords = (html) => (String(html || '').replace(/<[^>]*>/g, ' ').match(/\S+/g) || []).length;

export default function HtmlCodeEditorImpl({ value, onChange, onSave, height = 560, fileName = 'content.html', path, compact = false }) {
  const editorRef = useRef(null);
  const [prefs, setPrefs] = useState(readPrefs);
  const [fullscreen, setFullscreen] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, col: 1, selected: 0 });
  const [longLine, setLongLine] = useState(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // not remembered
    }
  }, [prefs]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  useEffect(() => {
    // Minified / one-line HTML (as the AI sometimes returns it): offer to format.
    const text = String(value || '');
    setLongLine(text.length > 1500 && text.split('\n').length < 8);
  }, [value]);

  const handleMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorSelection(() => {
      const pos = editor.getPosition();
      const sel = editor.getSelection();
      const selected = sel ? editor.getModel().getValueInRange(sel).length : 0;
      setCursor({ line: pos?.lineNumber || 1, col: pos?.column || 1, selected });
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSaveRef.current?.());
  };

  const run = (action) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    editor.getAction(action)?.run();
  };

  const set = (patch) => setPrefs((p) => ({ ...p, ...patch }));
  const dark = prefs.theme === 'vs-dark';

  const tool = (title, icon, onClick, active = false, label = '') => (
    <button type="button" className={`hce-btn${active ? ' on' : ''}`} title={title} onClick={onClick}>
      <i className={`bi ${icon}`}></i>{label && <span>{label}</span>}
    </button>
  );

  const body = (
    <div className={`hce${dark ? ' dark' : ' light'}${fullscreen ? ' full' : ''}`}>
      <div className="hce-bar">
        <div className="hce-tab">
          <i className="bi bi-filetype-html"></i>
          <span>{fileName}</span>
        </div>
        <div className="hce-tools">
          {tool('Format document (Shift+Alt+F)', 'bi-magic', () => run('editor.action.formatDocument'), false, compact ? '' : 'Format')}
          {tool('Find / replace (Ctrl+F, Ctrl+H)', 'bi-search', () => run('actions.find'))}
          {tool('Fold all sections', 'bi-arrows-collapse', () => run('editor.foldAll'))}
          {tool('Unfold all', 'bi-arrows-expand', () => run('editor.unfoldAll'))}
          <span className="hce-sep" />
          {tool('Word wrap (Alt+Z)', 'bi-text-wrap', () => set({ wrap: !prefs.wrap }), prefs.wrap)}
          {!compact && tool('Minimap', 'bi-layout-sidebar-inset-reverse', () => set({ minimap: !prefs.minimap }), prefs.minimap)}
          {tool('Smaller text', 'bi-zoom-out', () => set({ fontSize: Math.max(10, prefs.fontSize - 1) }))}
          {tool('Bigger text', 'bi-zoom-in', () => set({ fontSize: Math.min(24, prefs.fontSize + 1) }))}
          {tool(dark ? 'Light theme' : 'Dark theme', dark ? 'bi-sun' : 'bi-moon-stars', () => set({ theme: dark ? 'vs' : 'vs-dark' }))}
          {tool('Command palette (F1)', 'bi-command', () => run('editor.action.quickCommand'))}
          {tool(fullscreen ? 'Exit full screen (Esc)' : 'Full screen', fullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen', () => setFullscreen((f) => !f))}
        </div>
      </div>

      {longLine && (
        <div className="hce-hint">
          <i className="bi bi-info-circle"></i>
          This HTML has very long lines. <button type="button" onClick={() => run('editor.action.formatDocument')}>Format it</button> to put each tag on its own line.
        </div>
      )}

      <div className="hce-editor" style={fullscreen ? undefined : { height }}>
        <Editor
          path={path || fileName}
          keepCurrentModel
          language="html"
          theme={prefs.theme}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          beforeMount={registerTailwind}
          onMount={handleMount}
          loading={<div className="hce-loading">Loading editor…</div>}
          options={{
            fontSize: prefs.fontSize,
            fontFamily: "Consolas, 'Cascadia Code', 'Fira Code', 'Courier New', monospace",
            fontLigatures: true,
            wordWrap: prefs.wrap ? 'on' : 'off',
            minimap: { enabled: prefs.minimap && !compact, renderCharacters: false },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            folding: true,
            foldingStrategy: 'indentation',
            linkedEditing: true,
            autoClosingTags: true,
            formatOnPaste: false,
            tabSize: 2,
            insertSpaces: true,
            stickyScroll: { enabled: true },
            quickSuggestions: { other: true, comments: false, strings: true },
            suggest: { showWords: false, preview: true },
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>

      <div className="hce-status">
        <span><i className="bi bi-braces"></i> HTML</span>
        <span className="hce-tw" title="Type inside class=&quot;…&quot; to get Tailwind suggestions"><i className="bi bi-wind"></i> Tailwind CSS</span>
        <span className="ms-auto">Ln {cursor.line}, Col {cursor.col}{cursor.selected ? ` (${cursor.selected} selected)` : ''}</span>
        <span>{String(value || '').length.toLocaleString()} chars</span>
        <span>{countWords(value).toLocaleString()} words</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        {onSave && <span title="Ctrl+S saves the page"><i className="bi bi-floppy"></i> Ctrl+S</span>}
      </div>
    </div>
  );

  return fullscreen ? createPortal(body, document.body) : body;
}
