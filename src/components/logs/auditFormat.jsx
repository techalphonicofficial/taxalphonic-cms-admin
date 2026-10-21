import React from 'react';

// Shared by the Audit Logs page and the per-record History modal.
export const ACTION_STYLES = {
  CREATE: { bg: 'success', icon: 'bi-plus-circle' },
  UPDATE: { bg: 'primary', icon: 'bi-pencil' },
  DELETE: { bg: 'danger', icon: 'bi-trash' },
  RESTORE: { bg: 'info', icon: 'bi-arrow-counterclockwise' },
  CLEAR: { bg: 'warning', icon: 'bi-eraser' },
};

export const actionStyle = (action) => ACTION_STYLES[action] || { bg: 'secondary', icon: 'bi-dot' };

export const userName = (log) => (log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : null);

export const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return <span className="text-muted">—</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    return <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(value, null, 2)}</pre>;
  }
  const text = String(value);
  return text.length > 400 ? <span title={text}>{text.slice(0, 400)}…</span> : text;
};

export const changedFieldsOf = (log) =>
  log ? [...new Set([...Object.keys(log.oldData || {}), ...Object.keys(log.newData || {})])] : [];

// Before/after table for one audit entry (needs the full entry from GET /audit-logs/:id).
export const ChangeTable = ({ log }) => {
  const fields = changedFieldsOf(log);
  if (fields.length === 0) return <p className="text-muted small mb-0">No field-level data recorded for this entry.</p>;
  return (
    <div className="table-responsive">
      <table className="table table-sm table-bordered small mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '20%' }}>Field</th>
            {log.action !== 'CREATE' && <th>Before</th>}
            {log.action !== 'DELETE' && <th>After</th>}
          </tr>
        </thead>
        <tbody>
          {fields.map(field => (
            <tr key={field}>
              <td className="fw-semibold">{field}</td>
              {log.action !== 'CREATE' && <td className="bg-danger-subtle">{formatValue(log.oldData?.[field])}</td>}
              {log.action !== 'DELETE' && <td className="bg-success-subtle">{formatValue(log.newData?.[field])}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
