import React, { useState } from 'react';
import DataGrid from './DataGrid';
import { HistoryButton, recordTitle } from './RecordHistory';
import useServerList from './useServerList';
import PermLink from '../common/PermLink';

// List page for the pSEO masters (States, Locations, Industries, Technologies, Problems):
// server-side paging, search (by name) and sorting, optional select filters, edit + history actions.

export const ActiveBadge = ({ active }) => <span className={`badge ${active ? 'bg-success' : 'bg-danger'}`}>{active ? 'Active' : 'Inactive'}</span>;

export const Clamp = ({ text, lines = 2 }) => (
  text ? <span className="text-muted small" title={text} style={{ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal', maxWidth: 520 }}>{text}</span> : <span className="text-muted">-</span>
);

/**
 * filters: [{ key, label, options: [{ value, label }] }] → sent as query params (exact match).
 */
export default function MasterList({ title, subtitle, url, editPath, addPath, addLabel, columns, filters = [], itemLabel = 'record' }) {
  const [values, setValues] = useState({});
  const list = useServerList(url, { params: values });

  const allColumns = React.useMemo(() => [
    ...columns,
    {
      id: 'actions',
      header: 'Actions',
      pinned: 'right',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="d-flex gap-2">
          <PermLink to={`${editPath}/${row.original.id}`} className="btn btn-sm btn-outline-primary" title="Edit">
            <i className="bi bi-pencil"></i>
          </PermLink>
          <HistoryButton recordId={row.original.id} title={recordTitle(row.original)} className="btn btn-sm btn-outline-secondary" />
        </div>
      ),
    },
  ], [columns, editPath]);

  const activeFilters = Object.values(values).filter(Boolean).length;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h4 className="mb-1 fw-bold">{title}</h4>
          <p className="text-muted mb-0">
            {subtitle}
            <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill ms-2">{list.total.toLocaleString('en-IN')} {list.total === 1 ? itemLabel : `${itemLabel}s`}</span>
          </p>
        </div>
        <PermLink to={addPath} className="btn btn-primary rounded-pill px-4 shadow-sm">
          <i className="bi bi-plus-lg me-2"></i> {addLabel}
        </PermLink>
      </div>

      {filters.length > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          {filters.map((f) => (
            <select
              key={f.key}
              className="form-select form-select-sm w-auto"
              value={values[f.key] || ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              aria-label={f.label}
            >
              <option value="">{f.label}: All</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          {activeFilters > 0 && (
            <button type="button" className="btn btn-sm btn-link text-decoration-none" onClick={() => setValues({})}>
              <i className="bi bi-x-circle me-1"></i>Clear filters
            </button>
          )}
        </div>
      )}

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-0">
          {/* key: a filter change starts again from page 1 */}
          <DataGrid key={JSON.stringify(values)} {...list.gridProps} columns={allColumns} title={title} />
        </div>
      </div>
    </div>
  );
}
