import React from 'react';
import { Outlet } from 'react-router-dom';
import RailMenu from '../components/layout/sidebar/RailMenu';
import SecondarySidebar from '../components/layout/sidebar/SecondarySidebar';
import Header from '../components/layout/Header';
import { useSidebar } from '../context/SidebarContext';

const SidebarContent = () => (
  <>
    <RailMenu />
    <SecondarySidebar />
  </>
);

const AdminLayout = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="d-flex w-100 vh-100 overflow-hidden bg-body-tertiary">
      {/* Desktop Dual Panel Sidebar System */}
      <div className="d-none d-md-flex h-100 position-relative" style={{ zIndex: 1060 }}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay (Custom to avoid Bootstrap JS conflicts with Filter Drawers) */}
      <div
        id="mobileSidebar"
        className={`custom-mobile-sidebar d-md-none ${isMobileOpen ? 'show' : ''}`}
        tabIndex="-1"
      >
        <div className="d-flex h-100 position-relative">
          <SidebarContent />
          {/* Close button for mobile */}
          <button
            className="btn btn-primary position-absolute top-0 start-100 m-2 rounded-circle shadow"
            onClick={toggleMobileSidebar}
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="offcanvas-backdrop fade show d-md-none" onClick={toggleMobileSidebar} style={{ zIndex: 1040 }}></div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, backgroundColor: 'var(--cms-body-bg)' }}>
        <Header toggleSidebar={toggleMobileSidebar} />

        <main className="p-4 flex-grow-1 overflow-y-scroll overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;