import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import ServicePreviewPane from '../../components/page-builder/ServicePreviewPane';
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

/**
 * Grid of layout cards; value = layout key. With `onPreview`, every card also gets a "Preview"
 * button that shows the real page before the layout is chosen.
 */
export const LayoutPicker = ({ value, onChange, onPreview, disabled = false }) => (
  <div className="lp-layouts" role="radiogroup" aria-label="Page layout">
    {LANDING_LAYOUTS.map((layout) => (
      <div key={layout.key} className={`lp-layout-wrap${value === layout.key ? ' active' : ''}`}>
        <button
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
        {onPreview && (
          <button type="button" className="lp-layout-preview-btn" onClick={() => onPreview(layout)} disabled={disabled}>
            <i className="bi bi-eye me-1" />Preview
          </button>
        )}
      </div>
    ))}
  </div>
);

/**
 * Layout chooser with a live preview: layouts on the left, the real page (website components,
 * SitePreviewFrame) on the right, so the layout is seen before it is used.
 * buildSections(layout, alsoTheme) → the sections the page would get; onUse(layout, alsoTheme).
 * themeToggle: shows "Also use the layout's colour theme" (Builder); without it the layout's theme is used.
 */
export const LayoutPreviewModal = ({
  show, onHide, initialKey, buildSections, previewTitle = '', onUse, themeToggle = false,
  title = 'Choose a ready-made layout', note = '', useLabel = 'Use this layout',
}) => {
  const [pickedKey, setPickedKey] = useState(initialKey || LANDING_LAYOUTS[0].key);
  const [alsoTheme, setAlsoTheme] = useState(true);
  const picked = LANDING_LAYOUTS.find((l) => l.key === pickedKey) || LANDING_LAYOUTS[0];
  const withLayoutTheme = themeToggle ? alsoTheme : true;

  // Open on the layout the caller asked for (the card whose Preview was clicked).
  useEffect(() => {
    if (show) setPickedKey(initialKey || LANDING_LAYOUTS[0].key);
  }, [show, initialKey]);

  const draft = useMemo(() => {
    if (!show) return null;
    return { title: previewTitle, sections: buildSections(picked, withLayoutTheme) };
    // buildSections is recreated by the caller on every render; the preview follows the choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, picked.key, withLayoutTheme, previewTitle]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="lp-layout-preview-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5"><i className="bi bi-layout-text-window-reverse me-2 text-primary"></i>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="lp-lpm">
          <div className="lp-lpm-list" role="radiogroup" aria-label="Page layout">
            {note && <p className="small text-muted mb-2">{note}</p>}
            {LANDING_LAYOUTS.map((layout) => (
              <button
                key={layout.key}
                type="button"
                role="radio"
                aria-checked={layout.key === picked.key}
                className={`lp-lpm-item${layout.key === picked.key ? ' active' : ''}`}
                onClick={() => setPickedKey(layout.key)}
              >
                <LayoutThumb layoutKey={layout.key} />
                <span className="lp-lpm-text">
                  <span className="lp-layout-name">{layout.name}</span>
                  <span className="lp-layout-desc">{layout.description}</span>
                  <span className="lp-layout-theme"><i style={{ background: themeOf(layout.theme).brand }} />{themeOf(layout.theme).name} theme</span>
                </span>
              </button>
            ))}
          </div>
          <div className="lp-lpm-preview">
            <div className="small fw-semibold mb-1">
              <i className="bi bi-eye me-1 text-primary" />Preview: {picked.name}
              <span className="text-muted fw-normal"> · starting text, edit everything after choosing</span>
            </div>
            {draft && <ServicePreviewPane kind="landing" draft={draft} />}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        {themeToggle ? (
          <label className="form-check mb-0">
            <input type="checkbox" className="form-check-input" checked={alsoTheme} onChange={(e) => setAlsoTheme(e.target.checked)} />
            <span className="form-check-label small">Also use the layout's colour theme ({themeOf(picked.theme).name})</span>
          </label>
        ) : (
          <span className="small text-muted">Colour theme: {themeOf(picked.theme).name} (change it below after choosing)</span>
        )}
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light" onClick={onHide}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => onUse(picked, withLayoutTheme)}>
            <i className="bi bi-check-lg me-1" />{useLabel}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

/** Builder: pick a layout to replace the page body (Header, Footer, theme and form are kept), seen first in the preview. */
export const ChangeLayoutModal = ({ show, onHide, onApply, buildSections, previewTitle }) => (
  <LayoutPreviewModal
    show={show}
    onHide={onHide}
    buildSections={buildSections}
    previewTitle={previewTitle}
    onUse={onApply}
    themeToggle
    note="Click a layout to see your page with it. The blocks between the Header and the Footer are replaced (starting text you can edit); Header, Footer and the enquiry form stay. Nothing is saved until Save draft."
  />
);
