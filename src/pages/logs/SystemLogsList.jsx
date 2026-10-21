import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import HasPermission from '../../components/common/HasPermission';
import LogPagination from '../../components/logs/LogPagination';
import { SystemLogService } from '../../services/systemLog.service';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../components/common/confirm';

const LOG_TYPES = {
  general: {
    title: 'General Logs',
    file: 'logs/generallogs.txt',
    description: 'Every API request: method, URL, status, response time, IP and user.',
  },
  error: {
    title: 'Error Logs',
    file: 'logs/errorlogs.txt',
    description: 'Failed requests (4xx / 5xx), server errors with stack traces and crashes.',
  },
};

const LEVEL_STYLES = {
  INFO: 'bg-info-subtle text-info-emphasis border-info-subtle',
  WARN: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
  ERROR: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
};

const statusClass = (status) => {
  if (!status) return 'text-muted';
  if (status >= 500) return 'text-danger fw-bold';
  if (status >= 400) return 'text-warning-emphasis fw-bold';
  return 'text-success';
};

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EMPTY_FILTERS = { search: '', level: 'ALL', method: 'ALL', status: 'ALL', from: '', to: '' };
const PAGE_SIZE = 50;

const SystemLogsList = () => {
  const { type = 'general' } = useParams();
  const meta = LOG_TYPES[type];

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ total: 0, INFO: 0, WARN: 0, ERROR: 0, fileSizeBytes: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [expanded, setExpanded] = useState(null);

  // Reset filters when switching between general and error logs
  useEffect(() => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setExpanded(null);
  }, [type]);

  const fetchEntries = useCallback(async (page = 1) => {
    if (!meta) return;
    setIsLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value && value !== 'ALL') params[key] = value;
      });
      const res = await SystemLogService.getEntries(type, params);
      setEntries(res.data || []);
      setSummary(res.summary || {});
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load logs.');
    } finally {
      setIsLoading(false);
    }
  }, [type, meta, appliedFilters]);

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  const handleDownload = async () => {
    try {
      await SystemLogService.download(type);
    } catch {
      toast.error('Log file is empty or could not be downloaded.');
    }
  };

  const handleClear = async () => {
    if (!(await confirmDialog({ title: `Clear ${meta.file}?`, message: 'This permanently deletes all entries in the file. The action is recorded in the Audit Log.', note: 'This cannot be undone.', confirmText: 'Clear log' }))) return;
    try {
      await SystemLogService.clear(type);
      toast.success('Log file cleared.');
      fetchEntries(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear log file.');
    }
  };

  if (!meta) {
    return <div className="alert alert-warning">Unknown log type. Open <Link to="/system-logs/general">General Logs</Link> or <Link to="/system-logs/error">Error Logs</Link>.</div>;
  }

  const summaryCards = [
    { label: 'Total entries', value: summary.total, icon: 'bi-list-ul', color: 'primary' },
    { label: 'Info', value: summary.INFO, icon: 'bi-info-circle', color: 'info' },
    { label: 'Warnings (4xx)', value: summary.WARN, icon: 'bi-exclamation-triangle', color: 'warning' },
    { label: 'Errors (5xx)', value: summary.ERROR, icon: 'bi-x-octagon', color: 'danger' },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
        <div>
          <Breadcrumb items={[{ label: 'Logs', link: '/audit-logs' }, { label: meta.title }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>{meta.title}</h2>
          <p className="text-muted small mb-0">{meta.description} <code className="ms-1">{meta.file}</code> · {formatBytes(summary.fileSizeBytes)}</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light border" onClick={() => fetchEntries(pagination.currentPage)} disabled={isLoading}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button type="button" className="btn btn-light border" onClick={handleDownload}>
            <i className="bi bi-download me-1"></i> Download .txt
          </button>
          <HasPermission action="delete" module="SystemLogs">
            <button type="button" className="btn btn-outline-danger" onClick={handleClear}>
              <i className="bi bi-eraser me-1"></i> Clear
            </button>
          </HasPermission>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-3">
        {summaryCards.map(card => (
          <div className="col-6 col-lg-3" key={card.label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center justify-content-between py-3">
                <div>
                  <div className="text-muted small text-uppercase fw-semibold">{card.label}</div>
                  <div className={`fs-4 fw-bold text-${card.color}`}>{card.value || 0}</div>
                </div>
                <i className={`bi ${card.icon} fs-3 text-${card.color} opacity-50`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="row g-2 align-items-end" onSubmit={(e) => { e.preventDefault(); setAppliedFilters(filters); }}>
            <div className="col-md-3">
              <label className="form-label small text-muted mb-1">Search</label>
              <input type="text" className="form-control form-control-sm" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="URL, message, user, IP, request ID" />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Level</label>
              <select className="form-select form-select-sm" value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}>
                <option value="ALL">All levels</option>
                {type === 'general' && <option value="INFO">INFO</option>}
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label small text-muted mb-1">Method</label>
              <select className="form-select form-select-sm" value={filters.method} onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}>
                <option value="ALL">All</option>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Status</label>
              <select className="form-select form-select-sm" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="ALL">All</option>
                {type === 'general' && <option value="2xx">2xx Success</option>}
                <option value="4xx">4xx Client errors</option>
                <option value="5xx">5xx Server errors</option>
                <option value="401">401</option>
                <option value="403">403</option>
                <option value="404">404</option>
                <option value="422">422</option>
                <option value="500">500</option>
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
            <div className="col-md-2 d-flex gap-1">
              <button type="submit" className="btn btn-sm btn-primary flex-grow-1"><i className="bi bi-funnel me-1"></i>Apply</button>
              <button type="button" className="btn btn-sm btn-light border" title="Reset" onClick={() => { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); }}><i className="bi bi-x-lg"></i></button>
            </div>
          </form>
        </div>
      </div>

      {/* Entries */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th style={{ width: 150 }}>Time</th>
                <th style={{ width: 80 }}>Level</th>
                <th style={{ width: 70 }}>Method</th>
                <th>URL / Message</th>
                <th style={{ width: 70 }}>Status</th>
                <th style={{ width: 80 }}>Time taken</th>
                <th style={{ width: 170 }}>User / IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && entries.length === 0 && (
                <tr><td colSpan="7" className="text-center py-5 text-muted"><span className="spinner-border spinner-border-sm me-2"></span>Loading...</td></tr>
              )}
              {!isLoading && entries.length === 0 && (
                <tr><td colSpan="7" className="text-center py-5 text-muted"><i className="bi bi-inbox fs-3 d-block mb-2"></i>No log entries found.</td></tr>
              )}
              {entries.map(entry => {
                const isOpen = expanded === entry.id;
                const firstLine = (entry.message || '').split('\n')[0];
                const hasMore = (entry.message || '').includes('\n');
                return (
                  <React.Fragment key={entry.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : entry.id)}>
                      <td className="text-muted text-nowrap">{entry.timestamp || '—'}</td>
                      <td><span className={`badge border ${LEVEL_STYLES[entry.level] || 'bg-light text-muted'}`}>{entry.level}</span></td>
                      <td className="fw-semibold">{entry.method || '—'}</td>
                      <td style={{ maxWidth: 0 }}>
                        <div className="text-truncate font-monospace" title={entry.url}>{entry.url || '—'}</div>
                        <div className="text-truncate text-muted" title={firstLine}>
                          {hasMore && <i className={`bi ${isOpen ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>}
                          {firstLine}
                        </div>
                      </td>
                      <td className={statusClass(entry.status)}>{entry.status || '—'}</td>
                      <td className="text-muted">{entry.duration || '—'}</td>
                      <td>
                        <div className="text-truncate">{entry.user || <span className="text-muted">anonymous</span>}</div>
                        <div className="text-muted font-monospace">{entry.ip || '—'}</div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan="7" className="bg-body-tertiary">
                          <div className="small text-muted mb-1">Request ID: <code>{entry.requestId || '—'}</code></div>
                          <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto' }}>{entry.message}</pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-transparent">
          <LogPagination pagination={pagination} onPageChange={fetchEntries} label="entries" />
        </div>
      </div>
    </div>
  );
};

export default SystemLogsList;
