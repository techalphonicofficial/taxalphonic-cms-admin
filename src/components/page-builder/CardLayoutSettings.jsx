import React, { useState } from 'react';

/*
 * "Heading & cards" panel on every block of every Page Builder (after Spacing). Saved as
 * section.config.layout = { headAlign, headGap, cols, colsTablet, colsPhone, gap, cardPadding,
 * cardAlign, rowAlign }; an empty value keeps the block's own design. The website applies it in
 * components/tax-alphonic/blocks/BlockBackground.jsx (layoutInto) + blocks/center-grids.css
 * (.ta-ly-*), which cover every card grid (home, service, general, journey, tools blocks).
 * Responsive on its own: tablet / phone counts apply to the width of the block's own box, so the
 * same block works full width, in the main column and in a sidebar.
 */

// Blocks without a heading or cards: no panel at all.
const NO_PANEL = new Set(['LayoutSection', 'CommonSpacer', 'CommonAutoPopup', 'CommonEmbed', 'LandingHeader', 'LandingFooter']);
// Blocks with a heading but no card grid: heading options only.
const NO_CARDS = new Set([
  'HeroBanner', 'HomeHero', 'JourneyHero', 'ToolHero', 'CommonFormHero', 'Overview', 'Form', 'CallToAction',
  'CommonText', 'CommonImageText', 'CommonImage', 'CommonVideo', 'CommonButtons', 'CommonTextSide', 'CommonContact',
  'ToolCalculator', 'Faq', 'CommonMiniFaq',
]);

const ALIGNS = [
  { value: '', label: 'As designed' },
  { value: 'left', label: 'Left', icon: 'bi-text-left' },
  { value: 'center', label: 'Centre', icon: 'bi-text-center' },
  { value: 'right', label: 'Right', icon: 'bi-text-right' },
];

