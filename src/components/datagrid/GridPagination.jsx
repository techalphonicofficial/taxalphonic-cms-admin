import React from 'react';

const GridPagination = ({ table, pageCount, totalRows }) => {
  return (
    <div className="grid-pagination">
      <div>
        Showing {totalRows === 0 ? 0 : (table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, totalRows)} of {totalRows} entries
      </div>
      <div className="pagination-controls d-flex align-items-center">
        <button 
          className="btn" 
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span className="px-2">Page {table.getState().pagination.pageIndex + 1} of {pageCount > 0 ? pageCount : 1}</span>
        <button 
          className="btn" 
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default GridPagination;
