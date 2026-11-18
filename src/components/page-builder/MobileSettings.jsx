import React, { useState } from 'react';
import MediaPickButton from '../media/MediaPickButton';
import { mediaUrl } from '../../utils/mediaUrl';

/*
 * "Mobile view" panel on every block of every Page Builder: how the block looks on phones
 * (up to 767 px wide). Desktop and tablet never change. Saved as section.config.mobile =
 * { hide, bg (same | image | none), image, position, color, shade (light | dark), shadeOpacity,
 *   text (dark | light), images (show | hide), align (left | center | right), headSize, textSize,
 *   padTop, padBottom (px), buttons ("full"), hideKicker, hideSub, hideButtons ("yes") };
 * "Cards per row on phones" writes config.layout.colsPhone (same value as "Heading & cards").
 * Hero blocks (MOBILE_HERO_TYPES) default to no background image and no side image on phones.
 * Website: components/tax-alphonic/blocks/BlockBackground.jsx mobileOf + blocks.css "Mobile view"
 * (keep the keys and the hero list in sync).
 */
export const MOBILE_HERO_TYPES = new Set(['HeroBanner', 'HomeHero', 'CommonFormHero', 'JourneyHero', 'ToolHero']);

const HEX = /^#[0-9a-f]{6}$/i;

const Select = ({ label, value, options, onChange, width = 'col-md-6', help }) => (
  <div className={width}>
    <label className="form-label small text-muted mb-1">{label}</label>
    <select className="form-select form-select-sm" value={value ?? ''} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {help && <div className="form-text small">{help}</div>}
  </div>
);

const Px = ({ label, value, onChange, placeholder = 'Auto', max = 300 }) => (
  <div className="col-6 col-md-3">
    <label className="form-label small text-muted mb-1">{label}</label>
    <div className="input-group input-group-sm">
      <input type="number" min="0" max={max} className="form-control" placeholder={placeholder} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      <span className="input-group-text">px</span>
    </div>
  </div>
);

