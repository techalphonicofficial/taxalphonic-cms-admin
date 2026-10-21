import React from 'react';

// Simple prev/next pager used by the Audit Logs and System Logs pages
const LogPagination = ({ pagination, onPageChange, label = 'items' }) => {
  const { currentPage = 1, totalPages = 1, totalItems = 0 } = pagination || {};
  const pages = Math.max(totalPages, 1);

  return (
    <div className="d-flex justify-content-between align-items-center small">
      <span className="text-muted">
        {totalItems} {label} · page {currentPage} of {pages}
      </span>
      <div className="btn-group">
        <button type="button" className="btn btn-sm btn-light border" disabled={currentPage <= 1} onClick={() => onPageChange(1)} title="First page">
          <i className="bi bi-chevron-double-left"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <i className="bi bi-chevron-left"></i> Prev
        </button>
        <button type="button" className="btn btn-sm btn-light border" disabled={currentPage >= pages} onClick={() => onPageChange(currentPage + 1)}>
          Next <i className="bi bi-chevron-right"></i>
        </button>
        <button type="button" className="btn btn-sm btn-light border" disabled={currentPage >= pages} onClick={() => onPageChange(pages)} title="Last page">
          <i className="bi bi-chevron-double-right"></i>
        </button>
      </div>
    </div>
  );
};

export default LogPagination;
