import api from './api';
import { AuthService } from './auth.service';

// Landing pages on subdomains (backend routes/landingPageRoutes.js, permission module "LandingPages").
const data = (res) => res.data?.data;

export const LandingPageService = {
  serviceOptions: () => api.get('/landing-pages/service-options').then(data),
  checkSlug: (slug, exceptId) => api.get('/landing-pages/check-slug', { params: { slug, exceptId } }).then(data),
  get: (id) => api.get(`/landing-pages/${id}`).then(data),
  create: (body) => api.post('/landing-pages', body).then(data),
  updateSettings: (id, body) => api.put(`/landing-pages/${id}`, body).then(data),
  saveDraft: (id, sections) => api.put(`/landing-pages/${id}/draft`, { sections }).then(data),
  validate: (id) => api.get(`/landing-pages/${id}/validate`).then(data),
  publish: (id) => api.post(`/landing-pages/${id}/publish`).then(data),
  unpublish: (id) => api.post(`/landing-pages/${id}/unpublish`).then(data),
  archive: (id) => api.post(`/landing-pages/${id}/archive`).then(data),
  unarchive: (id) => api.post(`/landing-pages/${id}/unarchive`).then(data),
  versions: (id) => api.get(`/landing-pages/${id}/versions`).then(data),
  deleteVersion: (id, versionId) => api.delete(`/landing-pages/${id}/versions/${versionId}`).then(data),
  restoreVersion: (id, versionId) => api.post(`/landing-pages/${id}/versions/${versionId}/restore`).then(data),
  // "My themes": custom colour themes shared by all landing pages.
  themes: () => api.get('/landing-pages/themes').then(data),
  saveThemes: (themes) => api.put('/landing-pages/themes', { themes }).then(data),
};

/** "message" + field errors of a failed request, for a toast. */
export function apiErrorText(error, fallback = 'Something went wrong') {
  const body = error?.response?.data;
  const errors = Array.isArray(body?.errors) ? body.errors.map((e) => e.message || e.msg).filter(Boolean) : [];
  const message = body?.message || error?.message || fallback;
  return errors.length ? `${message}: ${[...new Set(errors)].slice(0, 4).join(' · ')}` : message;
}

/** Permission check for buttons (same rule as HasPermission: the Admin role may do everything). */
export function canLanding(action) {
  const user = AuthService.getCurrentUser();
  if (!user) return false;
  if (user.role?.name === 'Admin') return true;
  return (user.role?.permissions || []).some((p) => p.module === 'LandingPages' && p.action === action);
}
