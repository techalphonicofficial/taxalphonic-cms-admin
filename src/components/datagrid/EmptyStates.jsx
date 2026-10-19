import React from 'react';

export const LoadingState = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </td>
  </tr>
);

export const ErrorState = ({ colSpan, error }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-5 text-danger">
      <i className="bi bi-exclamation-triangle fs-1 mb-2"></i>
      <h6>Error Loading Data</h6>
      <p className="small">{error?.message || 'Something went wrong.'}</p>
    </td>
  </tr>
);

export const NoDataState = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-5 text-muted">
      <i className="bi bi-inbox fs-1 mb-2 text-secondary opacity-50"></i>
      <h6>No Data Found</h6>
    </td>
  </tr>
);
