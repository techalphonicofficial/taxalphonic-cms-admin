import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import MediaPickButton from '../media/MediaPickButton';
import SearchableSelect from '../common/SearchableSelect';
import { FormService } from '../../services/form.service';
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
// Button / link URLs that open a CMS form in a popup on the website (lib/formPopup.js there):
// "#form-<form id>" = that form, "#form" = the page's own form (first Form block).
const POPUP_URL = /^#form(?:-([A-Za-z0-9_-]{1,64}))?$/;
const popupFormOf = (url) => {
  const match = POPUP_URL.exec(String(url || '').trim());
  return match ? match[1] || '' : null;
};

/** Active CMS forms for a popup button; "" = the page's own form. */
const PopupFormSelect = ({ value, onChange }) => {
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms', 'active'],
    queryFn: async () => (await FormService.getAll({ status: 'active', limit: 1000, sortBy: 'name', sortOrder: 'ASC' })).data || [],
  });
  return (
    <SearchableSelect
      value={value}
      onChange={(v) => onChange(v || '')}
      loading={isLoading}
      spaced={false}
      placeholder="The form on this page"
      emptyLabel="The form on this page (first Form block)"
      searchPlaceholder="Search forms..."
      options={[
        ...forms.map(f => ({ value: String(f.id), label: f.name, sub: `${(f.fields || []).length} fields · ${f.slug}` })),
        ...(value && !isLoading && !forms.some(f => String(f.id) === value) ? [{ value, label: 'Unknown or inactive form' }] : []),
      ]}
    />
  );
};

// Landing pages never navigate away (website lib/landingLinks.js): PageBuilder blockSet="landing"
// provides "landing", and buttons then offer only a form popup, a section of this page, a phone
// call or an email. Any other link is turned into the form popup by the website.
export const LinkPolicyContext = createContext('any');
export const isInPageLink = (url) => {
  const value = String(url || '').trim();
  return !value || value.startsWith('#') || /^\/#/.test(value) || /^(tel|mailto|sms):/i.test(value);
};

const LANDING_ACTIONS = [
  { value: 'popup', label: 'Opens a form popup' },
  { value: 'section', label: 'Goes to a section of this page' },
  { value: 'phone', label: 'Calls a phone number' },
  { value: 'email', label: 'Sends an email' },
];
const landingActionOf = (url) => {
  const value = String(url || '').trim();
  if (popupFormOf(value) !== null) return 'popup';
  if (/^tel:/i.test(value)) return 'phone';
  if (/^mailto:/i.test(value)) return 'email';
  return 'section';
};

/** Optional icon on a button: emoji or a Media image, before or after the text (website ButtonLabel.jsx). */
const ButtonIconInput = ({ button, set }) => (
  <div className="d-flex gap-2 mt-2">
    <div className="flex-grow-1">
      <MediaTextInput value={button.icon} onChange={icon => set({ icon })} placeholder="Icon on the button (optional): emoji like ➜ 📞 ⚡ or an image" />
    </div>
    {String(button.icon || '').trim() && (
      <select className="form-select flex-grow-0" style={{ width: 'auto' }} value={button.iconSide === 'right' ? 'right' : 'left'} onChange={e => set({ iconSide: e.target.value })} title="Where the icon sits">
        <option value="left">Icon before text</option>
        <option value="right">Icon after text</option>
      </select>
    )}
  </div>
);