const MobileSettings = ({ section, onChange }) => {
  const config = section.config || {};
  const mobile = config.mobile || {};
  const isHero = MOBILE_HERO_TYPES.has(section.type);
  const used = Object.entries(mobile).filter(([, v]) => v !== '' && v !== null && v !== undefined).length + (config.layout?.colsPhone ? 1 : 0);
  const [open, setOpen] = useState(false);

  // '' / null removes the key (= default).
  const set = (key, value) => {
    const { [key]: _old, ...rest } = mobile;
    const next = value === '' || value === null || value === undefined ? rest : { ...rest, [key]: value };
    const { mobile: _removed, ...base } = config;
    onChange(Object.keys(next).length ? { ...config, mobile: next } : base);
  };
  const setPx = (key, raw, max = 300) => set(key, raw === '' ? '' : Math.max(0, Math.min(max, Math.round(Number(raw) || 0))));
  const setColsPhone = (value) => {
    const layout = config.layout || {};
    const { colsPhone: _old, ...rest } = layout;
    const nextLayout = value ? { ...rest, colsPhone: Number(value) } : rest;
    const { layout: _removed, ...base } = config;
    onChange(Object.keys(nextLayout).length ? { ...config, layout: nextLayout } : base);
  };
  const clear = () => {
    const { mobile: _removed, ...rest } = config;
    onChange(rest);
  };

  const bgMode = mobile.bg || '';
  const showImageFields = bgMode === 'image';
  const deskImage = config.background?.image;
  const summary = mobile.hide === 'yes'
    ? 'hidden on phones'
    : used ? `${used} phone setting${used > 1 ? 's' : ''}` : isHero ? 'no image on phones (hero default)' : 'automatic';

  return (
    <div className="border rounded-4 mb-3 bg-body-tertiary">
      <button
        type="button"
        className="btn btn-link w-100 text-decoration-none text-reset d-flex align-items-center gap-2 px-3 py-2"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} text-secondary`}></i>
        <i className="bi bi-phone text-primary"></i>
        <span className="fw-semibold small">Mobile view</span>
        <span className={`small ${mobile.hide === 'yes' ? 'text-danger' : 'text-muted'}`}>{summary}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <div className="form-text mt-0 mb-3">
            Only phones (up to 767 px wide) — desktop and tablet stay as they are. Empty = automatic. Check it in Live Preview → mobile.
          </div>
          <div className="row g-3">
            <Select
              label="On phones"
              value={mobile.hide === 'yes' ? 'yes' : ''}
              options={[{ value: '', label: 'Show this block' }, { value: 'yes', label: 'Hide this block on phones' }]}
              onChange={v => set('hide', v)}
            />
            {mobile.hide !== 'yes' && (
              <>
                <div className="col-12"><div className="small fw-semibold text-secondary border-bottom pb-1">Background</div></div>
                <Select
                  label="Background image on phones"
                  value={bgMode}
                  options={[
                    { value: '', label: isHero ? 'Automatic: no image (hero default)' : 'Automatic: same as desktop' },
                    { value: 'same', label: 'Same image as desktop' },
                    { value: 'image', label: 'A different image for phones' },
                    { value: 'none', label: 'No image' },
                  ]}
                  onChange={v => set('bg', v)}
                  help={bgMode === 'same' && !deskImage ? 'This block has no desktop background image (Background panel).' : undefined}
                />
                <div className="col-md-6">
                  <label className="form-label small text-muted mb-1">Background colour on phones</label>
                  <div className="input-group input-group-sm">
                    <input type="color" className="form-control form-control-color flex-grow-0" style={{ width: 40 }} value={HEX.test(mobile.color || '') ? mobile.color : '#ffffff'} onChange={e => set('color', e.target.value)} title="Pick a colour" />
                    <input type="text" className="form-control" value={mobile.color || ''} placeholder="Same as desktop" onChange={e => set('color', e.target.value.trim())} />
                    {mobile.color && <button type="button" className="btn btn-outline-secondary" onClick={() => set('color', '')} title="Remove"><i className="bi bi-x-lg"></i></button>}
                  </div>
                </div>
                {showImageFields && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label small text-muted mb-1">Phone image</label>
                      <div className="input-group input-group-sm">
                        <input type="text" className="form-control" value={mobile.image || ''} placeholder="Choose from Media or paste a URL" onChange={e => set('image', e.target.value)} />
                        <MediaPickButton onPick={url => set('image', url)} className="btn btn-outline-primary" size="sm" />
                      </div>
                      <div className="form-text small">Portrait or square works best on phones (e.g. 800 × 1000 px).</div>
                      {mobile.image && <img src={mediaUrl(mobile.image)} alt="" className="mt-2 rounded border" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'cover' }} />}
                    </div>
                    <Select
                      label="Image focus"
                      value={mobile.position || ''}
                      options={[{ value: '', label: 'Centre' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]}
                      onChange={v => set('position', v)}
                    />
                  </>
                )}
                <Select
                  label="Shade over the background"
                  value={mobile.shade || ''}
                  options={[{ value: '', label: 'None' }, { value: 'light', label: 'White shade (dark text)' }, { value: 'dark', label: 'Dark shade (white text)' }]}
                  onChange={v => set('shade', v)}
                  help="Makes text readable over a busy image."
                />
                {mobile.shade && (
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1 d-flex justify-content-between">
                      <span>Shade strength</span><span>{mobile.shadeOpacity ?? (mobile.shade === 'dark' ? 55 : 80)}%</span>
                    </label>
                    <input type="range" className="form-range" min="0" max="100" step="5" value={mobile.shadeOpacity ?? (mobile.shade === 'dark' ? 55 : 80)} onChange={e => set('shadeOpacity', Number(e.target.value))} />
                  </div>
                )}
                <Select
                  label="Text colour on phones"
                  value={mobile.text || ''}
                  options={[{ value: '', label: 'Automatic (follows the background)' }, { value: 'dark', label: 'Dark text' }, { value: 'light', label: 'White text' }]}
                  onChange={v => set('text', v)}
                />
                <Select
                  label="Images in the block"
                  value={mobile.images || ''}
                  options={[
                    { value: '', label: isHero ? 'Automatic: side image hidden (hero default)' : 'Automatic: show' },
                    { value: 'show', label: 'Show' },
                    { value: 'hide', label: 'Hide every image on phones' },
                  ]}
                  onChange={v => set('images', v)}
                />

                <div className="col-12"><div className="small fw-semibold text-secondary border-bottom pb-1">Text &amp; layout</div></div>
                <Select
                  label="Text alignment"
                  value={mobile.align || ''}
                  options={[{ value: '', label: 'Same as desktop' }, { value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }]}
                  onChange={v => set('align', v)}
                />
                <Select
                  label="Cards per row on phones"
                  value={config.layout?.colsPhone ? String(config.layout.colsPhone) : ''}
                  options={[{ value: '', label: 'Automatic' }, { value: '1', label: '1 per row' }, { value: '2', label: '2 per row' }, { value: '3', label: '3 per row' }]}
                  onChange={setColsPhone}
                  help="Same setting as Heading & cards → Phone."
                />
                <Px label="Heading size" value={mobile.headSize} onChange={v => setPx('headSize', v, 64)} placeholder="Auto" max={64} />
                <Px label="Text size" value={mobile.textSize} onChange={v => setPx('textSize', v, 24)} placeholder="Auto" max={24} />
                <Px label="Space above" value={mobile.padTop} onChange={v => setPx('padTop', v)} />
                <Px label="Space below" value={mobile.padBottom} onChange={v => setPx('padBottom', v)} />
                <Select
                  label="Buttons"
                  value={mobile.buttons || ''}
                  options={[{ value: '', label: 'As designed' }, { value: 'full', label: 'Full width, one under the other' }]}
                  onChange={v => set('buttons', v)}
                />
                <div className="col-md-6">
                  <label className="form-label small text-muted mb-1">Hide on phones</label>
                  <div className="d-flex flex-wrap gap-3 pt-1">
                    {[['hideKicker', 'Small top label'], ['hideSub', 'Sub text'], ['hideButtons', 'Buttons']].map(([key, label]) => (
                      <div key={key} className="form-check mb-0">
                        <input className="form-check-input" type="checkbox" id={`${section.id}-${key}`} checked={mobile[key] === 'yes'} onChange={e => set(key, e.target.checked ? 'yes' : '')} />
                        <label className="form-check-label small" htmlFor={`${section.id}-${key}`}>{label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {Object.keys(mobile).length > 0 && (
            <button type="button" className="btn btn-sm btn-outline-secondary mt-3" onClick={clear}>
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset phone settings
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileSettings;
