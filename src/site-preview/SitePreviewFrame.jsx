import React, { Component, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './website/styles';
import ApiServicePage from './website/components/tax-alphonic/pages/ApiServicePage';
import ApiPage from './website/components/tax-alphonic/pages/ApiPage';
import HomeSections from './website/components/tax-alphonic/home/HomeSections';
import { buildHomePreview, buildPagePreview, buildServicePreview } from './website/service/servicePreview';
import { setPreviewFrame } from './shims/frameGlobals';

// Same draft kinds and builders as the website's /cms-preview page.
const KINDS = {
  service: { build: buildServicePreview, render: (data) => <ApiServicePage service={data} /> },
  page: { build: buildPagePreview, render: (data) => <ApiPage page={data} /> },
  home: { build: buildHomePreview, render: (data) => <HomeSections sections={data} /> },
};

// Fonts the website loads in app/layout.js (next/font Sora + Inter, exposed as CSS variables).
const FRAME_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap">
<style>body{--font-sora:'Sora';--font-inter:'Inter'}.ta-preview-note{font:14px/1.5 system-ui,sans-serif;color:#64748b;text-align:center;padding:64px 16px}</style>
</head><body><div id="root"></div></body></html>`;

class RenderBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) return <div className="ta-preview-note">This block can't be shown yet: {String(this.state.error.message || this.state.error)}</div>;
    return this.props.children;
  }
}

/**
 * Renders an unsaved draft with the website's own page components (copied by
 * `npm run sync-preview`) inside an isolated iframe, so it looks exactly like the live page
 * without saving, publishing or running the website. Forms, packages and module records the
 * blocks point to are read from the backend's public API, as the website does.
 */
const SitePreviewFrame = ({ draft, kind = 'service', width = '100%', dark = false, reloadKey = 0, onStatus }) => {
  const iframeRef = useRef(null);
  const [mount, setMount] = useState(null);
  const [result, setResult] = useState({ status: 'loading', data: null });
  const latest = useRef(0);
  const draftKey = JSON.stringify(draft);
  const config = KINDS[kind] || KINDS.service;

  // Set up the frame document: website stylesheets in load order, then the React mount point.
  const onLoad = () => {
    const win = iframeRef.current?.contentWindow;
    const doc = win?.document;
    if (!doc) return;
    styles.forEach((css) => {
      const tag = doc.createElement('style');
      tag.textContent = css;
      doc.head.appendChild(tag);
    });
    // Links must not navigate the frame away; in-page anchors (#id) still scroll.
    doc.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      event.preventDefault();
      if (href.startsWith('#') && href.length > 1) doc.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    });
    setPreviewFrame(win);
    setMount(doc.getElementById('root'));
  };

  useEffect(() => () => setPreviewFrame(null), []);
  // A reload replaces the iframe; wait for the new document before rendering again.
  useEffect(() => { setMount(null); }, [reloadKey]);

  useEffect(() => {
    mount?.ownerDocument.documentElement.classList.toggle('dark', dark);
  }, [mount, dark]);

  // Build the page data from the draft (debounced), dropping stale results.
  useEffect(() => {
    const request = ++latest.current;
    const timer = setTimeout(async () => {
      try {
        const data = await config.build(draft);
        if (request !== latest.current) return;
        const empty = !data || (Array.isArray(data) && !data.length);
        setResult({ status: empty ? 'empty' : 'ready', data: empty ? null : data });
      } catch (error) {
        if (request === latest.current) setResult({ status: 'error', data: null, error });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, kind, reloadKey]);

  useEffect(() => { onStatus?.(result.status); }, [result.status, onStatus]);

  let body;
  if (result.status === 'ready') body = <RenderBoundary resetKey={draftKey}>{config.render(result.data)}</RenderBoundary>;
  else if (result.status === 'empty') body = <div className="ta-preview-note">Nothing to preview yet. Add a block.</div>;
  else if (result.status === 'error') body = <div className="ta-preview-note">Preview failed: {String(result.error?.message || 'unknown error')}</div>;
  else body = <div className="ta-preview-note">Loading preview…</div>;

  return (
    <>
      <iframe
        key={reloadKey}
        ref={iframeRef}
        title={`${kind} preview`}
        srcDoc={FRAME_HTML}
        onLoad={onLoad}
        style={{ width, maxWidth: '100%', height: '80vh', border: 0, borderRadius: 8, background: '#fff', transition: 'width .2s' }}
      />
      {mount && createPortal(body, mount)}
    </>
  );
};

export default SitePreviewFrame;
