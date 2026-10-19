import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-body-tertiary">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-primary mb-0" style={{ fontSize: '8rem' }}>404</h1>
        <h3 className="fw-bold mb-3">Page Not Found</h3>
        <p className="text-muted mb-4">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <Link to="/" className="btn btn-primary px-4 py-2 shadow-sm">
          <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
