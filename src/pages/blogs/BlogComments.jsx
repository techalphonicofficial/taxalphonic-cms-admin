import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { confirmDelete } from '../../components/common/confirm';
import { siteUrl } from '../../config/siteUrl';

// Website blog comments (GET/PATCH/DELETE /blog-comments). Visitors' comments go live at once,
// except ones with links, which wait here as "Pending". Hidden = taken off the website, kept here.

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'hidden', label: 'Hidden' },
];

const STATUS_BADGE = {
  approved: 'bg-success-subtle text-success',
  pending: 'bg-warning-subtle text-warning-emphasis',
  hidden: 'bg-secondary-subtle text-secondary',
};

const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const BlogComments = () => {
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get('status') || '');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ approved: 0, pending: 0, hidden: 0 });
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (query) params.set('search', query);
      const res = await api.get(`/blog-comments?${params}`);
      setRows(res.data?.data || []);
      setCounts(res.data?.counts || { approved: 0, pending: 0, hidden: 0 });
      setPagination(res.data?.pagination || { totalPages: 1, totalItems: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const setCommentStatus = async (comment, next) => {
    setBusyId(comment.id);
    try {
      await api.patch(`/blog-comments/${comment.id}`, { status: next });
      toast.success(next === 'approved' ? 'Comment approved: it is live on the website.' : next === 'hidden' ? 'Comment hidden from the website.' : 'Comment moved to pending.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update the comment.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (comment) => {
    if (!(await confirmDelete(`comment by ${comment.name}`, { what: 'comment', extra: 'It is removed from the website at once. Use Hide to keep a copy here.' }))) return;
    setBusyId(comment.id);
    try {
      await api.delete(`/blog-comments/${comment.id}`);
      toast.success('Comment deleted.');
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the comment.');
    } finally {
      setBusyId(null);
    }
  };

  const total = counts.approved + counts.pending + counts.hidden;
  const tabCount = (key) => (key ? counts[key] : total);

  return (
    <div className="pb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="fw-bold mb-1">Blog Comments</h2>
          <p className="text-muted mb-0">Comments from website visitors. Comments with links wait for your approval.</p>
        </div>
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
          <input className="form-control" placeholder="Search name, email or text" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <ul className="nav nav-pills gap-2 mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.key || 'all'}>
            <button
              type="button"
              className={`nav-link d-flex align-items-center gap-2 ${status === tab.key ? 'active' : 'bg-white border'}`}
              onClick={() => { setStatus(tab.key); setPage(1); }}
            >
              {tab.label}
              <span className={`badge rounded-pill ${status === tab.key ? 'bg-white text-primary' : tab.key === 'pending' && counts.pending ? 'bg-warning text-dark' : 'bg-light text-muted'}`}>{tabCount(tab.key)}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 180 }}>Visitor</th>
                <th style={{ minWidth: 320 }}>Comment</th>
                <th style={{ minWidth: 180 }}>Post</th>
                <th>Status</th>
                <th className="sticky-actions text-end" style={{ minWidth: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    <i className="bi bi-chat-square-text fs-1 d-block mb-2"></i>
                    {query || status ? 'No comments match.' : 'No comments yet. They appear here when visitors comment on a blog post.'}
                  </td>
                </tr>
              ) : rows.map((c) => (
                <tr key={c.id} style={{ opacity: busyId === c.id ? 0.5 : 1 }}>
                  <td>
                    <div className="fw-semibold">{c.name}</div>
                    {c.email ? <a href={`mailto:${c.email}`} className="small text-muted">{c.email}</a> : <span className="small text-muted">No email</span>}
                    <div className="small text-muted">{formatDate(c.createdAt)}</div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 120, overflow: 'auto', fontSize: '0.9rem' }}>{c.body}</div>
                  </td>
                  <td>
                    {c.blog ? (
                      <a href={siteUrl(`/blog/${c.blog.slug}#comments`)} target="_blank" rel="noreferrer" className="small fw-semibold">
                        {c.blog.title} <i className="bi bi-box-arrow-up-right"></i>
                      </a>
                    ) : <span className="text-muted small">Deleted post</span>}
                  </td>
                  <td><span className={`badge rounded-pill text-capitalize ${STATUS_BADGE[c.status] || ''}`}>{c.status}</span></td>
                  <td className="sticky-actions text-end">
                    <div className="btn-group btn-group-sm">
                      {c.status !== 'approved' && (
                        <button type="button" className="btn btn-outline-success" title="Approve (show on website)" disabled={busyId === c.id} onClick={() => setCommentStatus(c, 'approved')}>
                          <i className="bi bi-check-lg"></i>
                        </button>
                      )}
                      {c.status !== 'hidden' && (
                        <button type="button" className="btn btn-outline-secondary" title="Hide from website" disabled={busyId === c.id} onClick={() => setCommentStatus(c, 'hidden')}>
                          <i className="bi bi-eye-slash"></i>
                        </button>
                      )}
                      <button type="button" className="btn btn-outline-danger" title="Delete" disabled={busyId === c.id} onClick={() => remove(c)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <small className="text-muted">{pagination.totalItems} comments</small>
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

export default BlogComments;
