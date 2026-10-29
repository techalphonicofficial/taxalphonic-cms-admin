export const railMenuData = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2', path: '/', permission: { action: 'read', module: 'Dashboard' } },
  { id: 'accessControl', label: 'Access Control', icon: 'bi-shield-lock', path: '/users', permission: { action: 'read', module: 'Users' } },
  { id: 'cms', label: 'CMS', icon: 'bi-file-earmark-text', path: '/pages', permission: { action: 'read', module: 'CMS' } },
  { id: 'services', label: 'Services', icon: 'bi-briefcase', path: '/services', permission: { action: 'read', module: 'Services' } },
  { id: 'landing', label: 'Landing Pages', icon: 'bi-window-stack', path: '/landing-pages', permission: { action: 'read', module: 'LandingPages' } },
  { id: 'portfolio', label: 'Portfolio', icon: 'bi-collection', path: '/portfolio-items', permission: { action: 'read', module: 'Portfolio' } },
  { id: 'blog', label: 'Blog', icon: 'bi-journal-richtext', path: '/blogs', permission: { action: 'read', module: 'Blogs' } },
  { id: 'seo', label: 'SEO', icon: 'bi-search', path: '/cms/seo', badge: 'New', permission: { action: 'read', module: 'SEO' } },
  { id: 'media', label: 'Media', icon: 'bi-images', path: '/media', permission: { action: 'read', module: 'Media' } },
  { id: 'crm', label: 'CRM', icon: 'bi-people', path: '/crm/leads', permission: { action: 'read', module: 'CRM' } },
  { id: 'trash', label: 'Trash', icon: 'bi-trash3', path: '/trash' },
  { id: 'logs', label: 'Audit Logs', icon: 'bi-journal-check', path: '/audit-logs', permission: { action: 'read', module: 'AuditLogs' } },
  { id: 'settings', label: 'Settings', icon: 'bi-gear', path: '/settings', permission: { action: 'read', module: 'Settings' } },
];

