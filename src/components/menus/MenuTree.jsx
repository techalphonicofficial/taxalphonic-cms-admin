import React, { useState } from 'react';
import { toast } from 'react-toastify';
import MediaPickerModal from '../media/MediaPickerModal';
import { confirmDialog } from '../common/confirm';

/**
 * Editable menu tree (up to MAX_DEPTH levels): add a child link, edit, move up/down, remove.
 * Items are { id, title, url, target, children }. `labels` names each level, e.g. for the
 * footer: Main heading → Column heading → Link.
 */

export const MAX_DEPTH = 3;

const blank = { title: '', url: '', target: '_self', icon: '' };

const slug = (title) => (title ? `/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}` : '');

// Immutable helpers addressed by a path of indexes, e.g. [2, 0] = first child of the third item.
const updateAt = (items, path, fn) => {
  const [head, ...rest] = path;
  return items.map((item, i) => {
    if (i !== head) return item;
    return rest.length ? { ...item, children: updateAt(item.children || [], rest, fn) } : fn(item);
  });
};

const changeList = (items, parentPath, fn) => (
  parentPath.length ? updateAt(items, parentPath, item => ({ ...item, children: fn(item.children || []) })) : fn(items)
);

const MEDIA_BASE = (import.meta.env.VITE_APP_URL || 'http://localhost:5000').replace(/\/$/, '');
const isImageIcon = (value) => /^(https?:|\/|data:|uploads\/)/i.test(value) || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(value);
const iconSrc = (value) => (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') ? value : `${MEDIA_BASE}/${value.replace(/^\/+/, '')}`);

// Same default the website header shows when an item has no icon (Header.jsx DEFAULT_MENU_ICON).
export const DEFAULT_MENU_ICON = '📄';

/** Small preview of an item's icon (emoji or image); empty shows the default, faded. */
export const MenuIconPreview = ({ value }) => {
  const icon = String(value || '').trim();
  return (
    <span className="d-inline-flex align-items-center justify-content-center rounded-2 border bg-body-tertiary flex-shrink-0"
      style={{ width: 28, height: 28, fontSize: 14, opacity: icon ? 1 : 0.45 }} title={icon ? 'Icon' : 'Default icon'}>
      {icon && isImageIcon(icon)
        ? <img src={iconSrc(icon)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
        : (icon || DEFAULT_MENU_ICON)}
    </span>
  );
};

// Icon of a menu item: type/paste an emoji, or pick a square image from Media.
const IconInput = ({ value, onChange }) => {
  const [picking, setPicking] = useState(false);
  return (
    <div className="d-flex align-items-center gap-2">
      <MenuIconPreview value={value} />
      <div className="input-group input-group-sm">
        <input type="text" className="form-control" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Icon: emoji (🏢) or image" />
        <button type="button" className="btn btn-outline-secondary" onClick={() => setPicking(true)} title="Choose an image from Media"><i className="bi bi-image"></i></button>
        {value && <button type="button" className="btn btn-outline-danger" onClick={() => onChange('')} title="Remove icon (use the default)"><i className="bi bi-x-lg"></i></button>}
      </div>
      <MediaPickerModal show={picking} onClose={() => setPicking(false)} onSelect={(item) => { onChange(item.url); setPicking(false); }} title="Select icon image" />
    </div>
  );
};

const LinkInputs = ({ value, onChange, onTitle, onSave, onCancel, saveLabel = 'Save' }) => (
  <div className="row g-2 align-items-end">
    <div className="col-md-4">
      <input type="text" className="form-control form-control-sm" value={value.title} onChange={e => (onTitle ? onTitle(e.target.value) : onChange({ ...value, title: e.target.value }))} placeholder="Title" />
    </div>
    <div className="col-md-4">
      <input type="text" className="form-control form-control-sm" value={value.url} onChange={e => onChange({ ...value, url: e.target.value })} placeholder="URL (# for a heading)" />
    </div>
    <div className="col-md-2">
      <select className="form-select form-select-sm" value={value.target} onChange={e => onChange({ ...value, target: e.target.value })}>
        <option value="_self">Same Tab</option>
        <option value="_blank">New Tab</option>
      </select>
    </div>
    <div className="col-md-2 d-grid gap-1 d-md-flex">
      <button type="button" className="btn btn-primary btn-sm flex-fill" onClick={onSave}>{saveLabel}</button>
      {onCancel && <button type="button" className="btn btn-light btn-sm flex-fill border" onClick={onCancel}>Cancel</button>}
    </div>
    <div className="col-md-8">
      <IconInput value={value.icon} onChange={icon => onChange({ ...value, icon })} />
    </div>
    <div className="col-md-4 small text-muted">
      Shown beside the link in header dropdowns. Image: square, 96 × 96 px, transparent PNG/SVG. Empty = default icon.
    </div>
  </div>
);

const MenuTree = ({ items, onChange, labels = ['Link', 'Sub-link', 'Sub-sub-link'], maxDepth = MAX_DEPTH }) => {
  const [editing, setEditing] = useState(null); // path key
  const [editData, setEditData] = useState(blank);
  const [adding, setAdding] = useState(null); // path key of the parent
  const [newChild, setNewChild] = useState(blank);
  // Links under a column (level 3) are folded until opened, so long footers stay readable.
  const [open, setOpen] = useState(() => new Set());
  const toggleOpen = (id) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const key = (path) => path.join('.');

  const startEdit = (path, item) => {
    setEditing(key(path));
    setEditData({ title: item.title || '', url: item.url || '', target: item.target || '_self', icon: item.icon || '' });
  };

  const saveEdit = (path) => {
    if (!editData.title.trim() || !editData.url.trim()) return toast.warn('Please provide a title and URL (use # for a heading).');
    onChange(updateAt(items, path, item => ({ ...item, ...editData })));
    setEditing(null);
    return null;
  };

  const startAdd = (path) => {
    setAdding(adding === key(path) ? null : key(path));
    setNewChild(blank);
  };

  // A new child's URL follows its title, under the parent's URL when that is a real path.
  const childTitle = (parent) => (title) => {
    let url = slug(title);
    if (parent.url && parent.url !== '#' && parent.url !== '/') url = parent.url.replace(/\/$/, '') + url;
    setNewChild({ ...newChild, title, url });
  };

  const saveAdd = (path) => {
    if (!newChild.title.trim() || !newChild.url.trim()) return toast.warn('Please provide a title and URL (use # for a heading).');
    onChange(updateAt(items, path, item => ({ ...item, children: [...(item.children || []), { ...newChild, id: `new_${Date.now()}`, children: [] }] })));
    setAdding(null);
    return null;
  };

  const move = (path, delta) => {
    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    onChange(changeList(items, parentPath, list => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }));
  };

  const remove = async (path, item) => {
    if (!(await confirmDialog({ title: `Remove "${item.title}"?`, message: item.children?.length ? 'Everything under it is removed too.' : 'The link is removed from this menu.', note: 'Nothing changes on the website until you save the menu.', confirmText: 'Remove' }))) return;
    onChange(changeList(items, path.slice(0, -1), list => list.filter((_, i) => i !== path[path.length - 1])));
  };

  const renderLevel = (list, parentPath) => list.map((item, index) => {
    const path = [...parentPath, index];
    const depth = path.length; // 1 = top level
    const canNest = depth < maxDepth;
    const indent = { marginLeft: `${(depth - 1) * 28}px` };
    const foldable = depth >= 2 && item.children?.length > 0;
    const foldKey = item.id || key(path);
    const expanded = !foldable || open.has(foldKey) || adding === key(path);
    const tone = depth === 1 ? 'bg-white shadow-sm' : depth === 2 ? 'bg-white' : 'bg-body-tertiary';

    return (
      <React.Fragment key={item.id || key(path)}>
        {editing === key(path) ? (
          <div className="border rounded bg-light p-3 mt-2" style={indent}>
            <h6 className="fw-semibold small mb-2 text-primary">Edit {labels[depth - 1]}</h6>
            <LinkInputs value={editData} onChange={setEditData} onSave={() => saveEdit(path)} onCancel={() => setEditing(null)} />
          </div>
        ) : (
          <div className={`border rounded d-flex justify-content-between align-items-center gap-2 mt-2 ${depth === 1 ? 'py-3' : 'py-2'} px-3 ${tone}`} style={indent}>
            <div style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {depth > 1 && <i className="bi bi-arrow-return-right text-muted"></i>}
                {depth > 1 && <MenuIconPreview value={item.icon} />}
                {foldable && (
                  <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => toggleOpen(foldKey)} title={expanded ? 'Hide links' : 'Show links'}>
                    <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                  </button>
                )}
                <span className={depth === 1 ? 'fw-bold' : 'fw-medium text-dark'}>{item.title}</span>
                <span className="badge rounded-pill bg-light text-secondary border fw-normal">{labels[depth - 1]}</span>
                {foldable && !expanded && <span className="small text-muted">{item.children.length} {item.children.length === 1 ? 'link' : 'links'}</span>}
              </div>
              <div className="small text-muted text-truncate">{item.url} <span className="badge bg-light text-dark border ms-1">{item.target}</span></div>
            </div>
            <div className="btn-group flex-shrink-0">
              {canNest && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startAdd(path)} title={`Add ${labels[depth]}`}>
                  <i className="bi bi-node-plus"></i> {labels[depth]}
                </button>
              )}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => startEdit(path, item)} title="Edit"><i className="bi bi-pencil"></i></button>
              <button type="button" className="btn btn-sm btn-light border" onClick={() => move(path, -1)} disabled={index === 0} title="Move up"><i className="bi bi-arrow-up"></i></button>
              <button type="button" className="btn btn-sm btn-light border" onClick={() => move(path, 1)} disabled={index === list.length - 1} title="Move down"><i className="bi bi-arrow-down"></i></button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(path, item)} title="Delete"><i className="bi bi-trash"></i></button>
            </div>
          </div>
        )}

        {adding === key(path) && (
          <div className="border rounded bg-light p-3 mt-2" style={{ marginLeft: `${depth * 28}px` }}>
            <h6 className="fw-semibold small mb-2 text-primary">Add {labels[depth]} to "{item.title}"</h6>
            <LinkInputs value={newChild} onChange={setNewChild} onTitle={childTitle(item)} onSave={() => saveAdd(path)} onCancel={() => setAdding(null)} saveLabel="Add" />
          </div>
        )}

        {item.children?.length > 0 && expanded && renderLevel(item.children, path)}
      </React.Fragment>
    );
  });

  if (!items.length) {
    return <div className="text-center p-4 text-muted border rounded-3 border-dashed bg-light">No links added to this menu yet.</div>;
  }
  return <div>{renderLevel(items, [])}</div>;
};

export default MenuTree;
