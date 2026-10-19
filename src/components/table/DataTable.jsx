import React from 'react';
import clsx from 'clsx';

const DataTable = ({ 
  columns, 
  data, 
  isLoading, 
  onSort, 
  sortBy, 
  sortOrder,
  selectedRows,
  onRowSelect,
  onSelectAll
}) => {
  const isAllSelected = data.length > 0 && selectedRows.length === data.length;

  if (isLoading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-enterprise mb-0">
            <thead>
              <tr>
                {columns.map((col, idx) => <th key={idx}><div className="placeholder-glow"><span className="placeholder col-6"></span></div></th>)}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j}><div className="placeholder-glow"><span className="placeholder col-8"></span></div></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card border-0 shadow-sm text-center py-5">
        <div className="card-body text-muted">
          <i className="bi bi-inbox fs-1 d-block mb-3"></i>
          <h5>No data found</h5>
          <p>Try adjusting your search or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="table-responsive">
        <table className="table table-enterprise table-hover mb-0">
          <thead>
            <tr>
              <th style={{ width: '40px' }} className="text-center">
                <input 
                  type="checkbox" 
                  className="form-check-input cursor-pointer"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                />
              </th>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={clsx({ 'cursor-pointer': col.sortable })}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <div className="d-flex align-items-center">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <i className={`bi ms-1 bi-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                    {col.sortable && sortBy !== col.key && (
                      <i className="bi bi-arrow-down-up ms-1 text-muted opacity-50"></i>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i}>
                <td className="text-center">
                  <input 
                    type="checkbox" 
                    className="form-check-input cursor-pointer"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => onRowSelect(row.id)}
                  />
                </td>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Placeholder */}
      <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center mb-2 py-3">
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
          Showing 1 to {data.length} of {data.length} entries
        </span>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className="page-item disabled"><button className="page-link">Previous</button></li>
            <li className="page-item active"><button className="page-link">1</button></li>
            <li className="page-item disabled"><button className="page-link">Next</button></li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default DataTable;
