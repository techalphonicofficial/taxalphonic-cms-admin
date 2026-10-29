import { AuthService } from '../services/auth.service';

/*
 * One place for "may this user do / open that?" in the admin.
 *
 * - can(action, module): the logged-in user's role allows `action` on `module`. `module` may be a
 *   list: any one is enough, exactly like the backend's checkPermission (routes list the sidebar
 *   module and the specific one, e.g. ['CMS', 'FAQs']). The Admin role may do everything.
 * - ROUTES: every admin page with the permission it needs (same modules as the backend route
 *   that page calls). AdminLayout sends a user without it to /unauthorized, the sidebars and
 *   PermLink hide links to it, ActionColumn / DataGrid hide Edit / Duplicate / Delete on a list
 *   page whose module the user may not change. Add new pages here.
 * The backend checks every request again, so this is about showing only what works.
 */

export const M = {
  pages: ['CMS', 'Pages'],
  menus: ['CMS', 'Menus'],
  about: ['CMS', 'AboutPage'],
  banners: ['CMS', 'Banners'],
  branches: ['CMS', 'Branches'],
  countries: ['CMS', 'Countries'],
  faqs: ['CMS', 'FAQs'],
  partners: ['CMS', 'Partners'],
  team: ['CMS', 'TeamMembers'],
  testimonials: ['CMS', 'Testimonials'],
  pageCategories: 'PageCategories',
  services: 'Services',
  serviceCategories: ['Services', 'ServiceCategories'],
  packages: 'Packages',
  forms: 'Forms',
  landing: 'LandingPages',
  blogs: 'Blogs',
  blogCategories: ['Blogs', 'BlogCategories'],
  blogTags: ['Blogs', 'BlogTags'],
  blogAuthors: ['Blogs', 'BlogAuthors'],
  portfolioCategories: ['Portfolio', 'PortfolioCategories'],
  portfolioItems: ['Portfolio', 'PortfolioItems'],
  seo: 'SEO',
  seoPages: ['SEO', 'SEOPages'],
  locations: ['SEO', 'Locations'],
  states: ['SEO', 'States'],
  industries: ['SEO', 'Industries'],
  technologies: ['SEO', 'Technologies'],
  problems: ['SEO', 'Problems'],
  leads: ['CRM', 'Inquiries'],
  media: 'Media',
  settings: 'Settings',
  users: 'Users',
  roles: 'Roles',
  permissions: 'Permissions',
  auditLogs: 'AuditLogs',
  systemLogs: 'SystemLogs',
  dashboard: 'Dashboard',
};

// Trash lists a module when its read or delete permission is there (backend TrashController).
const TRASH_MODULES = ['Services', 'CMS', 'SEO', 'Blogs', 'Forms', 'Menus', 'Media'];

export const currentUser = () => AuthService.getCurrentUser();
export const isAdmin = (user = currentUser()) => user?.role?.name === 'Admin';

export function can(action, module, user = currentUser()) {
  if (!user?.role) return false;
  if (isAdmin(user)) return true;
  const modules = Array.isArray(module) ? module : [module];
  return (user.role.permissions || []).some((p) => p.action === action && modules.includes(p.module));
}

/** A list page and its new / edit pages: [list path, module, extra pages]. */
const crud = (path, module, { newPath = `${path}/new`, editPath = `${path}/edit/:id` } = {}) => [
  { path, action: 'read', module },
  { path: newPath, action: 'create', module },
  { path: editPath, action: 'update', module },
];

