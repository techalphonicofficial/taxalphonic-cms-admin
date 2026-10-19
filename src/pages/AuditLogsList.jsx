import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import Breadcrumb from '../components/common/Breadcrumb';
import LogPagination from '../components/logs/LogPagination';
import { AuditLogService } from '../services/auditLog.service';
import { toast } from 'react-toastify';
import { ACTION_STYLES, actionStyle, userName, ChangeTable } from '../components/logs/auditFormat';

const EMPTY_FILTERS = { search: '', module: 'ALL', action: 'ALL', userId: 'ALL', from: '', to: '' };
const PAGE_SIZE = 25;

const AuditLogsList = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ modules: [], actions: [], users: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [selected, setSelected] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value && value !== 'ALL') params[key] = value;
      });
      const res = await AuditLogService.getAll(params);
      setLogs(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  useEffect(() => {
    AuditLogService.getFilters()
      .then(res => setFilterOptions(res.data || { modules: [], actions: [], users: [] }))
      .catch(() => { /* dropdowns stay empty */ });
  }, []);

  const openDetails = async (log) => {
    setSelected(log);
    setIsDetailLoading(true);
    try {
      const res = await AuditLogService.getById(log.id);
      setSelected(res.data);
    } catch {
      toast.error('Failed to load change details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Breadcrumb items={[{ label: 'Logs' }, { label: 'Audit Logs' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Audit Logs</h2>
          <p className="text-muted small mb-0">Every change made to the website: who changed what, and when.</p>
        </div>
        <button type="button" className="btn btn-light border" onClick={() => fetchLogs(pagination.currentPage)} disabled={isLoading}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form
            className="row g-2 align-items-end"
            onSubmit={(e) => { e.preventDefault(); setAppliedFilters(filters); }}
          >
            <div className="col-md-3">
              <label className="form-label small text-muted mb-1">Search description</label>
              <input type="text" className="form-control form-control-sm" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder='e.g. "GST Registration"' />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Module</label>
              <select className="form-select form-select-sm" value={filters.module} onChange={e => setFilters(f => ({ ...f, module: e.target.value }))}>
                <option value="ALL">All modules</option>
                {filterOptions.modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Action</label>
              <select className="form-select form-select-sm" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
                <option value="ALL">All actions</option>
                {(filterOptions.actions.length ? filterOptions.actions : Object.keys(ACTION_STYLES)).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">User</label>
              <select className="form-select form-select-sm" value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}>
                <option value="ALL">All users</option>
                <option value="SYSTEM">System / Anonymous</option>
                {filterOptions.users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label small text-muted mb-1">From</label>
              <input type="date" className="form-control form-control-sm" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
            </div>
            <div className="col-md-1">
              <label className="form-label small text-muted mb-1">To</label>
              <input type="date" className="form-control form-control-sm" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
            </div>
            <div className="col-md-1 d-flex gap-1">
              <button type="submit" className="btn btn-sm btn-primary flex-grow-1" title="Apply filters"><i className="bi bi-funnel"></i></button>
              <button type="button" className="btn btn-sm btn-light border" title="Reset" onClick={() => { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); }}><i className="bi bi-x-lg"></i></button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 170 }}>When</th>
                <th style={{ width: 190 }}>Who</th>
                <th style={{ width: 110 }}>Action</th>
                <th style={{ width: 150 }}>Module</th>
                <th>What changed</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 && (
                <tr><td colSpan="6" className="text-center py-5 text-muted"><span className="spinner-border spinner-border-sm me-2"></span>Loading...</td></tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr><td colSpan="6" className="text-center py-5 text-muted"><i className="bi bi-journal-x fs-3 d-block mb-2"></i>No audit entries found.</td></tr>
              )}
              {logs.map(log => {
                const style = actionStyle(log.action);
                return (
                  <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => openDetails(log)}>
                    <td className="small text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="small">
                      {userName(log)
                        ? <><div className="fw-semibold">{userName(log)}</div><div className="text-muted">{log.user.email}</div></>
                        : <span className="text-muted fst-italic">System / Anonymous</span>}
                    </td>
                    <td><span className={`badge bg-${style.bg}`}><i className={`bi ${style.icon} me-1`}></i>{log.action}</span></td>
                    <td className="small">{log.module}</td>
                    <td className="small">{log.description}</td>
                    <td className="text-end"><i className="bi bi-chevron-right text-muted"></i></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-transparent">
          <LogPagination pagination={pagination} onPageChange={fetchLogs} label="entries" />
        </div>
      </div>

      {/* Details */}
      <Modal show={Boolean(selected)} onHide={() => setSelected(null)} size="lg" centered className="custom-high-z-modal" backdropClassName="custom-high-z-backdrop">
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">Change Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <div className="row g-2 small mb-3">
                <div className="col-md-6"><strong>When:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
                <div className="col-md-6"><strong>Who:</strong> {userName(selected) ? `${userName(selected)} (${selected.user.email})` : 'System / Anonymous'}</div>
                <div className="col-md-6"><strong>Action:</strong> {selected.action} · {selected.module}</div>
                <div className="col-md-6"><strong>Record ID:</strong> <code>{selected.recordId || '—'}</code></div>
                <div className="col-md-6"><strong>IP:</strong> <code>{selected.ipAddress || '—'}</code></div>
                <div className="col-md-6 text-truncate" title={selected.userAgent}><strong>Browser:</strong> {selected.userAgent || '—'}</div>
              </div>
              <div className="p-2 rounded bg-light border small mb-3">{selected.description}</div>

              {isDetailLoading && <div className="text-center text-muted py-3"><span className="spinner-border spinner-border-sm me-2"></span>Loading changes...</div>}

              {!isDetailLoading && <ChangeTable log={selected} />}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AuditLogsList;
