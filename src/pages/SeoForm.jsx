import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { toast } from 'react-toastify';
import api from '../services/api';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';
import { siteUrl } from '../config/siteUrl';

/**
 * SEO Config: a detailed SEO override for ONE website page. Pick the page (service, CMS page,
 * pSEO page, Home / About, or a typed URL); the website then uses every field filled here over
 * that page's own SEO, and keeps the page's own value for fields left empty.
 * Backend: controllers/SeoController.js (works out the URL from the picked record).
 */

const MEDIA_BASE = (import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com').replace(/\/$/, '');
const mediaUrl = (url) => (!url || /^(https?:)?\/\//i.test(url) ? url : `${MEDIA_BASE}/${url.replace(/^\/+/, '')}`);

const TARGET_TYPES = [
  { value: 'service', label: 'Service', icon: 'bi-briefcase' },
  { value: 'page', label: 'CMS Page', icon: 'bi-file-earmark-text' },
  { value: 'seo_page', label: 'pSEO Page', icon: 'bi-diagram-3' },
  { value: 'static', label: 'Website Page', icon: 'bi-house' },
  { value: 'custom', label: 'Custom URL', icon: 'bi-link-45deg' },
];

const STATIC_PAGES = [
  { id: 'home', label: 'Homepage', route: '/' },
  { id: 'about', label: 'About page', route: '/about' },
];

const ROBOTS = [
  { value: '', label: "Page's default" },
  { value: 'index, follow', label: 'index, follow (show in Google)' },
  { value: 'noindex, follow', label: 'noindex, follow (hide page, follow links)' },
  { value: 'index, nofollow', label: 'index, nofollow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow (hide completely)' },
];

const TWITTER_CARDS = [
  { value: '', label: 'Automatic' },
  { value: 'summary_large_image', label: 'Large image' },
  { value: 'summary', label: 'Small image (summary)' },
];

const EMPTY = {
  targetType: 'service', targetId: '', route: '', status: 'active',
  metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: '',
  ogTitle: '', ogDescription: '', ogImage: '', twitterCard: '', schemaMarkup: '', otherMetaTags: '',
};

const SEO_KEYS = ['metaTitle', 'metaDescription', 'keywords', 'canonicalUrl', 'robots', 'ogTitle', 'ogDescription', 'ogImage', 'twitterCard', 'schemaMarkup'];

const listOf = (res) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const routeOf = (type, item) => {
  if (!item) return '';
  if (type === 'static') return item.route;
  if (type === 'page' && item.slug === 'home') return '/';
  return `/${String(item.slug || '').replace(/^\/+/, '')}`;
};

/** Text input / textarea with a live character counter against the recommended length. */
const CountedField = ({ label, value, onChange, placeholder, ideal, max, textarea, hint }) => {
  const length = (value || '').length;
  const tone = !length ? 'text-muted' : length > ideal ? 'text-danger' : length >= ideal * 0.7 ? 'text-success' : 'text-warning';
  const Input = textarea ? 'textarea' : 'input';
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-end">
        <label className="form-label fw-medium mb-1">{label}</label>
        <small className={tone}>{length}/{ideal}</small>
      </div>
      <Input className="form-control" rows={textarea ? 3 : undefined} maxLength={max} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
};

const SeoForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState({ service: [], page: [], seo_page: [], static: STATIC_PAGES });
  const [taken, setTaken] = useState(new Set()); // "type:id" of pages that already have a config
  const [current, setCurrent] = useState({}); // the picked page's own SEO (placeholders)

  const set = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }));

  // Pages to pick from, and which ones already have a config.
  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/services', { params: { limit: 1000 } }).catch(() => null),
      api.get('/pages', { params: { limit: 1000 } }).catch(() => null),
      api.get('/seo-pages', { params: { limit: 2000 } }).catch(() => null),
      api.get('/seo', { params: { limit: 1000 } }).catch(() => null),
      isEdit ? api.get(`/seo/${id}`) : Promise.resolve(null),
    ]).then(([services, pages, seoPages, configs, existing]) => {
      if (!alive) return;
      setRecords({
        service: listOf(services).map(s => ({ id: s.id, label: s.title, slug: s.slug })),
        // The CMS page "home" is the Homepage (Website Page).
        page: listOf(pages).filter(p => p.slug !== 'home').map(p => ({ id: p.id, label: p.title, slug: p.slug, status: p.status })),
        seo_page: listOf(seoPages).map(p => ({ id: p.id, label: p.title, slug: p.slug, status: p.status })),
        static: STATIC_PAGES,
      });
      setTaken(new Set(listOf(configs).filter(c => c.targetType && c.targetId && c.id !== id).map(c => `${c.targetType}:${c.targetId}`)));

      const data = existing?.data?.data;
      if (data) {
        // Configs made before page picking (no targetType) open as a Custom URL.
        const next = { ...EMPTY };
        Object.keys(EMPTY).forEach(key => { if (data[key] !== null && data[key] !== undefined) next[key] = data[key]; });
        next.targetType = data.targetType || 'custom';
        next.targetId = data.targetId || '';
        setForm(next);
      }
    }).catch(() => toast.error('Failed to load SEO configuration.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, isEdit]);

  const items = records[form.targetType] || [];
  const selected = items.find(item => String(item.id) === String(form.targetId)) || null;
  const route = form.targetType === 'custom' ? form.route : routeOf(form.targetType, selected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? items.filter(item => `${item.label} ${item.slug || item.route || ''}`.toLowerCase().includes(q)) : items;
    return list.slice(0, 300);
  }, [items, query]);

  // The picked page's own SEO, shown as placeholders ("what the page uses now").
  useEffect(() => {
    let alive = true;
    const endpoint = { service: '/services', page: '/pages', seo_page: '/seo-pages' }[form.targetType];
    if (!endpoint || !form.targetId) {
      setCurrent({});
      return undefined;
    }
    api.get(`${endpoint}/${form.targetId}`)
      .then(res => {
        if (!alive) return;
        const d = res.data?.data || res.data || {};
        setCurrent({ ...d, metaTitle: d.metaTitle || d.title || '' });
      })
      .catch(() => alive && setCurrent({}));
    return () => { alive = false; };
  }, [form.targetType, form.targetId]);

  const copyCurrent = () => {
    const next = {};
    SEO_KEYS.forEach(key => { if (current[key]) next[key] = String(current[key]); });
    if (!Object.keys(next).length) return toast.info('This page has no SEO of its own yet.');
    setForm(prev => ({ ...prev, ...next }));
    return toast.success('Copied the page\'s current SEO — edit what you need.');
  };

  const formatSchema = () => {
    if (!form.schemaMarkup.trim()) return;
    try {
      set('schemaMarkup')(JSON.stringify(JSON.parse(form.schemaMarkup), null, 2));
      setErrors(prev => ({ ...prev, schemaMarkup: '' }));
    } catch {
      setErrors(prev => ({ ...prev, schemaMarkup: 'Not valid JSON.' }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (form.targetType === 'custom' && !form.route.trim()) nextErrors.route = 'Enter the URL path, e.g. /contact';
    if (form.targetType !== 'custom' && !form.targetId) nextErrors.targetId = 'Select the page this SEO is for.';
    if (form.schemaMarkup.trim()) {
      try { JSON.parse(form.schemaMarkup); } catch { nextErrors.schemaMarkup = 'Schema must be valid JSON.'; }
    }
    if (form.canonicalUrl && !/^https?:\/\/\S+$/i.test(form.canonicalUrl)) nextErrors.canonicalUrl = 'Use a full URL, e.g. https://taxalphonic.com/gst-registration';
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return toast.warn(Object.values(nextErrors).find(Boolean));

    setSaving(true);
    try {
      const payload = { ...form, targetId: form.targetType === 'custom' ? null : form.targetId };
      if (isEdit) await api.put(`/seo/${id}`, payload);
      else await api.post('/seo', payload);
      toast.success(isEdit ? 'SEO configuration updated' : 'SEO configuration created');
      navigate('/cms/seo');
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors)) setErrors(Object.fromEntries(apiErrors.map(er => [er.field, er.message])));
      toast.error(error.response?.data?.message || 'Error saving SEO configuration');
    } finally {
      setSaving(false);
    }
    return null;
  };

  // Google result preview: config value, else the page's own.
  const previewTitle = form.metaTitle || current.metaTitle || selected?.label || 'Page title';
  const previewDescription = form.metaDescription || current.metaDescription || 'The meta description appears here in search results.';
  const ogImage = form.ogImage || current.ogImage || '';

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <div className="ta-editor-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'SEO Management', link: '/cms/seo' }, { label: isEdit ? 'Edit Config' : 'New Config' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEdit ? 'Edit SEO Configuration' : 'Create SEO Configuration'}
          </h2>
          <p className="text-muted small mb-0">Fields you fill here replace the page's own SEO on the website; empty fields keep the page's own value (shown greyed out).</p>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <button type="button" className="btn btn-light flex-grow-1 fw-medium" onClick={() => navigate('/cms/seo')}>Cancel</button>
          <button type="submit" form="seo-config-form" className="premium-btn-primary flex-grow-1 justify-content-center" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</> : <><i className="bi bi-check-lg me-2"></i> Save Config</>}
          </button>
        </div>
      </div>

      <form id="seo-config-form" onSubmit={onSubmit} noValidate>
        <div className="row g-4">
          <div className="col-lg-8">
            {/* 1. Which page */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-bullseye me-2 text-primary"></i>Apply to</h5>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {TARGET_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 ${form.targetType === type.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => { setForm(prev => ({ ...prev, targetType: type.value, targetId: '' })); setQuery(''); setErrors({}); }}
                    >
                      <i className={`bi ${type.icon} me-1`}></i>{type.label}
                    </button>
                  ))}
                </div>

                {form.targetType === 'custom' ? (
                  <div>
                    <label className="form-label fw-medium">URL path <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${errors.route ? 'is-invalid' : ''}`} value={form.route} onChange={e => set('route')(e.target.value)} placeholder="/contact" />
                    {errors.route && <div className="invalid-feedback">{errors.route}</div>}
                    <div className="form-text">For a website page that isn't a service, CMS page or pSEO page. Starts with /.</div>
                  </div>
                ) : (
                  <div>
                    {form.targetType !== 'static' && (
                      <div className="input-group input-group-sm mb-2">
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input type="search" className="form-control" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${items.length} ${TARGET_TYPES.find(t => t.value === form.targetType)?.label.toLowerCase()}s…`} />
                      </div>
                    )}
                    <div className={`border rounded-3 overflow-auto ${errors.targetId ? 'border-danger' : ''}`} style={{ maxHeight: 260 }}>
                      {filtered.length === 0 && <div className="p-3 text-muted small text-center">Nothing found.</div>}
                      {filtered.map(item => {
                        const key = `${form.targetType}:${item.id}`;
                        const isTaken = taken.has(key);
                        const active = String(item.id) === String(form.targetId);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isTaken}
                            onClick={() => { set('targetId')(String(item.id)); setErrors(prev => ({ ...prev, targetId: '' })); }}
                            className={`w-100 text-start border-0 border-bottom px-3 py-2 d-flex justify-content-between align-items-center gap-2 ${active ? 'bg-primary bg-opacity-10' : 'bg-transparent'}`}
                          >
                            <span style={{ minWidth: 0 }}>
                              <span className={`d-block text-truncate ${active ? 'fw-bold text-primary' : 'fw-medium'}`}>{item.label}</span>
                              <span className="d-block small text-muted font-monospace text-truncate">{routeOf(form.targetType, item)}</span>
                            </span>
                            <span className="d-flex gap-1 flex-shrink-0">
                              {item.status && String(item.status).toUpperCase() !== 'PUBLISHED' && String(item.status).toLowerCase() !== 'active' && (
                                <span className="badge bg-light text-muted border">{String(item.status).toLowerCase()}</span>
                              )}
                              {isTaken && <span className="badge bg-warning-subtle text-warning-emphasis border">Has config</span>}
                              {active && <i className="bi bi-check-circle-fill text-primary"></i>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.targetId && <div className="text-danger small mt-1">{errors.targetId}</div>}
                  </div>
                )}

                {route && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-3 p-2 px-3 bg-body-tertiary rounded-3 small">
                    <span className="text-muted">Website URL:</span>
                    <a href={siteUrl(route)} target="_blank" rel="noreferrer" className="font-monospace text-decoration-none">{siteUrl(route)} <i className="bi bi-box-arrow-up-right"></i></a>
                    {Object.keys(current).length > 0 && (
                      <button type="button" className="btn btn-sm btn-outline-primary ms-auto" onClick={copyCurrent}>
                        <i className="bi bi-clipboard-plus me-1"></i>Copy this page's current SEO
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Search result */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-google me-2 text-primary"></i>Search result</h5>

                <div className="border rounded-3 p-3 mb-4 bg-white">
                  <div className="small text-muted mb-1">Google preview</div>
                  <div className="small text-success text-truncate">{route ? siteUrl(route) : 'https://…'}</div>
                  <div className="fs-5 text-truncate" style={{ color: '#1a0dab' }}>{previewTitle}</div>
                  <div className="small text-secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{previewDescription}</div>
                </div>

                <CountedField label="Meta title" value={form.metaTitle} onChange={set('metaTitle')} ideal={60} max={255}
                  placeholder={current.metaTitle || 'e.g. GST Registration Online in 3 Days | Tax Alphonic'}
                  hint="50–60 characters. Put the main keyword first." />
                <CountedField label="Meta description" value={form.metaDescription} onChange={set('metaDescription')} ideal={160} max={500} textarea
                  placeholder={current.metaDescription || 'A clear summary with the keyword and a reason to click.'}
                  hint="120–160 characters." />
                <div className="mb-0">
                  <label className="form-label fw-medium">Keywords</label>
                  <input type="text" className="form-control" value={form.keywords} onChange={e => set('keywords')(e.target.value)} placeholder={current.keywords || 'gst registration, gst online, gst number'} />
                  <div className="form-text">Comma-separated. Google mostly ignores this; other engines may use it.</div>
                </div>
              </div>
            </div>

            {/* 3. Indexing */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-robot me-2 text-primary"></i>Indexing</h5>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label fw-medium">Robots</label>
                    <select className="form-select" value={form.robots} onChange={e => set('robots')(e.target.value)}>
                      {ROBOTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {current.robots && !form.robots && <div className="form-text">Page default: {current.robots}</div>}
                  </div>
                  <div className="col-md-7">
                    <label className="form-label fw-medium">Canonical URL</label>
                    <input type="url" className={`form-control ${errors.canonicalUrl ? 'is-invalid' : ''}`} value={form.canonicalUrl} onChange={e => set('canonicalUrl')(e.target.value)} placeholder={current.canonicalUrl || 'https://taxalphonic.com/…'} />
                    {errors.canonicalUrl ? <div className="invalid-feedback">{errors.canonicalUrl}</div> : <div className="form-text">Only when another URL is the main version of this page.</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Social share */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-share me-2 text-primary"></i>Social share (WhatsApp, Facebook, LinkedIn, X)</h5>
                <CountedField label="Share title" value={form.ogTitle} onChange={set('ogTitle')} ideal={60} max={255} placeholder={current.ogTitle || form.metaTitle || current.metaTitle || 'Defaults to the meta title'} />
                <CountedField label="Share description" value={form.ogDescription} onChange={set('ogDescription')} ideal={160} max={500} textarea placeholder={current.ogDescription || form.metaDescription || current.metaDescription || 'Defaults to the meta description'} />
                <div className="col-md-5 p-0">
                  <label className="form-label fw-medium">X / Twitter card</label>
                  <select className="form-select" value={form.twitterCard} onChange={e => set('twitterCard')(e.target.value)}>
                    {TWITTER_CARDS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Advanced */}
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3"><i className="bi bi-code-slash me-2 text-primary"></i>Advanced</h5>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-end">
                    <label className="form-label fw-medium mb-1">Schema (JSON-LD)</label>
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={formatSchema}>Check &amp; format</button>
                  </div>
                  <textarea className={`form-control font-monospace small ${errors.schemaMarkup ? 'is-invalid' : ''}`} rows={7} value={form.schemaMarkup} onChange={e => set('schemaMarkup')(e.target.value)}
                    placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Service",\n  "name": "GST Registration",\n  "areaServed": "India"\n}'} />
                  {errors.schemaMarkup ? <div className="invalid-feedback">{errors.schemaMarkup}</div> : <div className="form-text">Replaces the page's own schema. JSON only, without &lt;script&gt; tags.</div>}
                </div>
                <div>
                  <label className="form-label fw-medium">Other meta tags</label>
                  <textarea className="form-control font-monospace small" rows={3} value={form.otherMetaTags} onChange={e => set('otherMetaTags')(e.target.value)}
                    placeholder={'<meta name="google-site-verification" content="…">\n<meta name="author" content="Tax Alphonic">'} />
                  <div className="form-text">Only &lt;meta name/property="…" content="…"&gt; tags are added to the page; scripts and other tags are ignored for safety.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3">Share image</h5>
                {ogImage ? (
                  <div className="position-relative mb-2 rounded overflow-hidden" style={{ border: '1px solid #e5e7eb', aspectRatio: '1.91 / 1', backgroundColor: '#f9fafb' }}>
                    <img src={mediaUrl(ogImage)} alt="OG" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: form.ogImage ? 1 : 0.5 }} />
                    {!form.ogImage && <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75">Page's own image</span>}
                    <div className="position-absolute top-0 end-0 p-2 d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-light" onClick={() => setShowMediaPicker(true)} title="Change image"><i className="bi bi-pencil"></i></button>
                      {form.ogImage && <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => set('ogImage')('')} title="Remove image"><i className="bi bi-trash"></i></button>}
                    </div>
                  </div>
                ) : (
                  <button type="button" className="w-100 d-flex flex-column align-items-center justify-content-center p-4 rounded mb-2 bg-body-tertiary" style={{ border: '2px dashed #d1d5db', aspectRatio: '1.91 / 1' }} onClick={() => setShowMediaPicker(true)}>
                    <i className="bi bi-image text-muted fs-2 mb-2"></i>
                    <span className="text-primary fw-medium small">Select Media</span>
                  </button>
                )}
                <ImageSizeHint kind="ogImage" />
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 position-sticky ta-below-bar">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3">Settings</h5>
                <label className="form-label fw-medium">Status</label>
                <select className="form-select mb-2" value={form.status} onChange={e => set('status')(e.target.value)}>
                  <option value="active">Active (used on the website)</option>
                  <option value="inactive">Inactive (page uses its own SEO)</option>
                </select>
                {selected && <div className="small text-muted">For: <b>{selected.label}</b></div>}
              </div>
            </div>
          </div>
        </div>
      </form>

      {showMediaPicker && (
        <MediaPickerModal show={showMediaPicker} onClose={() => setShowMediaPicker(false)} onSelect={(item) => { set('ogImage')(item.url); setShowMediaPicker(false); }} />
      )}
    </div>
  );
};

export default SeoForm;
