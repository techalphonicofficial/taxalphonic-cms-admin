import React from 'react';
import MediaPickButton from '../media/MediaPickButton';
import { mediaUrl } from '../../utils/mediaUrl';

// Small building blocks for Page Builder block editors (SectionRenderer.jsx).

export const ICON_HINT = 'Emoji (e.g. ✅ 🛡️ ⚡) or a square image (96 × 96 px) — 🖼 picks one from Media';

// Repeater fields whose key looks like an image get a "Choose from Media" button.
export const MEDIA_KEY = /^(icon|image|img|logo|avatar|photo|picture|thumb|thumbnail|banner|backgroundImage|flag)$/i;
const looksLikeImage = (value) => /^(https?:|\/|uploads\/|data:)/i.test(value || '') || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(value || '');

/** Small thumbnail of an image value (nothing for emoji / text). */
const MediaThumb = ({ value }) => (looksLikeImage(value) ? (
  <span className="input-group-text p-1 bg-body">
    <img src={mediaUrl(value)} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
  </span>
) : null);

/** Text input with a Media picker button (pick / upload an image; typing a URL or emoji still works). */
export const MediaTextInput = ({ value, onChange, placeholder }) => (
  <div className="input-group">
    <MediaThumb value={value} />
    <input type="text" className="form-control" value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    <MediaPickButton onPick={onChange} />
    {value && looksLikeImage(value) && (
      <button type="button" className="btn btn-outline-danger" onClick={() => onChange('')} title="Remove image"><i className="bi bi-x-lg"></i></button>
    )}
  </div>
);

// media: adds the Media picker (for image URL / icon fields).
export const TextField = ({ label, value, onChange, placeholder, textarea = false, rows = 2, hint, className = 'col-md-6', media = false }) => (
  <div className={className}>
    <label className="form-label">{label}</label>
    {textarea ? (
      <textarea className="form-control" rows={rows} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    ) : media ? (
      <MediaTextInput value={value} onChange={onChange} placeholder={placeholder} />
    ) : (
      <input type="text" className="form-control" value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    )}
    {hint && <div className="form-text">{hint}</div>}
  </div>
);

// A link button: { text, url }. Leave the text empty to hide the button on the website.
export const ButtonField = ({ label, value, onChange, className = 'col-md-6' }) => {
  const button = value || {};
  const set = (patch) => onChange({ ...button, ...patch });

  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      <div className="input-group">
        <input type="text" className="form-control" placeholder="Button text" value={button.text || ''} onChange={e => set({ text: e.target.value })} />
        <input type="text" className="form-control" placeholder="Link (/talk-to-expert, #pricing, https://…)" value={button.url || ''} onChange={e => set({ url: e.target.value })} />
      </div>
      <div className="form-text">Leave the text empty to hide this button.</div>
    </div>
  );
};

/**
 * Editable list of objects. `fields`: [{ key, placeholder, textarea?, type: 'checkbox' | 'color'?, width?, media? }]
 * Fields named icon / image / logo / avatar / photo (or media: true) get the Media picker.
 * where width is a Bootstrap column class (default col-12).
 */
export const RepeaterField = ({ label, items, onChange, fields, addLabel = 'Add item', newItem = {} }) => {
  const list = Array.isArray(items) ? items : [];
  const update = (index, key, value) => onChange(list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const remove = (index) => onChange(list.filter((_, i) => i !== index));
  const move = (index, delta) => {
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="col-12">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label text-muted text-uppercase mb-0" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>{label}</label>
        <button type="button" className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-medium" onClick={() => onChange([...list, { ...newItem }])}>
          <i className="bi bi-plus me-1"></i> {addLabel}
        </button>
      </div>
      {list.length === 0 && <div className="text-muted small mb-2">Nothing added yet.</div>}
      {list.map((item, index) => (
        <div key={index} className="p-3 mb-2 border rounded-4 bg-white d-flex gap-2">
          <div className="row g-2 flex-grow-1">
            {fields.map(field => (
              <div key={field.key} className={field.width || 'col-12'}>
                {field.type === 'checkbox' ? (
                  <label className="form-check h-100 d-flex align-items-center gap-2 mb-0">
                    <input type="checkbox" className="form-check-input mt-0" checked={item?.[field.key] === true} onChange={e => update(index, field.key, e.target.checked)} />
                    <span className="small">{field.placeholder}</span>
                  </label>
                ) : field.type === 'color' ? (
                  <div className="input-group" title={field.placeholder}>
                    <input type="color" className="form-control form-control-color" value={/^#[0-9a-f]{6}$/i.test(item?.[field.key] || '') ? item[field.key] : '#0e96ac'} onChange={e => update(index, field.key, e.target.value)} />
                    <input type="text" className="form-control" placeholder={field.placeholder} value={item?.[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} />
                  </div>
                ) : field.textarea ? (
                  <textarea className="form-control" rows={2} placeholder={field.placeholder} value={item?.[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} />
                ) : (field.media ?? MEDIA_KEY.test(field.key)) ? (
                  <MediaTextInput value={item?.[field.key]} onChange={value => update(index, field.key, value)} placeholder={field.placeholder} />
                ) : (
                  <input type="text" className="form-control" placeholder={field.placeholder} value={item?.[field.key] || ''} onChange={e => update(index, field.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
          <div className="d-flex flex-column gap-1">
            <button type="button" className="btn btn-sm btn-light" onClick={() => move(index, -1)} disabled={index === 0} title="Move up"><i className="bi bi-arrow-up"></i></button>
            <button type="button" className="btn btn-sm btn-light" onClick={() => move(index, 1)} disabled={index === list.length - 1} title="Move down"><i className="bi bi-arrow-down"></i></button>
            <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => remove(index)} title="Remove"><i className="bi bi-trash"></i></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SelectField = ({ label, value, onChange, options, hint, className = 'col-md-6' }) => (
  <div className={className}>
    <label className="form-label">{label}</label>
    <select className="form-select" value={value || options[0]?.value} onChange={e => onChange(e.target.value)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {hint && <div className="form-text">{hint}</div>}
  </div>
);
