import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import HasPermission from '../common/HasPermission';
import { AuditLogService } from '../../services/auditLog.service';
import { actionStyle, userName, ChangeTable } from '../logs/auditFormat';

const HISTORY_LIMIT = 50;

/**
 * Change history of one record, read from the audit log (GET /audit-logs?recordId=).
 * The backend audits every model by id, so this works for any list row.
 */
const RecordHistoryModal = ({ recordId, title, onHide }) => {
  const [entries, setEntries] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});

  useEffect(() => {
    let cancelled = false;
    AuditLogService.getAll({ recordId, limit: HISTORY_LIMIT })
      .then(res => {
        if (cancelled) return;
        setEntries(res.data || []);
        setTotal(res.pagination?.totalItems ?? (res.data || []).length);
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load history.');
      });
    return () => { cancelled = true; };
  }, [recordId]);

  const toggle = async (log) => {
    if (openId === log.id) { setOpenId(null); return; }
    setOpenId(log.id);
    if (details[log.id]) return;
    try {
      const res = await AuditLogService.getById(log.id);
      setDetails(d => ({ ...d, [log.id]: res.data }));
    } catch {
      setDetails(d => ({ ...d, [log.id]: { failed: true } }));
    }
  };

  return (
    <Modal show onHide={onHide} size="lg" centered scrollable className="custom-high-z-modal" backdropClassName="custom-high-z-backdrop">
      <Modal.Header closeButton>
        <Modal.Title className="h6 fw-bold">
          <i className="bi bi-clock-history me-2"></i>History{title ? `: ${title}` : ''}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger small mb-0">{error}</div>}
        {!error && !entries && (
          <div className="text-center text-muted py-4"><span className="spinner-border spinner-border-sm me-2"></span>Loading history...</div>
        )}
        {entries?.length === 0 && (
          <div className="text-center text-muted py-4"><i className="bi bi-journal-x fs-3 d-block mb-2"></i>No changes recorded for this item yet.</div>
        )}
        {entries?.length > 0 && (
          <div className="list-group">
            {entries.map(log => {
              const style = actionStyle(log.action);
              const isOpen = openId === log.id;
              const detail = details[log.id];
              return (
                <div key={log.id} className="list-group-item p-0">
                  <button
                    type="button"
                    className="btn w-100 text-start d-flex gap-3 align-items-start p-3 border-0 rounded-0"
                    onClick={() => toggle(log)}
                    aria-expanded={isOpen}
                  >
                    <span className={`badge bg-${style.bg} flex-shrink-0`} style={{ minWidth: 78 }}>
                      <i className={`bi ${style.icon} me-1`}></i>{log.action}
                    </span>
                    <span className="flex-grow-1 small">
                      <span className="d-block">{log.description}</span>
                      <span className="text-muted">
                        {userName(log) || 'System / Anonymous'} · {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </span>
                    <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3">
                      {!detail && <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2"></span>Loading changes...</div>}
                      {detail?.failed && <div className="text-danger small">Failed to load change details.</div>}
                      {detail && !detail.failed && <ChangeTable log={detail} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {entries && total > entries.length && (
          <p className="text-muted small mt-2 mb-0">Showing the latest {entries.length} of {total} changes. See Logs → Audit Logs for the rest.</p>
        )}
      </Modal.Body>
    </Modal>
  );
};

/**
 * Row action that opens the record's history. Rendered only for users who can read
 * audit logs, and only when the row has an id.
 */
export const HistoryButton = ({ recordId, title, className = 'btn' }) => {
  const [show, setShow] = useState(false);
  if (!recordId) return null;
  return (
    <HasPermission action="read" module="AuditLogs">
      <button
        type="button"
        className={className}
        title="View history"
        onClick={(e) => { e.stopPropagation(); setShow(true); }}
      >
        <i className="bi bi-clock-history"></i>
      </button>
      {/* The modal is portalled, but its React events still bubble through this table cell */}
      {show && (
        <span onClick={(e) => e.stopPropagation()}>
          <RecordHistoryModal recordId={recordId} title={title} onHide={() => setShow(false)} />
        </span>
      )}
    </HasPermission>
  );
};

// Best-effort human label for a list row, shown in the modal title.
export const recordTitle = (row = {}) =>
  row.title || row.name || row.question || row.authorName || row.slug ||
  [row.firstName, row.lastName].filter(Boolean).join(' ') || '';

export default HistoryButton;
