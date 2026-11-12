import React, { useMemo } from 'react';
import MediaPickButton from '../media/MediaPickButton';
import { mediaUrl } from '../../utils/mediaUrl';
import { HERO_BG_DEFAULT, readHeroBg, writeHeroBg } from './pseoHeroBg';

/*
 * "Hero background" card of the pSEO page editor (SeoPageEditForm): a background image for this
 * page's hero, with a colour overlay, text colour and image position. Saved inside the content
 * (pseoHeroBg.js); empty = the hero looks like the service's own Hero Banner.
 */
const POSITIONS = [
  { value: 'center', label: 'Centre' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' },
];

export default function PseoHeroBackground({ html, onChange }) {
  const current = useMemo(() => readHeroBg(html), [html]);
  if (!current) {
    return (
      <div className="alert alert-light border small mb-0">
        <i className="bi bi-info-circle me-1"></i>
        This page's content has no hero section yet (generate or write the content first), so a hero background cannot be set.
      </div>
    );
  }
  const bg = { ...HERO_BG_DEFAULT, ...Object.fromEntries(Object.entries(current).filter(([, v]) => v !== '')) };
  const hasImage = Boolean(current.image);
  const set = (key, value) => onChange(writeHeroBg(html, { ...bg, image: current.image, [key]: value }));
  const opacity = Number(bg.opacity) || 0;

  return (
    <div className="row g-3 align-items-start">
      <div className="col-md-4">
        <div
          className="rounded-3 border position-relative overflow-hidden d-flex align-items-end"
          style={{ aspectRatio: '16 / 7', background: hasImage ? `url("${mediaUrl(current.image)}") ${bg.position} / ${bg.size === 'contain' ? 'contain' : 'cover'} no-repeat, var(--bs-tertiary-bg)` : 'var(--bs-tertiary-bg)' }}
        >
          {hasImage && <span className="position-absolute top-0 start-0 w-100 h-100" style={{ background: bg.overlay, opacity: opacity / 100 }} />}
          <div className="position-relative p-2 small fw-semibold" style={{ color: hasImage && bg.text === 'light' ? '#fff' : 'var(--bs-body-color)' }}>
            {hasImage ? 'Hero heading preview' : 'No image: the service hero design is used'}
          </div>
        </div>
      </div>
      <div className="col-md-8">
        <div className="d-flex flex-wrap gap-2 mb-2">
          <MediaPickButton
            label={hasImage ? 'Change image' : 'Choose background image'}
            className="btn btn-outline-primary"
            size="sm"
            onPick={(url) => onChange(writeHeroBg(html, { ...bg, image: url }))}
          />
          {hasImage && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onChange(writeHeroBg(html, { image: '' }))}>
              <i className="bi bi-x-lg me-1"></i>Remove image
            </button>
          )}
        </div>
        {hasImage && (
          <div className="row g-2">
            <div className="col-6 col-lg-3">
              <label className="form-label small mb-1">Overlay colour</label>
              <input type="color" className="form-control form-control-color w-100" value={/^#[0-9a-f]{6}$/i.test(bg.overlay) ? bg.overlay : '#0a1a2f'} onChange={(e) => set('overlay', e.target.value)} />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label small mb-1 d-flex justify-content-between"><span>Overlay</span><span className="text-muted">{opacity}%</span></label>
              <input type="range" className="form-range" min="0" max="90" step="5" value={opacity} onChange={(e) => set('opacity', e.target.value)} />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label small mb-1">Text colour</label>
              <select className="form-select form-select-sm" value={bg.text} onChange={(e) => set('text', e.target.value)}>
                <option value="light">White text</option>
                <option value="dark">Dark text</option>
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label small mb-1">Image position</label>
              <select className="form-select form-select-sm" value={bg.position} onChange={(e) => set('position', e.target.value)}>
                {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label small mb-1">Image fit</label>
              <select className="form-select form-select-sm" value={bg.size} onChange={(e) => set('size', e.target.value)}>
                <option value="cover">Fill the hero (crop)</option>
                <option value="contain">Whole image</option>
              </select>
            </div>
          </div>
        )}
        <div className="form-text">
          Only this page. Without an image the hero uses the service's Hero Banner background (set it on the service to give all its location pages one background). Kept when AI rewrites the content. Recommended: 1920 × 700 px, WebP.
        </div>
      </div>
    </div>
  );
}
