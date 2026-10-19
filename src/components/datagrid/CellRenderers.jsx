import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || 'draft').toLowerCase();
  
  let bgClass = 'bg-secondary-subtle text-secondary border-secondary';
  
  if (normalized === 'published' || normalized === 'active' || normalized === 'approved') {
    bgClass = 'bg-success-subtle text-success border-success';
  } else if (normalized === 'draft' || normalized === 'pending') {
    bgClass = 'bg-warning-subtle text-warning border-warning';
  } else if (normalized === 'rejected' || normalized === 'deleted' || normalized === 'inactive') {
    bgClass = 'bg-danger-subtle text-danger border-danger';
  }
  
  return (
    <span className={`badge border ${bgClass} text-uppercase px-2 py-1`}>
      {status}
    </span>
  );
};

export const AvatarCell = ({ name, url }) => {
  if (url) {
    return (
      <div className="d-flex align-items-center gap-2">
        <img src={url} alt={name} className="rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
        <span className="fw-medium">{name}</span>
      </div>
    );
  }
  
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
  
  return (
    <div className="d-flex align-items-center gap-2">
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-bold"
        style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
      >
        {initials}
      </div>
      <span className="fw-medium">{name}</span>
    </div>
  );
};

export const DateCell = ({ date }) => {
  if (!date) return <span className="text-muted">-</span>;
  
  const d = new Date(date);
  return (
    <div className="d-flex flex-column">
      <span>{d.toLocaleDateString()}</span>
      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
};
