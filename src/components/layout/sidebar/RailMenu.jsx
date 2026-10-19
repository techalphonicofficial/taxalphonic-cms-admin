import React from 'react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../../context/SidebarContext';
import { useTheme } from '../../../context/ThemeContext';
import { railMenuData } from '../../../config/menuConfig';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AuthService } from '../../../services/auth.service';

const hasPermission = (permission) => {
    if (!permission) return true;
    const user = AuthService.getCurrentUser();
    if (!user) return false;
    if (user.role?.name === 'Admin') return true;
    const permissions = user.role?.permissions || [];
    return permissions.some(p => p.action === permission.action && p.module === permission.module);
};

const RailMenu = () => {
  const { activeRailItem, setActiveRailItem, setIsSecondarySidebarOpen, orgSettings } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleRailItemClick = (e, item) => {
    e.preventDefault();
    setActiveRailItem(item.id);
    setIsSecondarySidebarOpen(true);
    if (item.path) {
      navigate(item.path);
    }
  };

  const filteredRailMenuData = railMenuData.filter(item => hasPermission(item.permission));

  return (
    <div className="rail-menu d-flex flex-column flex-shrink-0 align-items-center py-3 bg-body shadow-sm position-relative" style={{ zIndex: 1060 }}>
      {/* Top Logo */}
      <div className="rail-logo mb-4">
        <Link to="/" className="d-block bg-primary text-white rounded d-flex align-items-center justify-content-center text-decoration-none overflow-hidden" style={{ width: '40px', height: '40px' }}>
          {orgSettings?.logo ? (
            <img src={orgSettings.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <i className="bi bi-box-fill fs-5"></i>
          )}
        </Link>
      </div>

      {/* Main Rail Nav */}
      <nav className="rail-nav w-100 d-flex flex-column align-items-center flex-grow-1 gap-2 pb-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        {filteredRailMenuData.map((item) => (
          <OverlayTrigger
            key={item.id}
            placement="right"
            overlay={<Tooltip id={`tooltip-${item.id}`}>{item.label}</Tooltip>}
          >
            <button
              className={clsx('btn rail-item position-relative border-0', {
                'active': activeRailItem === item.id
              })}
              onClick={(e) => handleRailItemClick(e, item)}
              aria-label={item.label}
            >
              <div className="rail-item-inner d-flex align-items-center justify-content-center rounded">
                <i className={`bi ${item.icon} fs-5`}></i>
              </div>
              {/* Notification Badge */}
              {item.badge && (
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '8px', marginLeft: '-12px' }}>
                  <span className="visually-hidden">New alerts</span>
                </span>
              )}
            </button>
          </OverlayTrigger>
        ))}
      </nav>

      {/* Bottom Rail Nav */}
      <div className="rail-bottom w-100 d-flex flex-column align-items-center gap-2 pt-3 border-top">
        <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-theme">Theme</Tooltip>}>
          <button className="btn rail-item position-relative border-0" onClick={toggleTheme} aria-label="Toggle Theme">
            <div className="rail-item-inner d-flex align-items-center justify-content-center rounded">
              <i className={`bi ${theme === 'dark' ? 'bi-moon-stars' : 'bi-brightness-high'} fs-5`}></i>
            </div>
          </button>
        </OverlayTrigger>

        <div className="mt-2">
          <button className="btn border-0 p-0" aria-label="Profile">
            <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center border border-2 border-body" style={{ width: '36px', height: '36px' }}>
              A
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RailMenu;
