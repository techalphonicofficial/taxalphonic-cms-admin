import React, { useEffect, useRef, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../../../context/SidebarContext';
import { secondaryMenuData, railMenuData } from '../../../config/menuConfig';
import { AuthService } from '../../../services/auth.service';

const SidebarSearch = ({ value, onChange, onKeyDown }) => {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="px-3 py-3">
      <div className="position-relative">
        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
        <input 
          ref={searchInputRef}
          type="text" 
          className="form-control form-control-sm bg-body-tertiary border-0 ps-5" 
          placeholder="Search..." 
          aria-label="Search sidebar"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="position-absolute top-50 end-0 translate-middle-y me-2">
          <kbd className="bg-body-secondary border px-1 rounded text-muted" style={{ fontSize: '0.65rem' }}>Ctrl+K</kbd>
        </div>
      </div>
    </div>
  );
};

const hasPermission = (permission) => {
    if (!permission) return true;
    const user = AuthService.getCurrentUser();
    if (!user) return false;
    if (user.role?.name === 'Admin') return true;
    const permissions = user.role?.permissions || [];
    return permissions.some(p => p.action === permission.action && p.module === permission.module);
};

const SecondarySidebar = () => {
  const { activeRailItem, isSecondarySidebarOpen, toggleSecondarySidebar, orgSettings } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();

  // Reset search when changing modules
  useEffect(() => {
    setSearchQuery('');
    setActiveIndex(-1);
  }, [activeRailItem]);
  
  const rawMenuConfig = secondaryMenuData[activeRailItem] || [];
  const currentRailItemLabel = railMenuData.find(item => item.id === activeRailItem)?.label || 'Menu';

  const menuConfig = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return rawMenuConfig.map(group => {
      const filteredItems = group.items.filter(item => {
        const matchesQuery = item.label.toLowerCase().includes(query);
        const matchesPermission = hasPermission(item.permission);
        return matchesQuery && matchesPermission;
      });
      return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
  }, [rawMenuConfig, searchQuery]);

  const flatItems = useMemo(() => {
    return menuConfig.reduce((acc, group) => [...acc, ...group.items], []);
  }, [menuConfig]);

  useEffect(() => {
    setActiveIndex(searchQuery.trim() && flatItems.length > 0 ? 0 : -1);
  }, [searchQuery, flatItems.length]);

  const handleSearchKeyDown = (e) => {
    if (!flatItems.length) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        navigate(flatItems[activeIndex].path);
      }
    }
  };

  return (
    <div 
      className={clsx('secondary-sidebar d-flex flex-column flex-shrink-0 bg-body shadow-sm position-relative', {
        'closed': !isSecondarySidebarOpen
      })}
    >
      {/* Workspace / Title Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ height: '60px' }}>
        <div className="dropdown w-100 me-2">
          <div 
            className="d-flex align-items-center cursor-pointer hover-bg p-1 rounded w-100 transition" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <div className="rounded bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center me-2 flex-shrink-0 overflow-hidden" style={{ width: '32px', height: '32px' }}>
              {orgSettings?.logo ? (
                <img src={orgSettings.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="bi bi-building"></i>
              )}
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <div className="fw-bold text-truncate" style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>{orgSettings?.name || 'Acme Corp'}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{currentRailItemLabel}</div>
            </div>
            <i className="bi bi-chevron-expand text-muted flex-shrink-0"></i>
          </div>
          <ul className="dropdown-menu shadow-sm border-0 w-100">
            <li><h6 className="dropdown-header">Workspaces</h6></li>
            <li>
              <a className="dropdown-item d-flex align-items-center active" href="#">
                <i className="bi bi-check me-2"></i> {orgSettings?.name || 'Acme Corp'}
              </a>
            </li>
            <li>
              <a className="dropdown-item d-flex align-items-center" href="#">
                <i className="bi bi-building me-2 text-muted"></i> Demo Workspace
              </a>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <a className="dropdown-item d-flex align-items-center text-primary" href="#">
                <i className="bi bi-plus-circle me-2"></i> Create Workspace
              </a>
            </li>
          </ul>
        </div>
      </div>

      <SidebarSearch value={searchQuery} onChange={setSearchQuery} onKeyDown={handleSearchKeyDown} />

      {/* Menu Groups */}
      <div className="flex-grow-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 pb-4">
        {menuConfig.length > 0 ? (
          menuConfig.map((group, idx) => (
            <div key={idx} className="mb-4">
              {group.group && (
                <div className="px-3 mb-2 d-flex align-items-center justify-content-between text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                  <span>{group.group}</span>
                </div>
              )}
              <ul className="nav flex-column mb-0 gap-1">
                {group.items.map((item, itemIdx) => {
                  const globalIdx = flatItems.findIndex(i => i.path === item.path);
                  
                  // Compute exact active state considering query params
                  const isExactActive = item.path === location.pathname + location.search || 
                                       (item.path === location.pathname && !location.search);
                                       
                  const isHighlighted = globalIdx === activeIndex || (activeIndex === -1 && isExactActive);

                  return (
                  <li className="nav-item" key={itemIdx}>
                    <Link to={item.path} className={clsx("nav-link secondary-nav-link rounded px-3 py-2 d-flex align-items-center justify-content-between transition", {
                      "bg-primary text-white shadow-sm": isHighlighted,
                      "text-body": !isHighlighted
                    })}>
                      <div className="d-flex align-items-center text-truncate">
                        <i className={clsx(`bi ${item.icon} me-3 fs-6`, {
                           "text-white": isHighlighted,
                           "text-muted": !isHighlighted
                        })}></i>
                        <span className="text-truncate" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
                      </div>
                    </Link>
                  </li>
                  );
                })}
              </ul>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted">
            <i className="bi bi-inbox fs-2 mb-2 d-block opacity-50"></i>
            <span style={{ fontSize: '0.875rem' }}>No modules configured for this section.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondarySidebar;
