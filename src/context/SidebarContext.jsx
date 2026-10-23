import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingService from '../services/setting.service';

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  // Load preferences from localStorage or set defaults
  const [activeRailItem, setActiveRailItem] = useState(() => {
    const saved = localStorage.getItem('activeRailItem');
    // Packages moved under Services
    if (saved === 'packages') return 'services';
    return saved || 'dashboard';
  });
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSecondarySidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [pinnedMenus, setPinnedMenus] = useState(() => JSON.parse(localStorage.getItem('pinnedMenus')) || []);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [orgSettings, setOrgSettings] = useState({ name: 'Acme Corp', logo: null });

  useEffect(() => {
    const loadOrgSettings = async () => {
      try {
        const res = await SettingService.getGroupSettings('organization');
        const settings = res.data || {};
        
        let logoUrl = settings.logo || null;
        if (logoUrl && !logoUrl.startsWith('http')) {
          const baseUrl = import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com';
          logoUrl = logoUrl.startsWith('/') ? `${baseUrl}${logoUrl}` : `${baseUrl}/${logoUrl}`;
        }

        // Settings returns an object like { organizationName: '...', logo: '...' }
        setOrgSettings({
          name: settings.organizationName || settings.shortName || 'Acme Corp',
          logo: logoUrl
        });
      } catch (err) {
        console.error('Failed to load organization settings:', err);
      }
    };
    loadOrgSettings();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('activeRailItem', activeRailItem);
  }, [activeRailItem]);

  useEffect(() => {
    localStorage.setItem('isSecondarySidebarOpen', JSON.stringify(isSecondarySidebarOpen));
  }, [isSecondarySidebarOpen]);

  useEffect(() => {
    localStorage.setItem('pinnedMenus', JSON.stringify(pinnedMenus));
  }, [pinnedMenus]);

  const toggleSecondarySidebar = () => setIsSecondarySidebarOpen(!isSecondarySidebarOpen);
  
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const togglePin = (menuId) => {
    setPinnedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  return (
    <SidebarContext.Provider value={{
      activeRailItem,
      setActiveRailItem,
      isSecondarySidebarOpen,
      setIsSecondarySidebarOpen,
      toggleSecondarySidebar,
      isMobileOpen,
      setIsMobileOpen,
      toggleMobileSidebar,
      pinnedMenus,
      togglePin,
      orgSettings
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
