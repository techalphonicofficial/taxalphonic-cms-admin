import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EditorBar from '../../components/common/EditorBar';
import SettingService from '../../services/setting.service';
import { can, M } from '../../utils/permissions';

/*
 * Settings → Website Layout (settings group "layout", public on the backend). The website turns it
 * into :root CSS variables (service/siteSettingsService.js layoutCss, defaults in app/globals.css):
 *   pageWidth  "full" (default) | "1200" | "1320" | "1440" | "1600" | "1800" | "custom" (+ customWidth)
 *   gutter / gutterMobile  side space in px (default 10)
 *   sectionGap  space between homepage sections in px (default 28)
 *   heroTextWidth  "normal" | "wide" | "full"
 * Every block can still override width and padding in its own Spacing panel.
 */

const WIDTHS = [
  { value: 'full', label: 'Full screen', note: 'Fits any screen (default)' },
  { value: '1200', label: '1200 px', note: 'Compact' },
  { value: '1320', label: '1320 px', note: 'Standard' },
  { value: '1440', label: '1440 px', note: 'Wide' },
  { value: '1600', label: '1600 px', note: 'Extra wide' },
  { value: '1800', label: '1800 px', note: 'Very wide' },
  { value: 'custom', label: 'Custom', note: 'Your own width' },
];

const HERO = [
  { value: 'normal', label: 'Normal', note: 'Heading up to 860 px' },
  { value: 'wide', label: 'Wide', note: 'Heading up to 1100 px' },
  { value: 'full', label: 'Full', note: 'Whole hero column' },
];

const DEFAULTS = { pageWidth: 'full', customWidth: '', gutter: 10, gutterMobile: 10, sectionGap: 28, heroTextWidth: 'normal' };

const Choice = ({ options, value, onChange }) => (
  <div className="row g-2">
    {options.map(o => (
      <div className="col-6 col-md-4 col-xl-3" key={o.value}>
        <button
          type="button"
          className={`btn w-100 text-start h-100 ${value === o.value ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => onChange(o.value)}
        >
          <div className="fw-semibold small">{o.label}</div>
          <div className={`small ${value === o.value ? 'text-white-50' : 'text-muted'}`}>{o.note}</div>
        </button>
      </div>
    ))}
  </div>
);

const PxInput = ({ label, value, onChange, max, help }) => (
  <div className="col-md-4">
    <label className="form-label fw-semibold small mb-1">{label}</label>
    <div className="input-group">
      <input type="number" min="0" max={max} className="form-control" value={value ?? ''} onChange={e => onChange(e.target.value)} />
      <span className="input-group-text">px</span>
    </div>
    {help && <div className="form-text">{help}</div>}
  </div>
);

/** Small picture of a 1920 px screen with the chosen content width and side space. */
const WidthSketch = ({ data }) => {
  const width = data.pageWidth === 'full' ? 1920 : Number(data.pageWidth === 'custom' ? data.customWidth : data.pageWidth) || 1920;
  const content = Math.min(1920, width);
  const gutter = Math.max(0, Number(data.gutter) || 0);
  const pct = (content / 1920) * 100;
  const gPct = Math.min(20, (gutter / content) * 100);
  return (
    <div className="border rounded-3 p-2" style={{ background: 'var(--bs-tertiary-bg)' }}>
      <div className="small text-muted mb-1">On a 1920 px screen</div>
      <div className="rounded-2 overflow-hidden" style={{ background: 'var(--bs-body-bg)', height: 70, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: `${pct}%`, height: '100%', padding: `8px ${gPct}%`, background: 'var(--bs-primary-bg-subtle)' }}>
          <div className="rounded-1 h-100" style={{ background: 'var(--bs-primary)', opacity: 0.55 }} />
        </div>
      </div>
      <div className="small text-muted mt-1">Content {content >= 1920 ? 'full width' : `${content} px`} · {gutter} px each side</div>
    </div>
  );
};

const WebsiteLayoutSettings = () => {
  const [data, setData] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canEdit = can('update', M.settings);

  useEffect(() => {
    SettingService.getGroupSettings('layout')
      .then(res => setData({ ...DEFAULTS, ...(res?.data || {}) }))
      .catch(() => toast.error('Could not load the layout settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setData(d => ({ ...d, [key]: value }));

  const save = async (e) => {
    e?.preventDefault();
    if (data.pageWidth === 'custom' && !(Number(data.customWidth) >= 600)) {
      toast.error('Custom width must be at least 600 px');
      return;
    }
    setSaving(true);
    try {
      const res = await SettingService.updateGroupSettings('layout', data);
      if (res?.success) {
        setData({ ...DEFAULTS, ...(res.data || {}) });
        toast.success('Website layout saved. The website shows it on the next page load.');
      }
    } catch {
      toast.error('Could not save the layout settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <EditorBar
        title="Website Layout"
        subtitle="Page width and side space for every page of the website"
        breadcrumb={[{ label: 'Settings', link: '/settings/organization' }, { label: 'Website Layout' }]}
      >
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!canEdit || saving} onClick={() => setData(DEFAULTS)}>
          <i className="bi bi-arrow-counterclockwise me-1"></i>Defaults
        </button>
        <button type="submit" form="layout-form" className="btn btn-primary btn-sm" disabled={!canEdit || saving || loading}>
          {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check2 me-1"></i>}Save
        </button>
      </EditorBar>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : (
        <form id="layout-form" onSubmit={save}>
          <fieldset disabled={!canEdit}>
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="fw-bold mb-1">Page width</h6>
                <p className="small text-muted">Header, footer, homepage, services, pages, blocks, tools, journey, blog and landing pages all use this width.</p>
                <Choice options={WIDTHS} value={data.pageWidth || 'full'} onChange={v => set('pageWidth', v)} />
                {data.pageWidth === 'custom' && (
                  <div className="row mt-3"><PxInput label="Custom width" value={data.customWidth} max={3000} onChange={v => set('customWidth', v)} help="600 – 3000 px" /></div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="fw-bold mb-1">Side space and section gap</h6>
                <p className="small text-muted">Space between the screen edge and the content (left and right), and between homepage sections.</p>
                <div className="row g-3 mb-3">
                  <PxInput label="Left / right (desktop & tablet)" value={data.gutter} max={160} onChange={v => set('gutter', v)} help="Default 10 px" />
                  <PxInput label="Left / right (phones)" value={data.gutterMobile} max={80} onChange={v => set('gutterMobile', v)} help="Under 768 px wide. Default 10 px" />
                  <PxInput label="Gap between sections" value={data.sectionGap} max={200} onChange={v => set('sectionGap', v)} help="Homepage cards. Default 28 px" />
                </div>
                <WidthSketch data={data} />
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="fw-bold mb-1">Hero text width</h6>
                <p className="small text-muted">How wide the hero heading and intro text may run (homepage and service heroes). A Home Hero block can also set its own.</p>
                <Choice options={HERO} value={data.heroTextWidth || 'normal'} onChange={v => set('heroTextWidth', v)} />
              </div>
            </div>

            <div className="alert alert-info small mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Each block can still change its own width, text width, padding and margin in the Page Builder: open the block → <b>Spacing &amp; border</b>.
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
};

export default WebsiteLayoutSettings;
