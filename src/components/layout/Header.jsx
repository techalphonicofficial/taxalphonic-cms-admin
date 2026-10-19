import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import GlobalSearch from '../common/GlobalSearch';
import { AuthService } from '../../services/auth.service';
import { InquiryService } from '../../services/inquiry.service';

const Header = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { isSecondarySidebarOpen, toggleSecondarySidebar } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUser(AuthService.getCurrentUser());

    const fetchNotifications = async () => {
      try {
        const res = await InquiryService.getAll({ status: 'NEW', limit: 5 });
        if (res?.data) {
          setNotifications(res.data);
          setUnreadCount(res.pagination?.total || res.data.length || 0);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    fetchNotifications();

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
        {/* Quick Create */}
        <div className="dropdown">
          <button className="btn btn-primary btn-sm dropdown-toggle rounded-pill px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
            <i className="bi bi-plus-lg me-1"></i> Quick Create
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 mt-2">
            <li><Link className="dropdown-item py-2" to="/pages/new"><i className="bi bi-file-earmark-text me-2 text-muted"></i> New Page</Link></li>
            <li><Link className="dropdown-item py-2" to="/services/new"><i className="bi bi-briefcase me-2 text-muted"></i> New Service</Link></li>
            <li><Link className="dropdown-item py-2" to="/cms/banners/new"><i className="bi bi-image me-2 text-muted"></i> New Banner</Link></li>
            <li><Link className="dropdown-item py-2" to="/cms/faqs/new"><i className="bi bi-question-circle me-2 text-muted"></i> New FAQ</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li><Link className="dropdown-item py-2" to="/cms/team/new"><i className="bi bi-people me-2 text-muted"></i> New Team Member</Link></li>
          </ul>
        </div>

        {/* Apps Grid */}
        <div className="dropdown d-none d-sm-block">
          <button className="btn btn-link text-secondary p-0 text-decoration-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" title="Apps">
            <i className="bi bi-grid fs-5"></i>
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-3 mt-2" style={{ width: '320px' }}>
            <div className="d-flex justify-content-between align-items-center mb-2 mb-3 px-1">
              <h6 className="mb-0 fw-bold">Web Apps</h6>
              <Link to="/" className="text-decoration-none" style={{ fontSize: '0.8rem' }}>View All</Link>
            </div>
            <div className="row g-2 text-center">
              <div className="col-4">
                <Link to="/" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-primary bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-speedometer2 text-primary fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Dashboard</span>
                </Link>
              </div>
              <div className="col-4">
                <Link to="/media" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-success bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-images text-success fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Media</span>
                </Link>
              </div>
              <div className="col-4">
                <Link to="/blogs" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-info bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-journal-text text-info fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Blogs</span>
                </Link>
              </div>
              <div className="col-4">
                <Link to="/pages" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-warning bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-file-earmark-text text-warning fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Pages</span>
                </Link>
              </div>
              <div className="col-4">
                <Link to="/services" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-danger bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-briefcase text-danger fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Services</span>
                </Link>
              </div>
              <div className="col-4">
                <Link to="/settings" className="dropdown-item rounded-3 p-2 text-wrap text-center d-flex flex-column align-items-center h-100">
                  <div className="bg-secondary bg-opacity-10 rounded-circle mb-2 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                    <i className="bi bi-gear text-secondary fs-5"></i>
                  </div>
                  <span className="fw-medium" style={{ fontSize: '0.75rem' }}>Settings</span>
                </Link>
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

        {/* Notifications */}
        <div className="dropdown">
          <button className="btn btn-link text-secondary p-0 position-relative text-decoration-none" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" title="Notifications">
            <i className="bi bi-bell fs-5"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem', padding: '0.25em 0.4em' }}>
              {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : 0}
            </span>
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-0 mt-2" style={{ width: '320px', overflow: 'hidden' }}>
            <div className="bg-body-tertiary px-3 py-2 border-bottom d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 fw-bold">Notifications</h6>
              {unreadCount > 0 && <span className="badge bg-primary rounded-pill">{unreadCount} New</span>}
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <Link to={`/crm/leads`} key={notif.id || idx} className="list-group-item list-group-item-action d-flex gap-3 py-3 border-0 border-bottom">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-person-plus-fill"></i>
                    </div>
                    <div className="d-flex gap-2 w-100 justify-content-between">
                      <div>
                        <h6 className="mb-0 fw-medium" style={{ fontSize: '0.9rem' }}>New Inquiry</h6>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>{notif.name} submitted a form.</p>
                      </div>
                      <small className="text-muted text-nowrap" style={{ fontSize: '0.75rem' }}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-bell-slash fs-2 mb-2 d-block opacity-50"></i>
                  <span style={{ fontSize: '0.875rem' }}>No new notifications</span>
                </div>
              )}
            </div>
            <div className="p-2 border-top text-center bg-body-tertiary">
              <Link to="/crm/leads" className="text-decoration-none text-primary fw-medium" style={{ fontSize: '0.85rem' }}>View All Leads</Link>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="dropdown ms-1">
          <button className="btn btn-link text-secondary text-decoration-none d-flex align-items-center gap-2 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
            <img src={`https://ui-avatars.com/api/?name=${user?.firstName || 'A'}&background=random`} alt={user?.firstName || 'User'} className="rounded-circle" width="34" height="34" />
            <span className="d-none d-md-block fw-medium text-dark" style={{ fontSize: '0.95rem' }}>{user?.firstName || 'Admin'}</span>
            <i className="bi bi-chevron-down text-muted" style={{ fontSize: '0.75rem' }}></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3 mt-3">
            <li><Link className="dropdown-item py-2" to="/profile"><i className="bi bi-person me-2"></i> Profile</Link></li>
            <li><Link className="dropdown-item py-2" to="/settings"><i className="bi bi-gear me-2"></i> Settings</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item py-2 text-danger" href="#" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Logout</a></li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
