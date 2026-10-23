import React, { useState } from 'react';
import SitePreviewFrame from '../../site-preview/SitePreviewFrame';
import { clearApiCache } from '../../site-preview/shims/apiClient';

const DEVICES = [
  { key: 'desktop', label: 'Desktop', icon: 'bi-display', width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: 'bi-tablet', width: '820px' },
  { key: 'mobile', label: 'Mobile', icon: 'bi-phone', width: '400px' },
];

const STATUS = {
  ready: { dot: 'text-success', text: 'Live — updates as you edit (unsaved changes included)' },
  empty: { dot: 'text-secondary', text: 'Nothing to preview yet' },
  error: { dot: 'text-danger', text: 'Preview failed to load' },
  loading: { dot: 'text-warning', text: 'Loading preview…' },
};

/**
 * Live preview of an unsaved service (kind="service"), CMS page (kind="page", draft =
 * { title, content, sections }) or homepage (kind="home", draft = { sections }). Rendered right here
 * in the admin with the website's own page components (src/site-preview, `npm run sync-preview`),
 * so it needs no running or deployed website and nothing is saved.
 */
const ServicePreviewPane = ({ draft, kind = 'service' }) => {
  const [device, setDevice] = useState('desktop');
  const [dark, setDark] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState('loading');

  const width = DEVICES.find(d => d.key === device)?.width;
  const current = STATUS[status] || STATUS.loading;

  return (
    <div className="premium-form-card border-0 p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="small text-muted">
          <i className={`bi bi-circle-fill me-1 ${current.dot}`} style={{ fontSize: '0.6rem' }}></i>
          {current.text}
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm">
            {DEVICES.map(d => (
              <button key={d.key} type="button" className={`btn ${device === d.key ? 'btn-primary' : 'btn-light border'}`} onClick={() => setDevice(d.key)} title={d.label}>
                <i className={`bi ${d.icon}`}></i>
              </button>
            ))}
          </div>
          <button type="button" className={`btn btn-sm ${dark ? 'btn-dark' : 'btn-light border'}`} onClick={() => setDark(v => !v)} title={dark ? 'Website light mode' : 'Website dark mode'}>
            <i className={`bi ${dark ? 'bi-moon-stars-fill' : 'bi-sun'}`}></i>
          </button>
          <button type="button" className="btn btn-sm btn-light border" onClick={() => { clearApiCache(); setReloadKey(k => k + 1); }} title="Reload (fetch forms, packages and module records again)">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      <div className="bg-body-tertiary rounded-3 p-2 d-flex justify-content-center" style={{ overflowX: 'auto' }}>
        <SitePreviewFrame draft={draft} kind={kind} width={width} dark={dark} reloadKey={reloadKey} onStatus={setStatus} />
      </div>
      <div className="small text-muted mt-2">
        {kind === 'landing'
          ? 'Header, body and footer of the landing page. Forms can be filled in but are not sent from the preview.'
          : 'Page content only (the website header and footer are not shown). Forms can be filled in but are not sent from the preview.'}
      </div>
    </div>
  );
};

export default ServicePreviewPane;