/** ButtonField on a landing page: only actions that keep the visitor on the page. */
const LandingButtonField = ({ label, button, set, className }) => {
  const action = landingActionOf(button.url);
  const url = String(button.url || '').trim();
  const outbound = !isInPageLink(url);
  const switchTo = (next) => set({ url: next === 'popup' ? '#form' : next === 'phone' ? 'tel:' : next === 'email' ? 'mailto:' : '#' });
  const prefix = { phone: 'tel:', email: 'mailto:', section: '#' }[action];
  const rest = action === 'section' ? url.replace(/^\/?#/, '') : url.replace(/^(tel|mailto):/i, '');
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      <div className="input-group">
        <input type="text" className="form-control" placeholder="Button text" value={button.text || ''} onChange={e => set({ text: e.target.value })} />
        <select className="form-select flex-grow-0" style={{ width: 'auto' }} value={action} onChange={e => switchTo(e.target.value)} title="What a click on the button does">
          {LANDING_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {action !== 'popup' && (
          <>
            <span className="input-group-text font-monospace">{prefix}</span>
            <input
              type="text"
              className={`form-control ${outbound ? 'is-invalid' : ''}`}
              placeholder={{ section: 'process, faq, enquiry (block anchor id)', phone: '+919876543210', email: 'hello@taxalphonic.com' }[action]}
              value={outbound ? url : rest}
              onChange={e => set({ url: `${prefix}${e.target.value.trim().replace(/^#/, '')}` })}
            />
          </>
        )}
      </div>
      {action === 'popup' && (
        <div className="mt-2">
          <PopupFormSelect value={popupFormOf(url)} onChange={(id) => set({ url: id ? `#form-${id}` : '#form' })} />
        </div>
      )}
      <ButtonIconInput button={button} set={set} />
      <div className={`form-text ${outbound ? 'text-danger' : ''}`}>
        {outbound
          ? 'This link leaves the landing page, which is not allowed (ads): on the website it opens the form popup instead. Pick one of the actions above.'
          : 'Landing pages never send visitors to another page. Leave the text empty to hide this button.'}
      </div>
    </div>
  );
};

/** A CMS button { text, url }: opens a link, or (on the website) a CMS form in a popup. */
export const ButtonField = ({ label, value, onChange, className = 'col-md-6' }) => {
  const policy = useContext(LinkPolicyContext);
  const button = value || {};
  const set = (patch) => onChange({ ...button, ...patch });
  const popupForm = popupFormOf(button.url);
  const popup = popupForm !== null;

  if (policy === 'landing') return <LandingButtonField label={label} button={button} set={set} className={className} />;

  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      <div className="input-group">
        <input type="text" className="form-control" placeholder="Button text" value={button.text || ''} onChange={e => set({ text: e.target.value })} />
        <select
          className="form-select flex-grow-0"
          style={{ width: 'auto' }}
          value={popup ? 'popup' : 'link'}
          onChange={e => set({ url: e.target.value === 'popup' ? '#form' : '' })}
          title="What a click on the button does"
        >
          <option value="link">Opens a link</option>
          <option value="popup">Opens a form popup</option>
        </select>
        {!popup && <input type="text" className="form-control" placeholder="Link (/talk-to-expert, #pricing, https://…)" value={button.url || ''} onChange={e => set({ url: e.target.value })} />}
      </div>
      {popup && (
        <div className="mt-2">
          <PopupFormSelect value={popupForm} onChange={(id) => set({ url: id ? `#form-${id}` : '#form' })} />
        </div>
      )}
      <ButtonIconInput button={button} set={set} />
      <div className="form-text">
        {popup ? 'A click opens the chosen form in a popup (submissions go to CRM Leads). ' : ''}Leave the text empty to hide this button.
      </div>
    </div>
  );
};

/**
 * Editable list of objects. `fields`: [{ key, placeholder, textarea?, type: 'checkbox' | 'color' | 'list'?, width?, media? }]
 * Fields named icon / image / logo / avatar / photo (or media: true) get the Media picker.
 * where width is a Bootstrap column class (default col-12).
 * type 'list' (with its own `fields`, `label`, `addLabel`) is a list inside each item, e.g. the
 * links of an Explore card or the cards of a Q&A tab.
 */
export const RepeaterField = ({ label, items, onChange, fields, addLabel = 'Add item', newItem = {}, nested = false }) => {
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
        <div key={index} className={`${nested ? 'p-2 bg-body-tertiary' : 'p-3 bg-white'} mb-2 border rounded-4 d-flex gap-2`}>
          <div className="row g-2 flex-grow-1">
            {fields.map(field => (
              <div key={field.key} className={field.width || 'col-12'}>
                {field.type === 'list' ? (
                  <div className="row">
                    <RepeaterField
                      nested
                      label={field.label || field.placeholder}
                      items={item?.[field.key]}
                      onChange={value => update(index, field.key, value)}
                      fields={field.fields}
                      addLabel={field.addLabel}
                    />
                  </div>
                ) : field.type === 'checkbox' ? (
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
