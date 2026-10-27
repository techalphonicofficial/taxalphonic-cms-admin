import React, { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { LANDING_LAYOUTS, layoutSketch } from '../../components/page-builder/landingLayouts';
import { LANDING_THEMES } from '../../components/page-builder/landingThemes';

// Ready-made landing page layouts (landingLayouts.js): cards with a small wireframe of the page,
// used on the create form and in the Builder's "Change layout" window.

const SHORT = {
  HeroBanner: 'Hero', Overview: 'About', Form: 'Form', WhyUs: 'Why us', OurProcess: 'Process', Faq: 'FAQ',
  Highlights: 'Highlights', Checklist: 'Checklist', CallToAction: 'Call to action', ServicesIncluded: 'Included',
  HomeTestimonials: 'Reviews', HomeTrustBar: 'Trust bar', HomeClients: 'Clients', HomeSecurity: 'Security',
  HomeFinalCta: 'Final CTA', HomeBundles: 'Plans', HomeComparison: 'Compare', HomeExpertCta: 'Expert banner',
  CommonStats: 'Numbers', CommonImageText: 'Image + text',
};
const themeOf = (key) => LANDING_THEMES.find((t) => t.key === key) || LANDING_THEMES[0];

const Box = ({ type, strong }) => (
  <span className={`lp-sk-box${type === 'Form' ? ' is-form' : ''}${strong ? ' is-strong' : ''}`}>{SHORT[type] || type}</span>
);

/** Small wireframe of a layout: header, hero, top, main | sidebar, bottom, footer. */
export const LayoutThumb = ({ layoutKey }) => {
  const sketch = useMemo(() => layoutSketch(layoutKey), [layoutKey]);
  const layout = LANDING_LAYOUTS.find((l) => l.key === layoutKey);
  const theme = themeOf(layout?.theme);
  return (
    <div className="lp-sk" style={{ '--sk-brand': theme.brand, '--sk-accent': theme.accent, '--sk-deep': theme.deep }} aria-hidden>
      <span className="lp-sk-bar" />
      {sketch.hero.map((t, i) => <Box key={`h${i}`} type={t} strong />)}
      {sketch.top.map((t, i) => <Box key={`t${i}`} type={t} />)}
      {(sketch.main.length > 0 || sketch.sidebar.length > 0) && (
        <div className={`lp-sk-cols${sketch.sidebar.length ? '' : ' is-full'}`}>
          <div>{sketch.main.map((t, i) => <Box key={`m${i}`} type={t} />)}</div>
          {sketch.sidebar.length > 0 && <div>{sketch.sidebar.map((t, i) => <Box key={`s${i}`} type={t} />)}</div>}
        </div>
      )}
      {sketch.bottom.map((t, i) => <Box key={`b${i}`} type={t} />)}
      <span className="lp-sk-bar is-footer" />
    </div>
  );
};

/** Grid of layout cards; value = layout key. */
export const LayoutPicker = ({ value, onChange, disabled = false }) => (
  <div className="lp-layouts" role="radiogroup" aria-label="Page layout">
    {LANDING_LAYOUTS.map((layout) => (
      <button
        key={layout.key}
        type="button"
        role="radio"
        aria-checked={value === layout.key}
        className={`lp-layout${value === layout.key ? ' active' : ''}`}
        onClick={() => onChange(layout)}
        disabled={disabled}
      >
        <LayoutThumb layoutKey={layout.key} />
        <span className="lp-layout-name">
          {layout.name}
          {value === layout.key && <i className="bi bi-check-circle-fill text-primary ms-1" />}
        </span>
        <span className="lp-layout-desc">{layout.description}</span>
        <span className="lp-layout-theme"><i style={{ background: themeOf(layout.theme).brand }} />{themeOf(layout.theme).name} theme</span>
      </button>
    ))}
  </div>
);

/** Builder: pick a layout to replace the page body (Header, Footer, theme and form are kept). */
export const ChangeLayoutModal = ({ show, onHide, onApply }) => {
  const [picked, setPicked] = useState(null);
  const [withTheme, setWithTheme] = useState(true);
  const close = () => { setPicked(null); onHide(); };
  return (
    <Modal show={show} onHide={close} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-5"><i className="bi bi-layout-text-window-reverse me-2 text-primary"></i>Choose a ready-made layout</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted">
          The blocks between the Header and the Footer are replaced by the layout's blocks (with starting text you can edit).
          Header, Footer and the enquiry form stay. Your current blocks stay in the saved draft until you save, and published versions are not touched.
        </p>
        <LayoutPicker value={picked?.key} onChange={setPicked} />
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <label className="form-check mb-0">
          <input type="checkbox" className="form-check-input" checked={withTheme} onChange={(e) => setWithTheme(e.target.checked)} />
          <span className="form-check-label small">Also use the layout's colour theme{picked ? ` (${themeOf(picked.theme).name})` : ''}</span>
        </label>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light" onClick={close}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!picked} onClick={() => { onApply(picked, withTheme); setPicked(null); }}>
            Use this layout
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
