import React, { useState } from 'react';
import MediaPickButton from '../media/MediaPickButton';
import { mediaUrl } from '../../utils/mediaUrl';
import ImageSizeHint from '../common/ImageSizeHint';

/*
 * "Background" panel shown on every block of every Page Builder. Saved as
 * section.config.background = { color, image, position, size, fixed, overlayColor,
 * overlayOpacity (0-100), textTheme, padding, rounded }. The website wraps the block in
 * components/tax-alphonic/blocks/BlockBackground.jsx (keep the keys in sync). Without a colour
 * or an image the block keeps its own design.
 */

const HEX = /^#[0-9a-f]{6}$/i;

const PRESETS = ['#ffffff', '#f4f8fb', '#eaf6f8', '#0e96ac', '#0b1b33', '#111827', '#fff7e6', '#fdecef'];

const POSITIONS = [
  { value: 'center', label: 'Centre' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const SIZES = [
  { value: 'cover', label: 'Fill the block (crop)' },
  { value: 'contain', label: 'Whole image (fit)' },
  { value: 'repeat', label: 'Repeat as a pattern' },
];

const PADDINGS = [
  { value: '', label: 'Automatic' },
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
];

const TEXT_THEMES = [
  { value: '', label: 'As designed' },
  { value: 'light', label: 'White text (dark background)' },
  { value: 'dark', label: 'Dark text (light background)' },
];

const Select = ({ label, value, options, onChange, className = 'col-md-4' }) => (
  <div className={className}>
    <label className="form-label small text-muted mb-1">{label}</label>
    <select className="form-select form-select-sm" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const ColorInput = ({ label, value, onChange, fallback, presets = false, className = 'col-md-6' }) => (
  <div className={className}>
    <label className="form-label small text-muted mb-1">{label}</label>
    <div className="input-group input-group-sm">
      <input type="color" className="form-control form-control-color flex-grow-0" style={{ width: 40 }} value={HEX.test(value || '') ? value : fallback} onChange={e => onChange(e.target.value)} title="Pick a colour" />
      <input type="text" className="form-control" value={value || ''} placeholder="None (e.g. #0E96AC or rgba(…))" onChange={e => onChange(e.target.value)} />
      {value && (
        <button type="button" className="btn btn-outline-secondary" onClick={() => onChange('')} title="Remove the colour">
          <i className="bi bi-x-lg"></i>
        </button>
      )}
    </div>
    {presets && (
      <div className="d-flex flex-wrap gap-1 mt-1">
        {PRESETS.map(c => (
          <button key={c} type="button" className="btn p-0 border rounded-circle" style={{ width: 20, height: 20, background: c }} onClick={() => onChange(c)} title={c} aria-label={`Use ${c}`} />
        ))}
      </div>
    )}
  </div>
);

const BackgroundSettings = ({ section, onChange, hero = false }) => {
  const config = section.config || {};
  const bg = config.background || {};
  const active = Boolean(String(bg.color || '').trim() || String(bg.image || '').trim());
  const [open, setOpen] = useState(active);

  const set = (key, value) => onChange({ ...config, background: { ...bg, [key]: value } });
  const clear = () => {
    const { background: _removed, ...rest } = config;
    onChange(rest);
  };

  const opacity = Math.max(0, Math.min(100, Number(bg.overlayOpacity) || 0));
  const preview = bg.image ? mediaUrl(bg.image) : '';

  return (
    <div className="border rounded-4 mb-3 bg-body-tertiary">
      <button
        type="button"
        className="btn btn-link w-100 text-decoration-none text-reset d-flex align-items-center gap-2 px-3 py-2"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} text-secondary`}></i>
        <i className="bi bi-palette text-primary"></i>
        <span className="fw-semibold small">Background</span>
        {active ? (
          <span className="d-inline-flex align-items-center gap-1 small text-muted">
            <span className="border rounded" style={{ width: 28, height: 16, background: bg.color || '#fff', backgroundImage: preview ? `url("${preview}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}></span>
            {bg.image ? 'image' : 'colour'}{opacity ? ` · overlay ${opacity}%` : ''}
          </span>
        ) : (
          <span className="small text-muted">{hero ? 'colour, image and overlay for the hero' : 'none (block design)'}</span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3">
          <div className="row g-3">
            <ColorInput label="Background colour" value={bg.color} onChange={v => set('color', v)} fallback="#ffffff" presets />

            <div className="col-md-6">
              <label className="form-label small text-muted mb-1">Background image</label>
              <div className="input-group input-group-sm">
                <input type="text" className="form-control" value={bg.image || ''} placeholder="Choose from Media or paste a URL" onChange={e => set('image', e.target.value)} />
                <MediaPickButton onPick={url => set('image', url)} className="btn btn-outline-primary" size="sm" />
                {bg.image && (
                  <button type="button" className="btn btn-outline-secondary" onClick={() => set('image', '')} title="Remove the image">
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
              <ImageSizeHint kind="blockBackground" />
            </div>

            {bg.image && (
              <>
                <Select label="Image position" value={bg.position || 'center'} options={POSITIONS} onChange={v => set('position', v)} />
                <Select label="Image size" value={bg.size || 'cover'} options={SIZES} onChange={v => set('size', v)} />
                <Select label="Stay still while scrolling" value={bg.fixed || 'no'} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes (parallax)' }]} onChange={v => set('fixed', v)} />
              </>
            )}

            <ColorInput label="Overlay colour (over the image / colour)" value={bg.overlayColor} onChange={v => set('overlayColor', v)} fallback="#000000" />
            <div className="col-md-6">
              <label className="form-label small text-muted mb-1 d-flex justify-content-between">
                <span>Overlay opacity</span>
                <span className="fw-semibold">{opacity}%</span>
              </label>
              <input type="range" className="form-range" min="0" max="100" step="5" value={opacity} onChange={e => set('overlayOpacity', Number(e.target.value))} />
              <div className="form-text mt-0">0% = no overlay. 40–60% keeps text readable on a photo.</div>
            </div>

            <Select label="Text colour" value={bg.textTheme || ''} options={TEXT_THEMES} onChange={v => set('textTheme', v)} />
            <Select label="Inner spacing" value={bg.padding || ''} options={PADDINGS} onChange={v => set('padding', v)} />
            <Select label="Rounded corners" value={bg.rounded || 'no'} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} onChange={v => set('rounded', v)} />

            {(preview || bg.color) && (
              <div className="col-12">
                <div className="position-relative rounded-3 overflow-hidden border" style={{ height: 90, background: bg.color || '#fff' }}>
                  {preview && (
                    <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                      backgroundImage: `url("${preview}")`,
                      backgroundPosition: bg.position || 'center',
                      backgroundSize: bg.size === 'contain' ? 'contain' : bg.size === 'repeat' ? 'auto' : 'cover',
                      backgroundRepeat: bg.size === 'repeat' ? 'repeat' : 'no-repeat',
                    }}></div>
                  )}
                  {opacity > 0 && <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: bg.overlayColor || '#000', opacity: opacity / 100 }}></div>}
                  <div className="position-relative h-100 d-flex align-items-center justify-content-center fw-bold" style={{ color: bg.textTheme === 'light' ? '#fff' : bg.textTheme === 'dark' ? '#0b1b33' : undefined }}>
                    Sample heading
                  </div>
                </div>
              </div>
            )}

            <div className="col-12 d-flex justify-content-between align-items-center">
              <span className="small text-muted">{hero ? 'The hero keeps its layout; its own decorations are hidden while a background is set.' : 'Shown behind the whole block, edge to edge.'}</span>
              {Object.keys(bg).length > 0 && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={clear}>
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Remove background
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundSettings;
