import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { confirmDelete } from '../../components/common/confirm';
import { siteUrl } from '../../config/siteUrl';
import { can, M } from '../../utils/permissions';

// Website newsletter sign-ups (backend /newsletter: GET list with counts, GET export CSV, PATCH status,
// DELETE). Addresses come from the Newsletter block's email box (when no CMS form is picked).

const TABS = [
  { key: '', label: 'All', count: 'all' },
  { key: 'subscribed', label: 'Subscribed', count: 'subscribed' },
  { key: 'unsubscribed', label: 'Unsubscribed', count: 'unsubscribed' },
];

const STATUS_BADGE = {
  subscribed: 'bg-success-subtle text-success-emphasis',
  unsubscribed: 'bg-secondary-subtle text-secondary-emphasis',
};

const formatDate = (value) => (value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

const NewsletterSubscribers = () => {
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get('status') || '');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ all: 0, subscribed: 0, unsubscribed: 0 });
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const canUpdate = can('update', M.newsletter);
  const canDelete = can('delete', M.newsletter);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (status) params.set('status', status);
      if (query) params.set('search', query);
      const res = await api.get(`/newsletter?${params}`);
      setRows(res.data?.data || []);
      setCounts(res.data?.counts || { all: 0, subscribed: 0, unsubscribed: 0 });
      setPagination(res.data?.pagination || { totalPages: 1, totalItems: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load subscribers.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setQuery(search.trim()); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (query) params.set('search', query);
      const res = await api.get(`/newsletter/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not export the subscribers.');
    } finally {
      setExporting(false);
    }
  };

  const copyEmails = async () => {
    const list = rows.filter((r) => r.status === 'subscribed').map((r) => r.email).join(', ');
    if (!list) return toast.info('No subscribed emails on this page.');
    try {
      await navigator.clipboard.writeText(list);
      toast.success('Emails on this page copied.');
    } catch {
      toast.error('Could not copy. Use Export CSV instead.');
    }
  };

  const setSubscriberStatus = async (row, next) => {
    setBusyId(row.id);
    try {
      await api.patch(`/newsletter/${row.id}`, { status: next });
      toast.success(next === 'subscribed' ? 'Marked as subscribed.' : 'Marked as unsubscribed.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update the subscriber.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!(await confirmDelete(row.email, { what: 'subscriber', extra: 'The address is removed from the list. If the person subscribes again, it comes back.' }))) return;
    setBusyId(row.id);
    try {
      await api.delete(`/newsletter/${row.id}`);
      toast.success('Subscriber deleted.');
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the subscriber.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="fw-bold mb-1">Newsletter Subscribers</h2>
          <p className="text-muted mb-0">Emails from the website's Newsletter box. One row per address.</p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Search email, name or page" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={copyEmails} title="Copy the subscribed emails shown on this page">
            <i className="bi bi-clipboard me-1"></i>Copy emails
          </button>
          <button type="button" className="btn btn-primary" onClick={exportCsv} disabled={exporting || !counts.all}>
            <i className="bi bi-download me-1"></i>{exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <ul className="nav nav-pills gap-2 mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.key || 'all'}>
            <button
              type="button"
              className={`nav-link d-flex align-items-center gap-2 ${status === tab.key ? 'active' : 'border'}`}
              onClick={() => { setStatus(tab.key); setPage(1); }}
            >
              {tab.label}
              <span className={`badge rounded-pill ${status === tab.key ? 'bg-white text-primary' : 'bg-body-tertiary text-body-secondary'}`}>{counts[tab.count] || 0}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-0 shadow-sm" style={{ background: 'var(--cms-card-bg, var(--bs-body-bg))' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Email</th>
                <th style={{ minWidth: 180 }}>Signed up on page</th>
                <th style={{ minWidth: 170 }}>Date</th>
                <th>Status</th>
                {(canUpdate || canDelete) && <th className="sticky-actions text-end" style={{ minWidth: 120 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    <i className="bi bi-envelope-paper fs-1 d-block mb-2"></i>
                    {query || status ? 'No subscribers match.' : 'No subscribers yet. They appear here when visitors use the Newsletter box on the website (a Newsletter block without a CMS form).'}
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} style={{ opacity: busyId === r.id ? 0.5 : 1 }}>
                  <td>
                    <a href={`mailto:${r.email}`} className="fw-semibold text-break">{r.email}</a>
                    {r.name && <div className="small text-muted">{r.name}</div>}
                  </td>
                  <td>
                    {r.source ? (
                      <a href={siteUrl(r.source)} target="_blank" rel="noreferrer" className="small text-break">
                        {r.source} <i className="bi bi-box-arrow-up-right"></i>
                      </a>
                    ) : <span className="small text-muted">—</span>}
                  </td>
                  <td>
                    <div className="small">{formatDate(r.subscribedAt || r.createdAt)}</div>
                    {r.status === 'unsubscribed' && r.unsubscribedAt && <div className="small text-muted">Unsubscribed {formatDate(r.unsubscribedAt)}</div>}
                  </td>
                  <td><span className={`badge rounded-pill text-capitalize ${STATUS_BADGE[r.status] || ''}`}>{r.status}</span></td>
                  {(canUpdate || canDelete) && (
                    <td className="sticky-actions text-end">
                      <div className="btn-group btn-group-sm">
                        {canUpdate && (r.status === 'subscribed' ? (
                          <button type="button" className="btn btn-outline-secondary" title="Mark as unsubscribed" disabled={busyId === r.id} onClick={() => setSubscriberStatus(r, 'unsubscribed')}>
                            <i className="bi bi-bell-slash"></i>
                          </button>
                        ) : (
                          <button type="button" className="btn btn-outline-success" title="Mark as subscribed" disabled={busyId === r.id} onClick={() => setSubscriberStatus(r, 'subscribed')}>
                            <i className="bi bi-bell"></i>
                          </button>
                        ))}
                        {canDelete && (
                          <button type="button" className="btn btn-outline-danger" title="Delete" disabled={busyId === r.id} onClick={() => remove(r)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">{pagination.totalItems} subscribers</small>
            <div className="btn-group btn-group-sm">
              <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><i className="bi bi-chevron-left"></i></button>
              <span className="btn btn-outline-secondary disabled">Page {page} of {pagination.totalPages}</span>
              <button type="button" className="btn btn-outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}><i className="bi bi-chevron-right"></i></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterSubscribers;
