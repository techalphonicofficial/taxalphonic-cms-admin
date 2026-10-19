import React, { useEffect, useRef, useState } from 'react';

// Renders pSEO HTML in an iframe with Tailwind CSS (Play CDN) and Bootstrap Icons, so the AI's
// Tailwind classes look as written. The iframe grows with its content.

const WIDTHS = [
  { key: 'desktop', label: 'Desktop', icon: 'bi-display', width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: 'bi-tablet', width: '820px' },
  { key: 'mobile', label: 'Mobile', icon: 'bi-phone', width: '400px' },
];

const doc = (html) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<style>body{font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;padding:24px;color:#111827;background:#fff}details>summary{cursor:pointer}</style>
<script>
// In <head>, so half-typed HTML in the body can't swallow it.
const post=()=>parent.postMessage({type:'tw-preview-height',h:document.documentElement.scrollHeight},'*');
addEventListener('DOMContentLoaded',()=>{new ResizeObserver(post).observe(document.documentElement);post();});
addEventListener('load',post);[300,1000,2500].forEach(t=>setTimeout(post,t));
document.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault();});
</script>
</head><body>${html}</body></html>`;

export default function TailwindPreview({ html }) {
  const frameRef = useRef(null);
  const [width, setWidth] = useState('desktop');
  const [height, setHeight] = useState(600);
  const [srcDoc, setSrcDoc] = useState(() => doc(html));

  // Rebuild the document shortly after edits stop (the Tailwind CDN re-scans on load).
  useEffect(() => {
    const t = setTimeout(() => setSrcDoc(doc(html)), 300);
    return () => clearTimeout(t);
  }, [html]);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source === frameRef.current?.contentWindow && e.data?.type === 'tw-preview-height') {
        setHeight(Math.max(300, Math.min(20000, Number(e.data.h) || 0)));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const current = WIDTHS.find((w) => w.key === width) || WIDTHS[0];

  return (
    <div className="border rounded-3 overflow-hidden bg-light">
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white">
        <small className="text-muted"><i className="bi bi-wind me-1"></i>Preview with Tailwind CSS (links are disabled)</small>
        <div className="btn-group btn-group-sm">
          {WIDTHS.map((w) => (
            <button key={w.key} type="button" className={`btn ${width === w.key ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setWidth(w.key)} title={w.label}>
              <i className={`bi ${w.icon}`}></i><span className="d-none d-md-inline ms-1">{w.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 overflow-auto" style={{ maxHeight: 900 }}>
        {html ? (
          <iframe
            ref={frameRef}
            title="Content preview"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            style={{ display: 'block', width: current.width, maxWidth: '100%', height, border: 0, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
          />
        ) : (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-robot fs-1 d-block mb-2"></i>
            <p>No content generated yet. Click "Regenerate Multi-Section AI" above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
