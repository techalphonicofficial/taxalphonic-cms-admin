import React, { useState } from 'react';

/*
 * "Spacing & border" panel shown on every block of every Page Builder. Saved as section.config.spacing =
 * { marginTop, marginBottom, paddingTop, paddingBottom, paddingLeft, paddingRight, borderWidth,
 * borderRadius (px), borderStyle, borderColor }; an empty field keeps the block's own design. The website applies it in
 * components/tax-alphonic/blocks/BlockBackground.jsx (keep the keys in sync).
 */

const MARGINS = [
  { key: 'marginTop', label: 'Top' },
  { key: 'marginBottom', label: 'Bottom' },
];

const PADDINGS = [
  { key: 'paddingTop', label: 'Top' },
  { key: 'paddingBottom', label: 'Bottom' },
  { key: 'paddingLeft', label: 'Left' },
  { key: 'paddingRight', label: 'Right' },
];

const MAX = 400;
const HEX = /^#[0-9a-f]{6}$/i;

const SpacingField = ({ field, value, onChange }) => (
  <div className="col-6 col-md-3">
    <label className="form-label small text-muted mb-1">{field.label}</label>
    <div className="input-group input-group-sm">
      <input
        type="number"
        min="0"
        max={MAX}
        step="4"
        className="form-control"
        placeholder="Auto"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
      <span className="input-group-text">px</span>
    </div>
  </div>
);

const SpacingSettings = ({ section, onChange }) => {
  const config = section.config || {};
  const spacing = config.spacing || {};
  const used = Object.values(spacing).filter(v => v !== '' && v !== null && v !== undefined);
  const [open, setOpen] = useState(used.length > 0);

  const set = (key, raw) => {
    const { [key]: _old, ...rest } = spacing;
    const value = raw === '' ? null : Math.max(0, Math.min(MAX, Math.round(Number(raw) || 0)));
    onChange({ ...config, spacing: value === null ? rest : { ...rest, [key]: value } });
  };
  const setText = (key, value) => onChange({ ...config, spacing: { ...spacing, [key]: value } });
  const clear = () => {
    const { spacing: _removed, ...rest } = config;
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
        <i className="bi bi-arrows-expand text-primary"></i>
        <span className="fw-semibold small">Spacing &amp; border</span>
        <span className="small text-muted">{used.length ? `${used.length} custom` : 'automatic (block design)'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <div className="small fw-semibold mb-2">Margin (space outside the block)</div>
          <div className="row g-2 mb-3">
            {MARGINS.map(f => <SpacingField key={f.key} field={f} value={spacing[f.key]} onChange={v => set(f.key, v)} />)}
          </div>
          <div className="small fw-semibold mb-2">Padding (space inside the block)</div>
          <div className="row g-2">
            {PADDINGS.map(f => <SpacingField key={f.key} field={f} value={spacing[f.key]} onChange={v => set(f.key, v)} />)}
          </div>
          <div className="small fw-semibold mb-2 mt-3">Border</div>
          <div className="row g-2">
            <SpacingField field={{ label: 'Width' }} value={spacing.borderWidth} onChange={v => set('borderWidth', v)} />
            <SpacingField field={{ label: 'Rounded corners' }} value={spacing.borderRadius} onChange={v => set('borderRadius', v)} />
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted mb-1">Style</label>
              <select className="form-select form-select-sm" value={spacing.borderStyle || 'solid'} onChange={e => setText('borderStyle', e.target.value)}>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted mb-1">Colour</label>
              <input type="color" className="form-control form-control-sm form-control-color w-100" value={HEX.test(spacing.borderColor || '') ? spacing.borderColor : '#cbd5e1'} onChange={e => setText('borderColor', e.target.value)} />
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="small text-muted">Empty = the block's own spacing. 0 removes it. Phones show large values smaller.</span>
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

export default SpacingSettings;
