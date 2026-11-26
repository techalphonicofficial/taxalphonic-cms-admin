import React from 'react';
import { Link } from 'react-router-dom';

/** Shared bits of the dashboard (Dashboard.jsx + DashboardInsights.jsx). Styles: Dashboard.css (.ta-dash). */

export const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export const timeAgo = (value) => {
  if (!value) return '—';
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)} d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** "18 Nov, 4:22 pm" */
export const dateTime = (value) => (value
  ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  : '—');

export const Panel = ({ title, icon, link, linkText = 'View all', children, className = '', bodyClass = '', extra }) => (
  <section className={`dash-panel ${className}`}>
    <header className="dash-panel-head">
      <h3><i className={`bi ${icon}`}></i>{title}</h3>
      {extra}
      {link && <Link to={link} className="dash-link">{linkText} <i className="bi bi-arrow-right-short"></i></Link>}
    </header>
    <div className={`dash-panel-body ${bodyClass}`}>{children}</div>
  </section>
);

export const Kpi = ({ to, icon, tone, label, value, sub, progress, trend }) => {
  const body = (
    <>
      <div className="dash-kpi-top">
        <span className="dash-kpi-label">{label}</span>
        <span className="dash-icon"><i className={`bi ${icon}`}></i></span>
      </div>
      <div className="dash-kpi-value">{value}</div>
      {progress != null && (
        <div className="dash-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, progress)}%` }}></span></div>
      )}
      <div className="dash-kpi-sub">
        {trend != null && (
          <span className={`dash-trend ${trend >= 0 ? 'up' : 'down'}`}>
            <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}-right`}></i>{Math.abs(trend)}%
          </span>
        )}
        {sub}
      </div>
    </>
  );
  return to
    ? <Link to={to} className={`dash-kpi tone-${tone}`}>{body}</Link>
    : <div className={`dash-kpi tone-${tone}`}>{body}</div>;
};