// Order matters only for readability: paths are matched exactly (":x" = one segment).
export const ROUTES = [
  { path: '/', action: 'read', module: M.dashboard },
  { path: '/profile', open: true },
  { path: '/unauthorized', open: true },
  ...crud('/users', M.users),
  ...crud('/roles', M.roles),
  ...crud('/permissions', M.permissions),
  { path: '/audit-logs', action: 'read', module: M.auditLogs },
  { path: '/system-logs/:type', action: 'read', module: M.systemLogs },
  { path: '/trash', any: TRASH_MODULES.flatMap((m) => [['read', m], ['delete', m]]) },
  ...crud('/pages', M.pages),
  { path: '/pages/home', action: 'update', module: M.pages },
  ...crud('/pages/categories', M.pageCategories),
  ...crud('/pages/menus', M.menus),
  ...crud('/services', M.services),
  ...crud('/services/categories', M.serviceCategories),
  ...crud('/service-categories', M.serviceCategories),
  ...crud('/packages', M.packages),
  ...crud('/forms', M.forms),
  { path: '/landing-pages', action: 'read', module: M.landing },
  { path: '/landing-pages/new', action: 'create', module: M.landing },
  { path: '/landing-pages/thank-you', action: 'read', module: M.landing },
  { path: '/landing-pages/edit/:id', action: 'read', module: M.landing },
  { path: '/blogs/dashboard', action: 'read', module: M.blogs },
  { path: '/blogs/comments', action: 'read', module: M.blogs },
  ...crud('/blogs', M.blogs),
  ...crud('/blog-categories', M.blogCategories),
  ...crud('/blog-tags', M.blogTags),
  ...crud('/blog-authors', M.blogAuthors),
  ...crud('/cms/testimonials', M.testimonials),
  ...crud('/cms/team', M.team),
  ...crud('/cms/faqs', M.faqs),
  ...crud('/cms/banners', M.banners),
  ...crud('/cms/branches', M.branches),
  ...crud('/cms/partners', M.partners),
  ...crud('/cms/countries', M.countries),
  ...crud('/portfolio-categories', M.portfolioCategories),
  ...crud('/portfolio-items', M.portfolioItems),
  ...crud('/cms/seo', M.seo),
  { path: '/seo/robots', action: 'read', module: M.seo },
  { path: '/seo-pages', action: 'read', module: M.seo },
  { path: '/seo-pages/new', action: 'create', module: M.seoPages },
  { path: '/seo-pages/edit/:id', action: 'update', module: M.seoPages },
  { path: '/seo-pages/ai-settings', action: 'read', module: M.seo },
  ...crud('/locations', M.locations),
  ...crud('/states', M.states),
  ...crud('/industries', M.industries),
  ...crud('/technologies', M.technologies),
  ...crud('/problems', M.problems),
  { path: '/media', action: 'read', module: M.media },
  { path: '/media/settings', action: 'read', module: M.media },
  { path: '/about-page', action: 'read', module: M.about },
  { path: '/settings', action: 'read', module: M.settings },
  { path: '/settings/:group', action: 'read', module: M.settings },
  { path: '/crm', action: 'read', module: M.leads },
  { path: '/crm/leads', action: 'read', module: M.leads },
];

const COMPILED = ROUTES.map((route) => ({
  ...route,
  re: new RegExp(`^${route.path.replace(/\/:[^/]+/g, '/[^/]+')}/?$`),
}));

const pathOf = (to) => String(to || '').split(/[?#]/)[0] || '/';

/** The ROUTES entry of an admin path ("/cms/faqs/edit/5?x=1" → the FAQs edit page), or null. */
export function routeFor(to) {
  const path = pathOf(to);
  return COMPILED.find((route) => route.re.test(path)) || null;
}

/** True when the user may open that admin page (unknown pages are allowed: the API still checks). */
export function canOpen(to, user = currentUser()) {
  const route = routeFor(to);
  if (!route || route.open) return true;
  if (route.any) return route.any.some(([action, module]) => can(action, module, user));
  return can(route.action, route.module, user);
}

/**
 * Module of a list page (where its Edit / Delete buttons live), for ActionColumn and DataGrid:
 * the module of the list route, or of the record page it belongs to.
 */
export function listModuleFor(to) {
  const route = routeFor(to);
  return route && !route.open && !route.any ? route.module : null;
}

/** May the user do `action` on the records of the list page at `to`? (unknown page: yes) */
export function canOnPage(action, to, user = currentUser()) {
  const module = listModuleFor(to);
  return module ? can(action, module, user) : true;
}

// Where to land when the dashboard is not allowed: the first page of the sidebar order the user may open.
const LANDING_ORDER = [
  '/', '/crm/leads', '/services', '/pages', '/landing-pages', '/blogs', '/cms/seo', '/seo-pages', '/media',
  '/portfolio-items', '/forms', '/packages', '/users', '/roles', '/settings', '/audit-logs', '/profile',
];
export function firstAllowedPath(user = currentUser()) {
  return LANDING_ORDER.find((path) => canOpen(path, user)) || '/profile';
}