export const secondaryMenuData = {
  accessControl: [
    {
      group: 'Identity & Access',
      items: [
        { label: 'Users', path: '/users', icon: 'bi-person', permission: { action: 'read', module: 'Users' } },
        { label: 'Roles', path: '/roles', icon: 'bi-person-badge', permission: { action: 'read', module: 'Roles' } },
        { label: 'Permissions', path: '/permissions', icon: 'bi-key', permission: { action: 'read', module: 'Permissions' } },
      ]
    }
  ],
  // Deleted services, pages, SEO pages / configs, blogs, categories, forms and menus (restore or delete forever).
  trash: [
    {
      group: 'Recycle Bin',
      items: [
        { label: 'Trash', path: '/trash', icon: 'bi-trash3' },
      ]
    }
  ],
  logs: [
    {
      group: 'Activity',
      items: [
        { label: 'Audit Logs', path: '/audit-logs', icon: 'bi-journal-check', permission: { action: 'read', module: 'AuditLogs' } },
      ]
    },
    {
      group: 'System Logs',
      items: [
        { label: 'General Logs', path: '/system-logs/general', icon: 'bi-activity', permission: { action: 'read', module: 'SystemLogs' } },
        { label: 'Error Logs', path: '/system-logs/error', icon: 'bi-bug', permission: { action: 'read', module: 'SystemLogs' } },
      ]
    }
  ],
  cms: [
    {
      group: 'Content Management',
      items: [
        { label: 'Home Page', path: '/pages/home', icon: 'bi-house-door', permission: { action: 'update', module: 'CMS' } },
        { label: 'All Pages', path: '/pages', icon: 'bi-file-earmark', permission: { action: 'read', module: 'CMS' } },
        { label: 'Add New Page', path: '/pages/new', icon: 'bi-plus-circle', permission: { action: 'create', module: 'CMS' } },
        { label: 'New Journey Stage', path: '/pages/new?template=journey', icon: 'bi-signpost-split', permission: { action: 'create', module: 'CMS' } },
        { label: 'New Free Tool', path: '/pages/new?template=tool', icon: 'bi-calculator', permission: { action: 'create', module: 'CMS' } },
        { label: 'Menus & Navigation', path: '/pages/menus', icon: 'bi-list-nested', permission: { action: 'read', module: 'CMS' } },
      ]
    },
    {
      group: 'Dynamic Content',
      items: [
        { label: 'About Page', path: '/about-page', icon: 'bi-person-lines-fill', permission: { action: 'read', module: 'CMS' } },
        { label: 'Testimonials', path: '/cms/testimonials', icon: 'bi-chat-quote', permission: { action: 'read', module: 'CMS' } },
        { label: 'Team Members', path: '/cms/team', icon: 'bi-person-badge', permission: { action: 'read', module: 'CMS' } },
        { label: 'FAQs', path: '/cms/faqs', icon: 'bi-question-circle', permission: { action: 'read', module: 'CMS' } },
        { label: 'Banners', path: '/cms/banners', icon: 'bi-images', permission: { action: 'read', module: 'CMS' } },
        { label: 'Branches', path: '/cms/branches', icon: 'bi-building', permission: { action: 'read', module: 'CMS' } },
        { label: 'Partners & Clients', path: '/cms/partners', icon: 'bi-people', permission: { action: 'read', module: 'CMS' } },
        { label: 'Global Presence', path: '/cms/countries', icon: 'bi-globe', permission: { action: 'read', module: 'CMS' } },
      ]
    }
  ],
  // Service landing pages at services.taxalphonic.com/lp/<name>, pages/landing.
  landing: [
    {
      group: 'Landing Pages',
      items: [
        { label: 'All Landing Pages', path: '/landing-pages', icon: 'bi-window-stack', permission: { action: 'read', module: 'LandingPages' } },
        { label: 'New Landing Page', path: '/landing-pages/new', icon: 'bi-plus-circle', permission: { action: 'create', module: 'LandingPages' } },
        { label: 'Thank-you Page & Tracking', path: '/landing-pages/thank-you', icon: 'bi-bullseye', permission: { action: 'read', module: 'LandingPages' } },
      ]
    }
  ],
  services: [
    {
      group: 'Service Management',
      items: [
        { label: 'All Services', path: '/services', icon: 'bi-briefcase', permission: { action: 'read', module: 'Services' } },
        { label: 'Add Service', path: '/services/new', icon: 'bi-plus-circle', permission: { action: 'create', module: 'Services' } },
        { label: 'Forms', path: '/forms', icon: 'bi-ui-checks', permission: { action: 'read', module: 'Forms' } },
        { label: 'Packages', path: '/packages', icon: 'bi-box-seam', permission: { action: 'read', module: 'Packages' } },
        { label: 'Add Package', path: '/packages/new', icon: 'bi-plus-square', permission: { action: 'create', module: 'Packages' } },
        { label: 'Old Data', path: '/services?category=fd630088-6d13-47eb-a5b9-9de555ec5e82', icon: 'bi-archive', permission: { action: 'read', module: 'Services' } },
        { label: 'Service Categories', path: '/service-categories', icon: 'bi-tags', permission: { action: 'read', module: 'Services' } },
      ]
    }
  ],
  portfolio: [
    {
      group: 'Portfolio Management',
      items: [
        { label: 'All Items', path: '/portfolio-items', icon: 'bi-images', permission: { action: 'read', module: 'Portfolio' } },
        { label: 'Add New Item', path: '/portfolio-items/new', icon: 'bi-plus-circle', permission: { action: 'create', module: 'Portfolio' } },
        { label: 'Categories', path: '/portfolio-categories', icon: 'bi-tags', permission: { action: 'read', module: 'Portfolio' } },
      ]
    }
  ],
  settings: [
    {
      group: 'General Settings',
      items: [
        { label: 'Organization', path: '/settings/organization', icon: 'bi-building', permission: { action: 'read', module: 'Settings' } },
        { label: 'Contact', path: '/settings/contact', icon: 'bi-telephone', permission: { action: 'read', module: 'Settings' } },
        { label: 'Address', path: '/settings/address', icon: 'bi-geo-alt', permission: { action: 'read', module: 'Settings' } },
        { label: 'Social Media', path: '/settings/social', icon: 'bi-share', permission: { action: 'read', module: 'Settings' } },
        { label: 'Website', path: '/settings/website', icon: 'bi-globe', permission: { action: 'read', module: 'Settings' } },
      ]
    },
    {
      group: 'Operations',
      items: [
        { label: 'SEO', path: '/settings/seo', icon: 'bi-search', permission: { action: 'read', module: 'Settings' } },
        { label: 'SMTP', path: '/settings/smtp', icon: 'bi-envelope', permission: { action: 'read', module: 'Settings' } },
        { label: 'SMS & WhatsApp', path: '/settings/sms-whatsapp', icon: 'bi-chat-dots', permission: { action: 'read', module: 'Settings' } },
        { label: 'Payment', path: '/settings/payment', icon: 'bi-credit-card', permission: { action: 'read', module: 'Settings' } },
        { label: 'Shipping', path: '/settings/shipping', icon: 'bi-truck', permission: { action: 'read', module: 'Settings' } },
        { label: 'Media', path: '/settings/media', icon: 'bi-images', permission: { action: 'read', module: 'Settings' } },
      ]
    },
    {
      group: 'System',
      items: [
        { label: 'Security', path: '/settings/security', icon: 'bi-shield-lock', permission: { action: 'read', module: 'Settings' } },
        { label: 'Analytics', path: '/settings/analytics', icon: 'bi-graph-up', permission: { action: 'read', module: 'Settings' } },
        { label: 'Invoice', path: '/settings/invoice', icon: 'bi-receipt', permission: { action: 'read', module: 'Settings' } },
        { label: 'Notifications', path: '/settings/notifications', icon: 'bi-bell', permission: { action: 'read', module: 'Settings' } },
        { label: 'API', path: '/settings/api', icon: 'bi-plug', permission: { action: 'read', module: 'Settings' } },
        { label: 'Backup', path: '/settings/backup', icon: 'bi-cloud-arrow-up', permission: { action: 'read', module: 'Settings' } },
        { label: 'Custom Code', path: '/settings/custom-code', icon: 'bi-code-slash', permission: { action: 'read', module: 'Settings' } },
        { label: 'Legal', path: '/settings/legal', icon: 'bi-file-earmark-text', permission: { action: 'read', module: 'Settings' } },
        { label: 'System Info', path: '/settings/system-info', icon: 'bi-info-circle', permission: { action: 'read', module: 'Settings' } },
      ]
    }
  ],
  dashboard: [
    {
      group: 'Overview',
      items: [
        { label: 'Analytics', path: '/', icon: 'bi-graph-up', permission: { action: 'read', module: 'Dashboard' } },
        // { label: 'Real-time', path: '/dashboard/realtime', icon: 'bi-activity', permission: { action: 'read', module: 'Dashboard' } },
      ]
    }
  ],
  media: [
    {
      group: 'Media Management',
      items: [
        { label: 'Media Library', path: '/media', icon: 'bi-images', permission: { action: 'read', module: 'Media' } },
        // Where uploads are stored: project folder (default) or a cloud provider (S3, R2, ...).
        { label: 'Media Settings', path: '/media/settings', icon: 'bi-cloud-arrow-up', permission: { action: 'update', module: 'Media' } },
      ]
    }
  ],
  seo: [
    {
      group: 'SEO Management',
      items: [
        { label: 'SEO Configs', path: '/cms/seo', icon: 'bi-search', permission: { action: 'read', module: 'SEO' } },
        { label: 'Add SEO Config', path: '/cms/seo/new', icon: 'bi-plus-circle', permission: { action: 'create', module: 'SEO' } },
        { label: 'Robots.txt', path: '/seo/robots', icon: 'bi-file-earmark-text', permission: { action: 'read', module: 'SEO' } },
      ]
    },
    {
      group: 'pSEO Matrix',
      items: [
        { label: 'Matrix Generator', path: '/seo-pages', icon: 'bi-diagram-3', permission: { action: 'read', module: 'SEO' } },
        { label: 'AI Settings', path: '/seo-pages/ai-settings', icon: 'bi-robot', permission: { action: 'read', module: 'SEO' } },
        { label: 'Locations', path: '/locations', icon: 'bi-geo-alt', permission: { action: 'read', module: 'SEO' } },
        { label: 'States', path: '/states', icon: 'bi-geo-alt', permission: { action: 'read', module: 'SEO' } },
        { label: 'Industries', path: '/industries', icon: 'bi-building', permission: { action: 'read', module: 'SEO' } },
        { label: 'Technologies', path: '/technologies', icon: 'bi-cpu', permission: { action: 'read', module: 'SEO' } },
        { label: 'Problems', path: '/problems', icon: 'bi-exclamation-triangle', permission: { action: 'read', module: 'SEO' } },
      ]
    }
  ],
  blog: [
    {
      group: 'Content',
      items: [
        { label: 'Dashboard', path: '/blogs/dashboard', icon: 'bi-speedometer2', permission: { action: 'read', module: 'Blogs' } },
        { label: 'All Blogs', path: '/blogs', icon: 'bi-journal-text', permission: { action: 'read', module: 'Blogs' } },
        { label: 'Add Blog Post', path: '/blogs/new', icon: 'bi-plus-circle', permission: { action: 'create', module: 'Blogs' } },
        { label: 'Comments', path: '/blogs/comments', icon: 'bi-chat-square-text', permission: { action: 'read', module: 'Blogs' } },
      ]
    },
    {
      group: 'Taxonomy',
      items: [
        { label: 'Categories', path: '/blog-categories', icon: 'bi-tags', permission: { action: 'read', module: 'Blogs' } },
        { label: 'Tags', path: '/blog-tags', icon: 'bi-hash', permission: { action: 'read', module: 'Blogs' } },
        { label: 'Authors', path: '/blog-authors', icon: 'bi-people', permission: { action: 'read', module: 'Blogs' } },
      ]
    }
  ],
  crm: [
    {
      group: 'Lead Management',
      items: [
        { label: 'All Inquiries / Leads', path: '/crm/leads', icon: 'bi-inbox', permission: { action: 'read', module: 'CRM' } },
        { label: 'New Inquiries', path: '/crm/leads?status=NEW', icon: 'bi-bell', permission: { action: 'read', module: 'CRM' } },
        { label: 'In Follow-Up', path: '/crm/leads?status=IN_PROGRESS', icon: 'bi-hourglass-split', permission: { action: 'read', module: 'CRM' } },
        { label: 'Converted', path: '/crm/leads?status=CONVERTED', icon: 'bi-check2-circle', permission: { action: 'read', module: 'CRM' } },
      ]
    }
  ]
};
