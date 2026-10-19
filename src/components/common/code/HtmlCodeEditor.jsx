import React, { lazy, Suspense } from 'react';
import './HtmlCodeEditor.css';

// VS Code-style HTML editor. Monaco is large, so it is loaded only when an editor is shown.
// Props: value, onChange(html), onSave?() (Ctrl+S), height, fileName, path (unique model id), compact.
const Impl = lazy(() => import('./HtmlCodeEditorImpl'));

export default function HtmlCodeEditor(props) {
  return (
    <Suspense fallback={<div className="hce dark"><div className="hce-loading" style={{ height: props.height || 560 }}>Loading editor…</div></div>}>
      <Impl {...props} />
    </Suspense>
  );
}
