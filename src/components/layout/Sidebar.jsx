import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  return (
    <div
      className={clsx("sidebar-wrapper flex-shrink-0 position-relative", { "is-collapsed": isCollapsed })}
      style={{ width: isCollapsed ? '80px' : '260px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1030 }}
    >
      <div
        className={clsx('sidebar d-flex flex-column h-100', {
          'collapsed': isCollapsed
        })}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom sidebar-logo">
          <span className="fs-5 fw-bold text-primary">Admin Pro</span>
          <button className="btn btn-sm btn-link text-secondary d-none d-md-block" onClick={toggleSidebar}>
            <i className={clsx('bi', isCollapsed ? 'bi-list' : 'bi-text-indent-left')} style={{ fontSize: '1.5rem' }}></i>
          </button>
        </div>

        <div className="p-3 search-container">
          <div className="input-group mb-3 d-none d-md-flex">
            <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control border-start-0" placeholder="Search menu..." />
          </div>
        </div>

        <ul className="nav nav-pills flex-column mb-auto overflow-auto flex-grow-1" style={{ overflowX: 'hidden' }}>
          <li className="nav-item">
            <NavLink to="/" className="nav-link" end>
              <i className="bi bi-grid-1x2"></i>
              <span className="ms-3">Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item mt-3 mb-1 px-3 text-uppercase text-muted sidebar-heading" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            <span className="heading-text">Content</span>
            <hr className="my-1 border-secondary heading-hr" />
          </li>
          <li className="nav-item">
            <NavLink to="/pages" className="nav-link">
              <i className="bi bi-file-earmark-text"></i>
              <span className="ms-3">Pages</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/about-page" className="nav-link">
              <i className="bi bi-person-lines-fill"></i>
              <span className="ms-3">About Page</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/services" className="nav-link">
              <i className="bi bi-briefcase"></i>
              <span className="ms-3">Services</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/packages" className="nav-link">
              <i className="bi bi-box-seam"></i>
              <span className="ms-3">Packages</span>
            </NavLink>
          </li>
          <li className="nav-item mt-3 mb-1 px-3 text-uppercase text-muted sidebar-heading" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            <span className="heading-text">Portfolio</span>
            <hr className="my-1 border-secondary heading-hr" />
          </li>
          <li className="nav-item">
            <NavLink to="/portfolio-categories" className="nav-link">
              <i className="bi bi-folder"></i>
              <span className="ms-3">Categories</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/portfolio-items" className="nav-link">
              <i className="bi bi-images"></i>
              <span className="ms-3">Items</span>
            </NavLink>
          </li>
          <li className="nav-item mt-3 mb-1 px-3 text-uppercase text-muted sidebar-heading" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            <span className="heading-text">SEO Modules</span>
            <hr className="my-1 border-secondary heading-hr" />
          </li>
          <li className="nav-item">
            <NavLink to="/cms/seo" className="nav-link">
              <i className="bi bi-search"></i>
              <span className="ms-3">SEO Management</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/seo-pages" className="nav-link">
              <i className="bi bi-diagram-3"></i>
              <span className="ms-3">pSEO Matrix</span>
            </NavLink>
          </li>
          <li className="nav-item mt-3 mb-1 px-3 text-uppercase text-muted sidebar-heading" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            <span className="heading-text">pSEO Dictionaries</span>
            <hr className="my-1 border-secondary heading-hr" />
          </li>
          <li className="nav-item">
            <NavLink to="/locations" className="nav-link">
              <i className="bi bi-geo-alt"></i>
              <span className="ms-3">Locations</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/industries" className="nav-link">
              <i className="bi bi-building"></i>
              <span className="ms-3">Industries</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/technologies" className="nav-link">
              <i className="bi bi-cpu"></i>
              <span className="ms-3">Technologies</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/problems" className="nav-link">
              <i className="bi bi-exclamation-triangle"></i>
              <span className="ms-3">Problems / Use Cases</span>
            </NavLink>
          </li>
        </ul>
        <div className="border-top p-3 sidebar-footer-profile">
          <div className="d-flex align-items-center text-decoration-none">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold sidebar-avatar flex-shrink-0" style={{ width: '32px', height: '32px' }}>
              A
            </div>
            <div className="ms-2 sidebar-profile-info">
              <div className="fw-bold text-nowrap" style={{ fontSize: '0.875rem' }}>Admin User</div>
              <div className="text-muted text-nowrap" style={{ fontSize: '0.75rem' }}>admin@example.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
