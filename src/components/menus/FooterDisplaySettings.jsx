import React from 'react';
import { Link } from 'react-router-dom';
import { FOOTER_DISPLAY_DEFAULTS } from './footerDisplay';

/**
 * "Footer Display" card of the footer menu (location "footer"): what the website footer shows
 * around the menu links. Stored as menu.settings; unset fields use FOOTER_DISPLAY_DEFAULTS.
 */

const Toggle = ({ id, label, checked, onChange }) => (
  <div className="form-check form-switch mb-0">
    <input className="form-check-input" type="checkbox" role="switch" id={id} checked={checked} onChange={e => onChange(e.target.checked)} />
    <label className="form-check-label fw-semibold" htmlFor={id}>{label}</label>
  </div>
);

const Field = ({ label, value, onChange, placeholder, className = 'col-md-6', disabled, textarea }) => (
  <div className={className}>
    <label className="form-label small text-muted mb-1">{label}</label>
    {textarea
      ? <textarea className="form-control form-control-sm" rows={2} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
      : <input type="text" className="form-control form-control-sm" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />}
  </div>
);

// One block of the footer: a show/hide switch, then its fields (greyed out while hidden).
const Part = ({ id, title, hint, show, onShow, children }) => (
  <div className="border rounded-3 p-3 mb-3">
    <div className="d-flex justify-content-between align-items-start gap-2">
      <Toggle id={id} label={title} checked={show} onChange={onShow} />
      {hint && <span className="small text-muted text-end">{hint}</span>}
    </div>
    {children && <div className={`row g-2 mt-1 ${show ? '' : 'opacity-50'}`}>{children}</div>}
  </div>
);

const FooterDisplaySettings = ({ value, onChange }) => {
  const s = { ...FOOTER_DISPLAY_DEFAULTS, ...(value || {}) };
  const set = (key) => (v) => onChange({ ...s, [key]: v });

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <h5 className="card-title fw-bold mb-1">
          <i className="bi bi-layout-text-window-reverse me-2 text-primary"></i>Footer Display
        </h5>
        <p className="small text-muted mb-4">
          Switch each part of the website footer on or off. In the links above, a Main heading (e.g. Business Services) shows its Column headings with their links; links with nothing under them show in the bottom row.
          The logo is the Light Logo (else Logo) from <Link to="/settings/organization">Settings → Organization</Link>.
        </p>

        <Part id="ft-logo" title="Logo" show={s.showLogo} onShow={set('showLogo')} hint="From Settings → Organization" />

        <Part id="ft-intro" title="Text under the logo" show={s.showIntro} onShow={set('showIntro')}>
          <Field className="col-12" textarea label="Text" value={s.intro} onChange={set('intro')} disabled={!s.showIntro} />
        </Part>

        <Part id="ft-button" title="Button under the text" show={s.showButton} onShow={set('showButton')}>
          <Field label="Button text" value={s.buttonText} onChange={set('buttonText')} disabled={!s.showButton} />
          <Field label="Button link" value={s.buttonUrl} onChange={set('buttonUrl')} placeholder="/talk-to-expert" disabled={!s.showButton} />
        </Part>

        <Part id="ft-hiring" title="We're Hiring strip" show={s.showHiring} onShow={set('showHiring')}>
          <Field className="col-md-2" label="Emoji" value={s.hiringEmoji} onChange={set('hiringEmoji')} disabled={!s.showHiring} />
          <Field className="col-md-4" label="Title" value={s.hiringTitle} onChange={set('hiringTitle')} disabled={!s.showHiring} />
          <Field label="Text" value={s.hiringText} onChange={set('hiringText')} disabled={!s.showHiring} />
          <Field label="Button text" value={s.hiringButtonText} onChange={set('hiringButtonText')} disabled={!s.showHiring} />
          <Field label="Button link" value={s.hiringButtonUrl} onChange={set('hiringButtonUrl')} placeholder="/careers" disabled={!s.showHiring} />
        </Part>

        <Part id="ft-links" title="Main headings and link columns" show={s.showLinks} onShow={set('showLinks')}>
          <Field label="Title for columns not under a main heading (empty = none)" value={s.linksTitle} onChange={set('linksTitle')} placeholder="Business Services" disabled={!s.showLinks} />
          <Field label="Heading of the bottom-row links (links without sub-links)" value={s.quickLinksTitle} onChange={set('quickLinksTitle')} placeholder="Quick Links" />
        </Part>

        <Part id="ft-contact" title="Get in touch" show={s.showContact} onShow={set('showContact')} hint="Empty fields use Settings → Address / Contact">
          <Field className="col-12" label="Title" value={s.contactTitle} onChange={set('contactTitle')} disabled={!s.showContact} />
          {[
            ['showAddress', 'address', 'Address', 'From Settings → Address'],
            ['showPhone', 'phone', 'Phone', 'From Settings → Contact'],
            ['showEmail', 'email', 'Email', 'From Settings → Contact'],
          ].map(([showKey, key, label, placeholder]) => (
            <div key={key} className="col-md-4">
              <Toggle id={`ft-${key}`} label={label} checked={s[showKey]} onChange={set(showKey)} />
              <input type="text" className="form-control form-control-sm mt-1" value={s[key] ?? ''} onChange={e => set(key)(e.target.value)} placeholder={placeholder} disabled={!s.showContact || !s[showKey]} />
            </div>
          ))}
          <div className="col-12 mt-2">
            <Toggle id="ft-social" label="Social icons" checked={s.showSocial} onChange={set('showSocial')} />
            <div className="form-text">Links from <Link to="/settings/social">Settings → Social Media</Link>.</div>
          </div>
        </Part>

        <Part id="ft-copy" title="Copyright line" show={s.showCopyright} onShow={set('showCopyright')}>
          <Field className="col-12" label="Text ({year} becomes the current year)" value={s.copyright} onChange={set('copyright')} disabled={!s.showCopyright} />
        </Part>
      </div>
    </div>
  );
};

export default FooterDisplaySettings;
