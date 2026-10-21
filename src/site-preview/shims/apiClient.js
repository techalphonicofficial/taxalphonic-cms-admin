// The website's server-side apiClient, run from the admin's browser against the same backend
// (VITE_APP_URL). GET responses are kept for a minute so typing in the builder does not refetch
// forms, packages and module records on every change; clearApiCache() empties it (Reload button).
const baseUrl = (import.meta.env.VITE_APP_URL || (import.meta.env.VITE_API_URL || '').replace(/\/api\/v\d+\/?$/, '')).replace(/\/$/, '');
const TTL = 60 * 1000;
const cache = new Map();

export const clearApiCache = () => cache.clear();

async function request(path, options) {
  // Next-only fetch options (cache: "no-store", next: { revalidate }) mean nothing here.
  const { cache: _cache, next: _next, ...init } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.body = await response.json().catch(() => null);
    throw error;
  }

  return response.json();
}

export async function apiClient(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') return request(path, options);

  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = request(path, options);
  cache.set(path, { at: Date.now(), promise });
  promise.catch(() => cache.delete(path));
  return promise;
}
