import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { siteUrl } from '../config/siteUrl';
import { confirmDialog } from '../components/common/confirm';

/**
 * Trash: everything deleted from Services, Pages, SEO Pages / Configs, Blogs, Service Categories,
 * Forms, Menus, Media files and Media folders (a folder is restored or deleted together with its
 * subfolders and files). Restore puts a record back exactly as it was (a service with its Page Builder
 * blocks, SEO and URL); "Delete forever" removes it for good. Backend: controllers/TrashController.js
 * (it only lists the modules the user has permission for).
 */

// Records of these modules have a page on the website.
const WEBSITE_MODULES = ['services', 'pages', 'seo-pages', 'blogs', 'seo-configs'];

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  const when = days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · ${when}`;
};

const Trash = () => {
  const [params] = useSearchParams();
  const [modules, setModules] = useState([]);
  // ?module=services opens that tab (the Trash links on the Services / Pages lists).
  const [active, setActive] = useState(params.get('module') || '');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadSummary = useCallback(async (keepActive) => {
    try {
      const res = await api.get('/trash/summary');
      const list = res.data?.data || [];
      setModules(list);
      if (!keepActive) setActive((current) => current || (list.find((m) => m.count > 0) || list[0])?.key || '');
    } catch {
      toast.error('Failed to load the Trash.');
    }
  }, []);

  const loadRows = useCallback(async () => {
    if (!active) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/trash/${active}`, { params: { page, limit: 50, search: query || undefined } });
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load deleted items.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [active, page, query]);

  useEffect(() => { loadSummary(false); }, [loadSummary]);
  useEffect(() => { loadRows(); setSelected(new Set()); }, [loadRows]);

  // Search waits until typing stops.
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const switchModule = (key) => {
    setActive(key);
    setPage(1);
    setSearch('');
    setQuery('');
  };

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const run = async (kind, ids) => {
    if (!ids.length) return;
    const label = modules.find((m) => m.key === active)?.label || 'items';
    if (kind === 'purge' && !(await confirmDialog({ title: `Delete ${ids.length} item(s) forever?`, message: `They are removed from ${label} for good.`, note: 'This cannot be undone.', confirmText: 'Delete forever' }))) return;
    setBusy(true);
    try {
      const res = kind === 'restore'
        ? await api.post(`/trash/${active}/restore`, { ids })
        : await api.delete(`/trash/${active}`, { data: { ids } });
      toast.success(res.data?.message || 'Done');
      setSelected(new Set());
      await Promise.all([loadRows(), loadSummary(true)]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const activeModule = modules.find((m) => m.key === active);
  const showsOnWebsite = WEBSITE_MODULES.includes(active);
  const total = modules.reduce((sum, m) => sum + m.count, 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <Breadcrumb items={[{ label: 'Trash' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>
            <i className="bi bi-trash3 me-2 text-danger"></i>Trash
            {total > 0 && <span className="badge bg-danger-subtle text-danger-emphasis border ms-2 fs-6 align-middle">{total}</span>}
          </h2>
          <p className="text-muted small mb-0">
            Deleted items wait here. <b>Restore</b> brings one back exactly as it was (content, blocks, SEO, URL); <b>Delete forever</b> removes it for good.
          </p>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {modules.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => switchModule(m.key)}
            className={`btn btn-sm rounded-pill px-3 ${active === m.key ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {m.label}
            <span className={`badge rounded-pill ms-2 ${active === m.key ? 'bg-white text-primary' : m.count ? 'bg-danger' : 'bg-light text-muted border'}`}>{m.count}</span>
          </button>
        ))}
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-3 border-bottom d-flex flex-wrap gap-2 align-items-center">
          <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input type="search" className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search deleted ${activeModule?.label?.toLowerCase() || 'items'}…`} />
          </div>
          {selected.size > 0 && (
            <div className="d-flex gap-2 ms-auto align-items-center">
              <span className="small text-muted">{selected.size} selected</span>
              <button type="button" className="btn btn-sm btn-success" disabled={busy} onClick={() => run('restore', [...selected])}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Restore
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => run('purge', [...selected])}>
                <i className="bi bi-x-octagon me-1"></i>Delete forever
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
        ) : rows.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-check2-circle fs-1 d-block mb-2 text-success"></i>
            {query ? 'Nothing matches your search.' : `No deleted ${activeModule?.label?.toLowerCase() || 'items'}.`}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" className="form-check-input" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Deleted</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={selected.has(row.id) ? 'table-active' : ''}>
                    <td><input type="checkbox" className="form-check-input" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.name}`} /></td>
                    <td style={{ maxWidth: 380 }}>
                      <div className="fw-semibold text-truncate">{row.name}</div>
                      {row.url && <div className="small text-muted font-monospace text-truncate">{showsOnWebsite ? siteUrl(row.url) : row.url}</div>}
                      {row.detail && <div className="small text-muted"><i className="bi bi-folder2-open me-1"></i>{row.detail}</div>}
                    </td>
                    <td>{row.status ? <span className="badge bg-light text-dark border text-capitalize">{String(row.status).toLowerCase()}</span> : <span className="text-muted">—</span>}</td>
                    <td className="small">
                      <div>{formatDate(row.deletedAt)}</div>
                      {row.deletedBy && <div className="text-muted">by {row.deletedBy}</div>}
                    </td>
                    <td className="text-end text-nowrap">
                      <button type="button" className="btn btn-sm btn-outline-success me-2" disabled={busy} onClick={() => run('restore', [row.id])} title="Restore">
                        <i className="bi bi-arrow-counterclockwise me-1"></i>Restore
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => run('purge', [row.id])} title="Delete forever">
                        <i className="bi bi-x-octagon"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center small">
            <span className="text-muted">{pagination.totalItems} deleted · page {pagination.currentPage} of {pagination.totalPages}</span>
            <div className="btn-group btn-group-sm">
              <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <button type="button" className="btn btn-outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        )}
      </div>

      {showsOnWebsite && (
        <p className="small text-muted mt-3 mb-0">
          <i className="bi bi-info-circle me-1"></i>
          A restored page is live on the website again at the same URL (if it is published); the sitemap picks it up within an hour.
        </p>
      )}
    </div>
  );
};

export default Trash;
