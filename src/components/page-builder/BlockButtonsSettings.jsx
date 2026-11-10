import React, { useState } from 'react';
import { ButtonField } from './blockFields';

/*
 * "Buttons" panel shown on every block of every Page Builder: adds buttons to any block, also one that
 * has none of its own. Saved as section.config.buttons = { items: [{ text, url, icon, iconSide, style,
 * size, color }], align, position }. The link part is the usual ButtonField (page link, form popup,
 * #section, phone / email; landing pages keep their link rules). The website renders them in
 * components/tax-alphonic/blocks/BlockBackground.jsx (BlockButtons; keep the keys in sync).
 */

const BUTTON_STYLES = [
  { value: 'solid', label: 'Filled (colour)' },
  { value: 'outline', label: 'Outline' },
  { value: 'soft', label: 'Soft (light colour)' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'dark', label: 'Dark' },
  { value: 'white', label: 'White' },
  { value: 'link', label: 'Text link' },
];

const SIZES = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const ALIGNS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' },
  { value: 'stretch', label: 'Full width' },
];

const HEX = /^#[0-9a-f]{6}$/i;
const BRAND = '#0e96ac';

/** Small look-alike of the website button, so the style can be seen while choosing it. */
const Sample = ({ button }) => {
  const c = HEX.test(button.color || '') ? button.color : BRAND;
  const base = { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9, padding: '5px 12px', fontSize: 12.5, fontWeight: 700, border: '2px solid transparent', whiteSpace: 'nowrap' };
  const look = {
    solid: { background: c, color: '#fff' },
    outline: { color: c, borderColor: c },
    soft: { background: `${c}1f`, color: c },
    gradient: { background: `linear-gradient(120deg, ${c}, #e8521e)`, color: '#fff' },
    dark: { background: HEX.test(button.color || '') ? c : '#0a0e1a', color: '#fff' },
    white: { background: '#fff', color: HEX.test(button.color || '') ? c : '#0a0e1a', borderColor: 'rgba(10,14,26,.12)' },
    link: { color: c, textDecoration: 'underline', padding: '5px 2px' },
  }[button.style || 'solid'];
  return <span style={{ ...base, ...look }}>{button.text || 'Button'}</span>;
};

const BlockButtonsSettings = ({ section, onChange }) => {
  const config = section.config || {};
  const set = config.buttons || {};
  const items = Array.isArray(set.items) ? set.items : [];
  const [open, setOpen] = useState(items.length > 0);

  const save = (patch) => onChange({ ...config, buttons: { align: 'left', position: 'below', ...set, ...patch } });
  const setItems = (next) => {
    if (!next.length) {
      const { buttons: _removed, ...rest } = config;
      onChange(rest);
      return;
    }
    save({ items: next });
  };
  const updateItem = (index, patch) => setItems(items.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const move = (index, dir) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + dir, 0, moved);
    setItems(next);
  };
  const add = () => {
    setOpen(true);
    setItems([...items, { text: items.length ? 'Learn more' : 'Get started', url: '', style: items.length ? 'outline' : 'solid', size: 'md', color: '' }]);
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
        <i className="bi bi-hand-index-thumb text-primary"></i>
        <span className="fw-semibold small">Buttons</span>
        <span className="small text-muted">{items.length ? `${items.length} button${items.length > 1 ? 's' : ''}` : 'none (add buttons to this block)'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          {items.length > 0 && (
            <div className="row g-2 mb-3">
              <div className="col-6 col-md-4">
                <label className="form-label small text-muted mb-1">Position</label>
                <select className="form-select form-select-sm" value={set.position || 'below'} onChange={e => save({ position: e.target.value })}>
                  <option value="below">Below the block</option>
                  <option value="above">Above the block</option>
                </select>
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small text-muted mb-1">Alignment</label>
                <select className="form-select form-select-sm" value={set.align || 'left'} onChange={e => save({ align: e.target.value })}>
                  {ALIGNS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {items.map((button, index) => (
            <div key={index} className="border rounded-3 p-2 mb-2" style={{ background: 'var(--cms-card-bg, var(--bs-body-bg))' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="small fw-semibold text-muted">Button {index + 1}</span>
                <Sample button={button} />
                <div className="ms-auto btn-group btn-group-sm">
                  <button type="button" className="btn btn-outline-secondary" disabled={index === 0} onClick={() => move(index, -1)} title="Move up"><i className="bi bi-arrow-up"></i></button>
                  <button type="button" className="btn btn-outline-secondary" disabled={index === items.length - 1} onClick={() => move(index, 1)} title="Move down"><i className="bi bi-arrow-down"></i></button>
                  <button type="button" className="btn btn-outline-danger" onClick={() => setItems(items.filter((_, i) => i !== index))} title="Remove"><i className="bi bi-trash"></i></button>
                </div>
              </div>
              <div className="row g-2">
                <ButtonField className="col-12" look={false} label="Text and where it goes" value={button} onChange={b => updateItem(index, b)} />
                <div className="col-6 col-md-4">
                  <label className="form-label small text-muted mb-1">Style</label>
                  <select className="form-select form-select-sm" value={button.style || 'solid'} onChange={e => updateItem(index, { style: e.target.value })}>
                    {BUTTON_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label small text-muted mb-1">Size</label>
                  <select className="form-select form-select-sm" value={button.size || 'md'} onChange={e => updateItem(index, { size: e.target.value })}>
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small text-muted mb-1">Colour</label>
                  <div className="d-flex gap-1">
                    <input type="color" className="form-control form-control-sm form-control-color" value={HEX.test(button.color || '') ? button.color : BRAND} onChange={e => updateItem(index, { color: e.target.value })} title="Button colour" />
                    <button type="button" className="btn btn-sm btn-outline-secondary flex-grow-1" disabled={!button.color} onClick={() => updateItem(index, { color: '' })}>
                      {button.color ? 'Use page colour' : 'Page colour'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="small text-muted">Buttons show inside the block's background. Empty text = not shown.</span>
            <button type="button" className="btn btn-sm btn-outline-primary flex-shrink-0 ms-2" onClick={add}>
              <i className="bi bi-plus-lg me-1"></i>Add button
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockButtonsSettings;