const AlignButtons = ({ value, onChange }) => (
  <div className="btn-group btn-group-sm w-100" role="group">
    {ALIGNS.map(a => (
      <button
        key={a.value || 'auto'}
        type="button"
        className={`btn ${String(value || '') === a.value ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => onChange(a.value)}
        title={a.label}
      >
        {a.icon ? <i className={`bi ${a.icon}`}></i> : <span className="small">Auto</span>}
      </button>
    ))}
  </div>
);

const CountSelect = ({ label, value, max, onChange, help }) => (
  <div className="col-6 col-md-4">
    <label className="form-label small text-muted mb-1">{label}</label>
    <select className="form-select form-select-sm" value={value ?? ''} onChange={e => onChange(e.target.value)}>
      <option value="">Automatic</option>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} per row</option>)}
    </select>
    {help && <div className="form-text small">{help}</div>}
  </div>
);

const PxField = ({ label, value, max, onChange }) => (
  <div className="col-6 col-md-4">
    <label className="form-label small text-muted mb-1">{label}</label>
    <div className="input-group input-group-sm">
      <input type="number" min="0" max={max} step="2" className="form-control" placeholder="Auto" value={value ?? ''} onChange={e => onChange(e.target.value)} />
      <span className="input-group-text">px</span>
    </div>
  </div>
);

const WidthSelect = ({ label, value, onChange }) => (
  <div className="col-6 col-md-4">
    <label className="form-label small text-muted mb-1">{label}</label>
    <select className="form-select form-select-sm" value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">As designed (wraps)</option>
      <option value="full">Full width</option>
      <option value="line">One line</option>
    </select>
  </div>
);

const HEX = /^#[0-9a-f]{6}$/i;
const ColorField = ({ label, value, onChange }) => (
  <div className="col-6 col-md-3">
    <label className="form-label small text-muted mb-1">{label}</label>
    <div className="input-group input-group-sm">
      <input type="color" className="form-control form-control-color" style={{ maxWidth: 42 }} value={HEX.test(value || '') ? value : '#0e96ac'} onChange={e => onChange(e.target.value)} title={label} />
      <input type="text" className="form-control" placeholder="Auto" value={value || ''} onChange={e => onChange(e.target.value.trim())} />
      {value && <button type="button" className="btn btn-outline-secondary" title="Back to the design colour" onClick={() => onChange('')}><i className="bi bi-x"></i></button>}
    </div>
    {value && !HEX.test(value) && <div className="form-text text-danger small">Use #rrggbb</div>}
  </div>
);

const RangeField = ({ label, value, fallback, onChange }) => (
  <div className="col-6 col-md-3">
    <label className="form-label small text-muted mb-1 d-flex justify-content-between">
      <span>{label}</span><span>{value === undefined || value === '' ? 'Auto' : `${value}%`}</span>
    </label>
    <input type="range" className="form-range" min="0" max="100" step="5" value={value === undefined || value === '' ? fallback : value} onChange={e => onChange(e.target.value)} />
  </div>
);

// Same gradient as the website (center-grids.css .ta-ly-hl): colour 1 to share - blend/2, colour 2 from share + blend/2.
const HighlightSample = ({ layout }) => {
  const from = HEX.test(layout.hlFrom || '') ? layout.hlFrom : '#0e96ac';
  const to = HEX.test(layout.hlTo || '') ? layout.hlTo : '#e8521e';
  const share = layout.hlShare === undefined || layout.hlShare === '' ? 50 : Number(layout.hlShare);
  const blend = layout.hlBlend === undefined || layout.hlBlend === '' ? 60 : Number(layout.hlBlend);
  const a = Math.max(0, share - blend / 2);
  const b = Math.min(100, share + blend / 2);
  const gradient = `linear-gradient(90deg, ${from} 0%, ${from} ${a}%, ${to} ${b}%, ${to} 100%)`;
  return (
    <div className="rounded-3 px-3 py-2 mb-2" style={{ background: '#fff', border: '1px solid var(--bs-border-color)' }}>
      <span style={{ font: '800 22px/1.2 system-ui, sans-serif', color: HEX.test(layout.headColor || '') ? layout.headColor : '#0a0e1a' }}>Stay compliant with </span>
      <span style={{ font: '800 22px/1.2 system-ui, sans-serif', background: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>labour laws</span>
      <div className="small text-muted mt-1">Sample. Colour 1 up to {Math.round(a)}%, colour 2 from {Math.round(b)}%.</div>
    </div>
  );
};

const CardLayoutSettings = ({ section, onChange }) => {
  const config = section.config || {};
  const layout = config.layout || {};
  const used = Object.values(layout).filter(v => v !== '' && v !== null && v !== undefined);
  const [open, setOpen] = useState(used.length > 0);
  if (NO_PANEL.has(section.type)) return null;
  const cards = !NO_CARDS.has(section.type);

  const set = (key, value, max) => {
    const { [key]: _old, ...rest } = layout;
    let next = value;
    if (max !== undefined && value !== '') next = Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
    const updated = value === '' || value === null ? rest : { ...rest, [key]: next };
    const { layout: _removed, ...base } = config;
    onChange(Object.keys(updated).length ? { ...config, layout: updated } : base);
  };
  const clear = () => {
    const { layout: _removed, ...rest } = config;
    onChange(rest);
  };

  return (
    <div className="border rounded-4 mb-3 bg-body-tertiary">
      <button
        type="button"
        className="btn btn-link w-100 text-decoration-none text-reset d-flex align-items-center gap-2 px-3 py-2"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} text-secondary`}></i>
        <i className="bi bi-grid-3x2-gap text-primary"></i>
        <span className="fw-semibold small">{cards ? 'Heading & cards' : 'Heading'}</span>
        <span className="small text-muted">{used.length ? `${used.length} custom` : 'automatic (block design)'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <div className="small fw-semibold mb-2">Heading (kicker, heading, sub text)</div>
          <div className="row g-2 mb-3 align-items-end">
            <div className="col-12 col-md-8">
              <label className="form-label small text-muted mb-1">Alignment</label>
              <AlignButtons value={layout.headAlign} onChange={v => set('headAlign', v)} />
            </div>
            <PxField label="Space under heading" value={layout.headGap} max={120} onChange={v => set('headGap', v, 120)} />
            <WidthSelect label="Heading width" value={layout.headWidth} onChange={v => set('headWidth', v)} />
            <WidthSelect label="Sub text width" value={layout.subWidth} onChange={v => set('subWidth', v)} />
            <PxField label="Heading size" value={layout.headSize} max={96} onChange={v => set('headSize', v, 96)} />
          </div>
          {(layout.headWidth === 'line' || layout.subWidth === 'line') && (
            <div className="form-text small mb-2 mt-n2">One line applies on screens 900 px and wider (smaller screens still wrap). Keep that text short.</div>
          )}

          <div className="small fw-semibold mb-2">Colours</div>
          <div className="row g-2 mb-3">
            <ColorField label="Heading" value={layout.headColor} onChange={v => set('headColor', v)} />
            <ColorField label="Sub text" value={layout.subColor} onChange={v => set('subColor', v)} />
            <ColorField label="Kicker / label" value={layout.kickerColor} onChange={v => set('kickerColor', v)} />
          </div>

          <div className="small fw-semibold mb-1">Two-tone highlight</div>
          <div className="form-text small mb-2 mt-0">The highlighted words of the heading (written as *words* or the block's "highlight" field).</div>
          <div className="row g-2 mb-2 align-items-end">
            <ColorField label="Colour 1" value={layout.hlFrom} onChange={v => set('hlFrom', v)} />
            <ColorField label="Colour 2" value={layout.hlTo} onChange={v => set('hlTo', v)} />
            <RangeField label="Colour 1 share" value={layout.hlShare} fallback={50} onChange={v => set('hlShare', v, 100)} />
            <RangeField label="Blend" value={layout.hlBlend} fallback={60} onChange={v => set('hlBlend', v, 100)} />
          </div>
          <HighlightSample layout={layout} />

          {cards && (
            <>
              <div className="small fw-semibold mb-2">Cards per row</div>
              <div className="row g-2 mb-1">
                <CountSelect label="Desktop" value={layout.cols} max={8} onChange={v => set('cols', v, 8)} />
                <CountSelect label="Tablet" value={layout.colsTablet} max={6} onChange={v => set('colsTablet', v, 6)} />
                <CountSelect label="Phone" value={layout.colsPhone} max={3} onChange={v => set('colsPhone', v, 3)} />
              </div>
              <div className="form-text small mb-3">
                Automatic = the block's own setting. Narrow places (sidebar, tablet) show fewer per row by themselves, so cards never get squeezed.
              </div>

              <div className="small fw-semibold mb-2">Cards</div>
              <div className="row g-2 mb-2 align-items-end">
                <div className="col-12 col-md-8">
                  <label className="form-label small text-muted mb-1">Text inside the cards</label>
                  <AlignButtons value={layout.cardAlign} onChange={v => set('cardAlign', v)} />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label small text-muted mb-1">Last / short row</label>
                  <select className="form-select form-select-sm" value={layout.rowAlign || ''} onChange={e => set('rowAlign', e.target.value)}>
                    <option value="">Centred</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <PxField label="Space between cards" value={layout.gap} max={80} onChange={v => set('gap', v, 80)} />
                <PxField label="Padding inside cards" value={layout.cardPadding} max={80} onChange={v => set('cardPadding', v, 80)} />
              </div>
            </>
          )}

          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="small text-muted">Empty / Auto = the block's own design. Shows the same in Live Preview and on the website.</span>
            {used.length > 0 && (
              <button type="button" className="btn btn-sm btn-outline-danger flex-shrink-0 ms-2" onClick={clear}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardLayoutSettings;
