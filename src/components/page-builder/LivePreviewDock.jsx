import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SitePreviewFrame from '../../site-preview/SitePreviewFrame';
import { clearApiCache } from '../../site-preview/shims/apiClient';
import SpacingOverlay, { OVERLAY_COLORS } from '../../site-preview/SpacingOverlay';

/*
 * Live preview beside the Page Builder (floating button in PageBuilder.jsx): the block being edited,
 * or the whole page, as the website renders it. It updates with every edit (nothing is saved), and
 * draws the block's margin, padding and border over it. The page renders at the device's real width
 * and is scaled to fit, so a desktop page keeps its desktop layout in the narrower panel.
 */
const DEVICES = [
  { key: 'desktop', label: 'Desktop', icon: 'bi-display', width: 1280 },
  { key: 'tablet', label: 'Tablet', icon: 'bi-tablet', width: 820 },
  { key: 'mobile', label: 'Mobile', icon: 'bi-phone', width: 400 },
];

const Swatch = ({ color, label, value }) => (
  <span className="d-inline-flex align-items-center gap-1 text-nowrap">
    <span className="rounded-1 border" style={{ width: 12, height: 12, background: color }}></span>
    <span className="fw-semibold">{label}</span> <span className="text-muted">{value}</span>
  </span>
);

const sides = (list) => list.map(([icon, v]) => `${icon} ${v}`).join('  ');

const LivePreviewDock = ({ kind, draft, view, onView, label, hasBlock, width, top, onClose }) => {
  const [device, setDevice] = useState('desktop');
  const [showSpacing, setShowSpacing] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [measure, setMeasure] = useState(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const areaRef = useRef(null);

  useEffect(() => {
    if (!areaRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setArea({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(areaRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { setMeasure(null); }, [view, label]);

  const deviceWidth = DEVICES.find(d => d.key === device).width;
  const scale = area.width ? Math.min(1, area.width / deviceWidth) : 1;
  const frameHeight = area.height ? area.height / scale : 600;
  const showNoBlock = view === 'block' && !hasBlock;

  return createPortal(
    <aside
      className="d-flex flex-column border-start shadow-lg"
      style={{ position: 'fixed', top, right: 0, bottom: 0, width, zIndex: 1040, background: 'var(--cms-card-bg, var(--bs-body-bg))' }}
      aria-label="Live preview"
    >
      <div className="d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom">
        <span className="fw-bold small text-truncate" style={{ maxWidth: 220 }}>
          <i className="bi bi-eye text-primary me-1"></i>{view === 'block' && hasBlock ? label : 'Live Preview'}
        </span>
        <div className="btn-group btn-group-sm">
          <button type="button" className={`btn ${view === 'block' ? 'btn-primary' : 'btn-light border'}`} onClick={() => onView('block')}>This block</button>
          <button type="button" className={`btn ${view === 'page' ? 'btn-primary' : 'btn-light border'}`} onClick={() => onView('page')}>Whole page</button>
        </div>
        <div className="btn-group btn-group-sm ms-auto">
          {DEVICES.map(d => (
            <button key={d.key} type="button" className={`btn ${device === d.key ? 'btn-primary' : 'btn-light border'}`} onClick={() => setDevice(d.key)} title={d.label} aria-label={d.label}>
              <i className={`bi ${d.icon}`}></i>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm btn-light border" onClick={() => { clearApiCache(); setReloadKey(k => k + 1); }} title="Reload" aria-label="Reload"><i className="bi bi-arrow-clockwise"></i></button>
        <button type="button" className="btn btn-sm btn-light border" onClick={onClose} title="Close preview" aria-label="Close preview"><i className="bi bi-x-lg"></i></button>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3 px-3 py-2 border-bottom small">
        <div className="form-check form-switch mb-0">
          <input id="ta-dock-spacing" className="form-check-input" type="checkbox" checked={showSpacing} onChange={e => setShowSpacing(e.target.checked)} />
          <label className="form-check-label" htmlFor="ta-dock-spacing">Show spacing</label>
        </div>
        {measure ? (
          <>
            <Swatch color={OVERLAY_COLORS.margin} label="Margin" value={sides([['↑', measure.margin.top], ['↓', measure.margin.bottom]])} />
            <Swatch color={OVERLAY_COLORS.padding} label="Padding" value={sides([['↑', measure.padding.top], ['→', measure.padding.right], ['↓', measure.padding.bottom], ['←', measure.padding.left]])} />
            <Swatch color={OVERLAY_COLORS.border} label="Border" value={measure.border} />
          </>
        ) : (
          <span className="text-muted">{hasBlock ? 'This block has nothing to show yet. Fill in its content.' : 'Open a block on the left to see its spacing.'}</span>
        )}
      </div>

      <div ref={areaRef} className="flex-grow-1 bg-body-tertiary position-relative d-flex justify-content-center" style={{ minHeight: 0, overflow: 'hidden' }}>
        {showNoBlock ? (
          <div className="align-self-center text-muted small text-center px-4">Open a block on the left, or switch to Whole page.</div>
        ) : (
          <div style={{ width: deviceWidth * scale, height: frameHeight * scale, overflow: 'hidden', flex: 'none' }}>
            <SitePreviewFrame
              draft={draft}
              kind={kind}
              reloadKey={reloadKey}
              frameStyle={{ width: deviceWidth, maxWidth: 'none', height: frameHeight, borderRadius: 0, transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'none' }}
              inFrame={(doc) => <SpacingOverlay doc={doc} show={showSpacing} onMeasure={setMeasure} />}
            />
          </div>
        )}
      </div>
    </aside>,
    document.body
  );
};

export default LivePreviewDock;
