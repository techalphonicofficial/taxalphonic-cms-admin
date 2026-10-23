// URL to show / copy a stored file: cloud storage gives full https:// URLs, the local uploads/
// folder gives paths (/uploads/x.webp) served by the API (VITE_APP_URL).
export const MEDIA_BASE = (import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com').replace(/\/$/, '');

export function mediaUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  return `${MEDIA_BASE}/${value.replace(/^\/+/, '')}`;
}
