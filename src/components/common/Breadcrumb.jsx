import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <div className="d-flex align-items-center mb-2" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
      {/* Home Link */}
      <Link 
        to="/" 
        className="text-decoration-none text-muted d-flex align-items-center transition-all breadcrumb-hover" 
      >
        <i className="bi bi-house me-1"></i> Home
      </Link>

      {/* Dynamic Items */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-muted opacity-50 mx-2">/</span>
          
          {item.link ? (
            <Link 
              to={item.link} 
              className="text-decoration-none text-muted transition-all breadcrumb-hover" 
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className="text-dark fw-semibold" 
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
      
      <style>{`
        .breadcrumb-hover:hover {
          color: var(--bs-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default Breadcrumb;
