import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-danger">403</h1>
        <h2 className="mb-4">Unauthorized Access</h2>
        <p className="text-muted mb-4">You do not have permission to view this page.</p>
        <Link to="/" className="btn btn-primary rounded-pill px-4">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
