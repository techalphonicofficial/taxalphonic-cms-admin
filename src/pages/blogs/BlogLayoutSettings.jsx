import React from 'react';
import { BLOG_SETTINGS_DEFAULT } from '../../components/page-builder/blogBlocks';

/*
 * "Blog layout" card above the blog Page Builder: how the post page is laid out on the website
 * (website blog/blogLayout.js). Saved with the post's sections as the BlogSettings entry.
 */

const SIDEBAR = [
  { value: 'right', label: 'Right', icon: 'bi-layout-sidebar-reverse' },
  { value: 'left', label: 'Left', icon: 'bi-layout-sidebar' },
  { value: 'none', label: 'No sidebar', icon: 'bi-square' },
];

const Segmented = ({ options, value, onChange }) => (
  <div className="btn-group btn-group-sm flex-wrap" role="group">
    {options.map(o => (
      <button key={o.value} type="button" className={`btn ${value === o.value ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => onChange(o.value)}>
        {o.icon && <i className={`bi ${o.icon} me-1`}></i>}{o.label}
      </button>
    ))}
  </div>
);

const Select = ({ label, value, onChange, options, help }) => (
  <div className="col-md-6 col-xl-4">
    <label className="form-label small fw-semibold mb-1">{label}</label>
    <select className="form-select form-select-sm" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {help && <div className="form-text">{help}</div>}
  </div>
);

const BlogLayoutSettings = ({ value, onChange }) => {
  const s = { ...BLOG_SETTINGS_DEFAULT, ...(value || {}) };
  const set = (key, v) => onChange({ ...s, [key]: v });
  const sideOn = s.sidebar !== 'none';

  return (
    <div className="premium-form-card border-0 p-3 mb-3">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <h6 className="fw-bold mb-0"><i className="bi bi-layout-text-sidebar me-2 text-primary"></i>Blog layout</h6>
        <span className="small text-muted">How this post is laid out on the website. Drag blocks between <b>Main content</b> and the <b>Sidebar</b> below.</span>
      </div>
      <div className="row g-3 align-items-end">
        <div className="col-md-6 col-xl-4">
          <label className="form-label small fw-semibold mb-1 d-block">Sidebar</label>
          <Segmented options={SIDEBAR} value={s.sidebar} onChange={v => set('sidebar', v)} />
        </div>
        {sideOn && (
          <div className="col-md-6 col-xl-4">
            <label className="form-label small fw-semibold mb-1 d-flex justify-content-between">
              <span>Sidebar width</span><span className="text-muted">{s.sidebarWidth}px</span>
            </label>
            <input type="range" className="form-range" min="220" max="460" step="10" value={s.sidebarWidth} onChange={e => set('sidebarWidth', Number(e.target.value))} />
          </div>
        )}
        {sideOn && (
          <Select label="Sticky while scrolling" value={s.sticky} onChange={v => set('sticky', v)} options={[
            { value: 'toc', label: 'From "On this page" down (default)' },
            { value: 'all', label: 'Whole sidebar' },
            { value: 'none', label: 'Nothing (scrolls with the page)' },
          ]} />
        )}
        <Select label="Featured image" value={s.cover} onChange={v => set('cover', v)} options={[
          { value: 'beside', label: 'Beside the title (default)' },
          { value: 'below', label: 'Full width under the title' },
          { value: 'none', label: 'Hidden on the post' },
        ]} help="The image still shows on blog cards and when shared." />
        <Select label="Article text width" value={s.textWidth} onChange={v => set('textWidth', v)} options={[
          { value: 'full', label: 'Full column (default)' },
          { value: 'comfortable', label: 'Comfortable reading (≈ 900px)' },
          { value: 'narrow', label: 'Narrow (≈ 760px)' },
        ]} />
        <Select label="On this page, on phones / tablets" value={s.tocMobile} onChange={v => set('tocMobile', v)} options={[
          { value: 'yes', label: 'Fold-out box above the article (default)' },
          { value: 'no', label: 'Where the block is placed' },
        ]} />
        <Select label="Author, likes & comments width" value={s.foot} onChange={v => set('foot', v)} options={[
          { value: 'full', label: 'Full width (default)' },
          { value: 'center', label: 'Centred (≈ 900px)' },
          { value: 'article', label: 'Under the article column' },
        ]} />
        <Select label="Reading progress bar" value={s.progress} onChange={v => set('progress', v)} options={[
          { value: 'yes', label: 'Show (thin bar at the top)' },
          { value: 'no', label: 'Hide' },
        ]} />
      </div>
    </div>
  );
};

export default BlogLayoutSettings;
