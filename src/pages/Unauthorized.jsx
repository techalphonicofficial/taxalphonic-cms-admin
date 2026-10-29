import React from 'react';
import { Link } from 'react-router-dom';
import { firstAllowedPath } from '../utils/permissions';

// A page the user's role does not allow (AdminLayout / RoutePermission send them here).
// The button goes to the first page they may open (the dashboard when allowed).
const Unauthorized = () => {
  const home = firstAllowedPath();
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-body-tertiary">
      <div className="text-center px-3">
        <h1 className="display-1 fw-bold text-danger">403</h1>
        <h2 className="mb-3">No access to this page</h2>
        <p className="text-muted mb-4">Your role does not allow this page. Ask an administrator if you need it.</p>
        <Link to={home} className="btn btn-primary rounded-pill px-4">
          {home === '/' ? 'Return to Dashboard' : 'Go to my pages'}
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
