import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { canOpen, firstAllowedPath } from '../utils/permissions';
import RailMenu from '../components/layout/sidebar/RailMenu';
import SecondarySidebar from '../components/layout/sidebar/SecondarySidebar';
import Header from '../components/layout/Header';
import { useSidebar } from '../context/SidebarContext';
import { LeadNotificationsProvider } from '../context/LeadNotificationsContext';

const SidebarContent = () => (
  <>
    <RailMenu />
    <SecondarySidebar />
  </>
);

/**
 * Keeps two variables on <main> (global.scss):
 * --ta-bar-h: height of the page's sticky editor header (.ta-editor-bar), where the sticky editor
 *   tabs (.ta-sticky-tabs) sit;
 * --ta-sticky-offset: header + tabs, 0 when there are none, so sticky side panels sit below both.
 */
const useEditorBarOffset = (mainRef) => {
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    let bar = null;
    let tabs = null;
    let frame = 0;
    const write = () => {
      const barH = bar ? Math.round(bar.offsetHeight) : 0;
      const tabsH = tabs ? Math.round(tabs.offsetHeight) : 0;
      main.style.setProperty('--ta-bar-h', `${barH}px`);
      main.style.setProperty('--ta-sticky-offset', `${barH + tabsH}px`);
    };
    const sizeObserver = new ResizeObserver(write);
    const track = (current, next) => {
      if (next === current) return current;
      if (current) sizeObserver.unobserve(current);
      if (next) sizeObserver.observe(next);
      return next;
    };
    const update = () => {
      frame = 0;
      const nextBar = main.querySelector('.ta-editor-bar');
      const nextTabs = main.querySelector('.ta-sticky-tabs');
      if (nextBar === bar && nextTabs === tabs) return;
      bar = track(bar, nextBar);
      tabs = track(tabs, nextTabs);
      write();
    };
    // Pages render their header after loading, so look again when <main>'s content changes.
    const domObserver = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(update); });
    domObserver.observe(main, { childList: true, subtree: true });
    update();
    return () => {
      domObserver.disconnect();
      sizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mainRef]);
};

const AdminLayout = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const mainRef = useRef(null);
  const location = useLocation();
  const [, setPermissionsVersion] = useState(0);
  useEditorBarOffset(mainRef);

  // The role's permissions are saved at login; load them again on every start so a role change
  // shows at once. When they changed, re-render: menus, buttons and the page guard below follow.
  useEffect(() => {
    AuthService.refreshUser()
      .then((changed) => { if (changed) setPermissionsVersion((v) => v + 1); })
      .catch(() => {});
  }, []);

  // Page guard for every admin page (utils/permissions.js ROUTES): no permission, no page.
  // The dashboard is the start page, so a user who may not see it lands on their first allowed page.
  if (!canOpen(location.pathname)) {
    return <Navigate to={location.pathname === '/' ? firstAllowedPath() : '/unauthorized'} replace />;
  }

  // LeadNotificationsProvider: new-lead ring / alerts on every admin page (the Header bell shows them).
  return (
    <LeadNotificationsProvider>
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

        <main ref={mainRef} className="p-4 flex-grow-1 overflow-y-scroll overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
    </LeadNotificationsProvider>
  );
};
export default AdminLayout;