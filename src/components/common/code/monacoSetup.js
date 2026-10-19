// Monaco (the VS Code editor) bundled locally: workers through Vite `?worker`, no CDN.
// Also registers Tailwind CSS class suggestions inside class="…" in HTML.
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { TAILWIND_CLASSES, TAILWIND_VARIANTS } from './tailwindClasses';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'json') return new JsonWorker();
    return new EditorWorker();
  },
};

loader.config({ monaco });

// Formatter: keep text on one line (no wrapping), so the visual editor's fields don't pick up indentation.
monaco.languages.html.htmlDefaults.setOptions({
  ...monaco.languages.html.htmlDefaults.options,
  format: {
    ...monaco.languages.html.htmlDefaults.options.format,
    tabSize: 2,
    insertSpaces: true,
    wrapLineLength: 0,
    wrapAttributes: 'auto',
    preserveNewLines: true,
    maxPreserveNewLines: 1,
    indentInnerHtml: false,
    endWithNewline: false,
    unformatted: 'a,abbr,b,br,code,em,i,img,small,span,strong,sub,sup,u,wbr',
    contentUnformatted: 'pre,textarea,summary,h1,h2,h3,h4,h5,h6,p,li,a,button',
  },
});

let registered = false;
export function registerTailwind() {
  if (registered) return;
  registered = true;
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

  monaco.languages.registerCompletionItemProvider('html', {
    triggerCharacters: ['"', "'", ' ', ':', '-'],
    provideCompletionItems(model, position) {
      const before = model.getValueInRange({ startLineNumber: Math.max(1, position.lineNumber - 3), startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
      const match = before.match(/\bclass(?:Name)?\s*=\s*["']([^"']*)$/);
      if (!match) return { suggestions: [] };

      const token = match[1].split(/\s+/).pop() || '';
      const variant = (token.match(/^((?:[\w-]+:)*)/) || ['', ''])[1];
      const typed = token.slice(variant.length);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - typed.length,
        endColumn: position.column,
      };
      const used = new Set(match[1].split(/\s+/));

      const suggestions = TAILWIND_CLASSES
        .filter((c) => !used.has(variant + c.name))
        .map((c, i) => ({
          label: c.name,
          kind: c.group === 'Colours' ? CompletionItemKind.Color : CompletionItemKind.Constant,
          detail: `Tailwind · ${c.group}`,
          insertText: c.name,
          sortText: String(i).padStart(5, '0'),
          range,
        }));
      if (!variant) {
        TAILWIND_VARIANTS.forEach((v) => suggestions.push({
          label: v,
          kind: CompletionItemKind.Keyword,
          detail: 'Tailwind variant',
          insertText: v,
          insertTextRules: CompletionItemInsertTextRule.None,
          sortText: `~${v}`,
          range,
          command: { id: 'editor.action.triggerSuggest', title: 'More' },
        }));
      }
      return { suggestions };
    },
  });
}

export { monaco };
