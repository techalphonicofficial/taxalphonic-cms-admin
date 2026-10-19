// Public website origin (VITE_SITE_URL), for "View on website" links.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://192.168.0.166:3000').replace(/\/$/, '');

/** Website URL of a slug or path, e.g. "india/seo-services-noida" → http://…/india/seo-services-noida. */
export const siteUrl = (path = '') => `${SITE_URL}/${String(path).replace(/^\/+/, '')}`;
