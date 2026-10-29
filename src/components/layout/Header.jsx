import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import GlobalSearch from '../common/GlobalSearch';
import { AuthService } from '../../services/auth.service';
import { leadSourceLabel, useLeadNotifications } from '../../context/LeadNotificationsContext';
import './leadAlerts.css';
import PermLink from '../common/PermLink';
import { canOpen } from '../../utils/permissions';

const QUICK_CREATE = ['/pages/new', '/services/new', '/cms/banners/new', '/cms/faqs/new', '/cms/team/new'];

// "2 min ago" for the bell list.
const timeAgo = (date) => {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const Header = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { isSecondarySidebarOpen, toggleSecondarySidebar } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const alerts = useLeadNotifications();

  useEffect(() => {
    setUser(AuthService.getCurrentUser());

    const handleUserUpdate = () => {
      setUser(AuthService.getCurrentUser());
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    AuthService.logout();
    navigate('/login');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="header shadow-sm d-flex justify-content-between align-items-center mb-2 ps-4 pe-5" style={{ zIndex: 1030, height: '72px', backgroundColor: 'var(--cms-card-bg)', borderBottom: '1px solid var(--cms-card-border)' }}>
      {/* Left Section */}
      <div className="d-flex align-items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <button className="btn btn-link text-secondary d-md-none p-0 text-decoration-none" onClick={toggleSidebar}>
          <i className="bi bi-list fs-4"></i>
        </button>
        {/* Desktop Sidebar Toggle */}
        <button
          className="btn btn-link text-secondary d-none d-md-flex p-0 text-decoration-none"
          onClick={toggleSecondarySidebar}
          title={isSecondarySidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <i className={`bi ${isSecondarySidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'} fs-4`}></i>
        </button>

        <GlobalSearch />
      </div>

      {/* Right Section */}
      <div className="d-flex align-items-center gap-3 me-3">
        {/* Quick Create: only with at least one page the role may create */}
        {QUICK_CREATE.some((path) => canOpen(path)) && (
        <div className="dropdown">
          <button className="btn btn-primary btn-sm dropdown-toggle rounded-pill px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
            <i className="bi bi-plus-lg me-1"></i> Quick Create
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 mt-2">
            <li><PermLink className="dropdown-item py-2" to="/pages/new"><i className="bi bi-file-earmark-text me-2 text-muted"></i> New Page</PermLink></li>
            <li><PermLink className="dropdown-item py-2" to="/services/new"><i className="bi bi-briefcase me-2 text-muted"></i> New Service</PermLink></li>
            <li><PermLink className="dropdown-item py-2" to="/cms/banners/new"><i className="bi bi-image me-2 text-muted"></i> New Banner</PermLink></li>
            <li><PermLink className="dropdown-item py-2" to="/cms/faqs/new"><i className="bi bi-question-circle me-2 text-muted"></i> New FAQ</PermLink></li>
            {canOpen('/cms/team/new') && ['/pages/new', '/services/new', '/cms/banners/new', '/cms/faqs/new'].some((p) => canOpen(p)) && <li><hr className="dropdown-divider" /></li>}
            <li><PermLink className="dropdown-item py-2" to="/cms/team/new"><i className="bi bi-people me-2 text-muted"></i> New Team Member</PermLink></li>
          </ul>
        </div>
        )}

        {/* Apps Grid */}
        <div className="dropdown d-none d-sm-block">
          <button className="btn btn-link text-secondary p-0 text-decoration-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" title="Apps">
            <i className="bi bi-grid fs-5"></i>
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-3 mt-2" style={{ width: '320px' }}>
            <div className="d-flex justify-content-between align-items-center mb-2 mb-3 px-1">
              <h6 className="mb-0 fw-bold">Web Apps</h6>
              <PermLink to="/" className="text-decoration-none" style={{ fontSize: '0.8rem' }}>View All</PermLink>
            </div>
            <div className="row g-2 text-center ta-apps-grid">
              <div className="col-4">
                <PermLink to="/" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-primary bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-speedometer2 text-primary fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Dashboard</span>
                </PermLink>
              </div>
              <div className="col-4">
                <PermLink to="/media" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-success bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-images text-success fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Media</span>
                </PermLink>
              </div>
              <div className="col-4">
                <PermLink to="/blogs" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-info bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-journal-text text-info fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Blogs</span>
                </PermLink>
              </div>
              <div className="col-4">
                <PermLink to="/pages" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-warning bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-file-earmark-text text-warning fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Pages</span>
                </PermLink>
              </div>
              <div className="col-4">
                <PermLink to="/services" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-danger bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-briefcase text-danger fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Services</span>
                </PermLink>
              </div>
              <div className="col-4">
                <PermLink to="/settings" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-secondary bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-gear text-secondary fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Settings</span>
                </PermLink>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen */}
        <button className="btn btn-link text-secondary p-0 d-none d-sm-block text-decoration-none" onClick={toggleFullScreen} title="Toggle Fullscreen">
          <i className="bi bi-arrows-fullscreen fs-5"></i>
        </button>

        {/* Theme Toggle */}
        <button className="btn btn-link text-secondary p-0 text-decoration-none" onClick={toggleTheme} title="Toggle Theme">
          <i className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-brightness-high'} fs-5`}></i>
        </button>

        {/* New-lead notifications (LeadNotificationsContext: polling, ring, toasts, desktop alerts) */}
        {alerts?.enabled && (
          <div className="dropdown">
            <button
              className={`btn btn-link text-secondary p-0 position-relative text-decoration-none ta-bell${alerts.unseen > 0 ? ' is-ringing' : ''}`}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-display="static"
              data-bs-auto-close="outside"
              title={alerts.unseen > 0 ? `${alerts.unseen} new lead(s)` : 'Lead notifications'}
              onClick={alerts.acknowledge}
            >
              <i className={`bi ${alerts.unseen > 0 ? 'bi-bell-fill text-danger' : 'bi-bell'} fs-5`}></i>
              {alerts.newCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem', padding: '0.25em 0.4em' }}>
                  {alerts.newCount > 99 ? '99+' : alerts.newCount}
                </span>
              )}
            </button>
            <div className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-0 mt-2 ta-bell-menu">
              <div className="bg-body-tertiary px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">New leads</h6>
                {alerts.newCount > 0 && <span className="badge bg-primary rounded-pill">{alerts.newCount} new</span>}
              </div>
              <div className="list-group list-group-flush ta-bell-list">
                {alerts.leads.length > 0 ? alerts.leads.map((lead) => (
                  <button type="button" key={lead.id} className="list-group-item list-group-item-action d-flex gap-3 py-2 border-0 border-bottom text-start" onClick={() => alerts.openLeads(lead)}>
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38 }}>
                      <i className="bi bi-person-plus-fill"></i>
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex justify-content-between gap-2">
                        <span className="fw-semibold text-truncate" style={{ fontSize: '0.88rem' }}>{lead.name}</span>
                        <small className="text-muted text-nowrap" style={{ fontSize: '0.72rem' }}>{timeAgo(lead.createdAt)}</small>
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>{[lead.phone, leadSourceLabel(lead)].filter(Boolean).join(' · ')}</div>
                    </div>
                  </button>
                )) : (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-bell-slash fs-2 mb-2 d-block opacity-50"></i>
                    <span style={{ fontSize: '0.875rem' }}>No new leads</span>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-top bg-body-tertiary">
                <div className="form-check form-switch mb-1">
                  <input className="form-check-input" type="checkbox" id="ta-bell-sound" checked={alerts.settings.sound} onChange={(e) => alerts.setSetting('sound', e.target.checked)} />
                  <label className="form-check-label small" htmlFor="ta-bell-sound">Ring on new lead</label>
                  <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={alerts.testRing}>Test</button>
                </div>
                {alerts.settings.sound && (
                  <div className="form-check form-switch mb-1">
                    <input className="form-check-input" type="checkbox" id="ta-bell-repeat" checked={alerts.settings.repeat} onChange={(e) => alerts.setSetting('repeat', e.target.checked)} />
                    <label className="form-check-label small" htmlFor="ta-bell-repeat">Ring again until someone looks (max 1 min)</label>
                  </div>
                )}
                {alerts.permission === 'granted' ? (
                  <div className="form-check form-switch mb-1">
                    <input className="form-check-input" type="checkbox" id="ta-bell-desktop" checked={alerts.settings.desktop} onChange={(e) => alerts.setSetting('desktop', e.target.checked)} />
                    <label className="form-check-label small" htmlFor="ta-bell-desktop">Desktop notification when this tab is in the background</label>
                  </div>
                ) : alerts.permission === 'default' ? (
                  <button type="button" className="btn btn-sm btn-outline-primary w-100 mb-1" onClick={alerts.requestDesktop}>
                    <i className="bi bi-window-stack me-1"></i>Allow desktop notifications
                  </button>
                ) : alerts.permission === 'denied' ? (
                  <div className="small text-muted mb-1"><i className="bi bi-info-circle me-1"></i>Desktop notifications are blocked in this browser (site settings → Notifications → Allow).</div>
                ) : null}
                {alerts.settings.sound && !alerts.soundReady && (
                  <div className="small text-warning-emphasis"><i className="bi bi-volume-mute me-1"></i>Click anywhere once so the browser lets the ring play.</div>
                )}
              </div>
              <div className="p-2 border-top text-center">
                <PermLink to="/crm/leads?status=NEW" className="text-decoration-none text-primary fw-medium" style={{ fontSize: '0.85rem' }} onClick={alerts.acknowledge}>View all new leads</PermLink>
              </div>
            </div>
          </div>
        )}

        {/* Profile */}
        <div className="dropdown ms-1">
          <button className="btn btn-link text-secondary text-decoration-none d-flex align-items-center gap-2 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
            <img src={`https://ui-avatars.com/api/?name=${user?.firstName || 'A'}&background=random`} alt={user?.firstName || 'User'} className="rounded-circle" width="34" height="34" />
            <span className="d-none d-md-block fw-medium text-dark" style={{ fontSize: '0.95rem' }}>{user?.firstName || 'Admin'}</span>
            <i className="bi bi-chevron-down text-muted" style={{ fontSize: '0.75rem' }}></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3 mt-3">
            <li><PermLink className="dropdown-item py-2" to="/profile"><i className="bi bi-person me-2"></i> Profile</PermLink></li>
            <li><PermLink className="dropdown-item py-2" to="/settings"><i className="bi bi-gear me-2"></i> Settings</PermLink></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item py-2 text-danger" href="#" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Logout</a></li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
