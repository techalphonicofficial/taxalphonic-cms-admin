import React, { useEffect, useRef, useState } from 'react';

// Website that renders the preview (Next.js app, route /cms-preview). It must list this
// admin's origin in its CMS_ADMIN_ORIGIN env var.
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://192.168.0.166:3000').replace(/\/$/, '');
const SITE_ORIGIN = new URL(SITE_URL).origin;

// Message type per draft kind; the website's /cms-preview picks the matching renderer.
const MESSAGE_TYPES = { service: 'ta-service-preview', page: 'ta-page-preview', home: 'ta-home-preview' };

const DEVICES = [
  { key: 'desktop', label: 'Desktop', icon: 'bi-display', width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: 'bi-tablet', width: '820px' },
  { key: 'mobile', label: 'Mobile', icon: 'bi-phone', width: '400px' },
];

/**
 * Live preview of an unsaved service (kind="service"), CMS page (kind="page", draft =
 * { title, content, sections }) or homepage (kind="home", draft = { sections }). Embeds the website's /cms-preview page and posts the draft to it (debounced)
 * whenever it changes; the website renders it with the real page component, so what you see
 * is what will be published.
 */
const ServicePreviewPane = ({ draft, kind = 'service' }) => {
  const iframeRef = useRef(null);
  const draftRef = useRef(draft);
  const [device, setDevice] = useState('desktop');
  const [connected, setConnected] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  draftRef.current = draft;
  // Re-send only when the draft's content changes, not on every parent render.
  const draftKey = JSON.stringify(draft);

  const send = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: MESSAGE_TYPES[kind] || MESSAGE_TYPES.service, service: draftRef.current }, SITE_ORIGIN);
  };

  // The preview page announces itself once loaded; answer with the current draft.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== SITE_ORIGIN || event.data?.type !== 'ta-service-preview-ready') return;
      setConnected(true);
      send();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!connected) return undefined;
    const timer = setTimeout(send, 400);
    return () => clearTimeout(timer);
  }, [draftKey, connected]);

  const width = DEVICES.find(d => d.key === device)?.width;

  return (
    <div className="premium-form-card border-0 p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="small text-muted">
          <i className={`bi bi-circle-fill me-1 ${connected ? 'text-success' : 'text-warning'}`} style={{ fontSize: '0.6rem' }}></i>
          {connected ? 'Live — updates as you edit (unsaved changes included)' : `Connecting to ${SITE_URL}…`}
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm">
            {DEVICES.map(d => (
              <button key={d.key} type="button" className={`btn ${device === d.key ? 'btn-primary' : 'btn-light border'}`} onClick={() => setDevice(d.key)} title={d.label}>
                <i className={`bi ${d.icon}`}></i>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-sm btn-light border" onClick={() => { setConnected(false); setReloadKey(k => k + 1); }} title="Reload preview">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      <div className="bg-body-tertiary rounded-3 p-2 d-flex justify-content-center" style={{ overflowX: 'auto' }}>
        <iframe
          key={reloadKey}
          ref={iframeRef}
          title={`${kind} preview`}
          src={`${SITE_URL}/cms-preview`}
          style={{ width, maxWidth: '100%', height: '80vh', border: 0, borderRadius: 8, background: '#fff', transition: 'width .2s' }}
        />
      </div>
      {!connected && (
        <div className="small text-muted mt-2">
          If this stays on “Connecting”, check that the website is running at {SITE_URL} (set <code>VITE_SITE_URL</code>) and that its
          <code> CMS_ADMIN_ORIGIN</code> includes <code>{window.location.origin}</code>.
        </div>
      )}
    </div>
  );
};

export default ServicePreviewPane;
