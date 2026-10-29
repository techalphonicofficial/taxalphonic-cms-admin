import api from './api';

export const AuthService = {
  login: async (credentials) => {
    // Extract rememberMe from credentials so it doesn't get sent to the backend
    const { rememberMe, ...apiCredentials } = credentials;
    const response = await api.post('/auth/login', apiCredentials);

    if (response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  /**
   * Reloads the logged-in user (role + current permissions) from GET /auth/me and stores it where
   * the login put it (local or session storage). Returns true when the permissions changed, so the
   * admin can re-render menus and buttons. An older backend without /auth/me: nothing changes.
   */
  refreshUser: async () => {
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage.getItem("user") ? sessionStorage : null;
    if (!storage) return false;
    const response = await api.get("/auth/me");
    const fresh = response.data?.data;
    if (!fresh?.role) return false;
    let current = {};
    try { current = JSON.parse(storage.getItem("user")) || {}; } catch { current = {}; }
    const key = (user) => JSON.stringify([user?.role?.name, (user?.role?.permissions || []).map((p) => `${p.action}:${p.module}`).sort()]);
    const changed = key(current) !== key(fresh);
    storage.setItem("user", JSON.stringify({ ...current, ...fresh, role: { ...(current.role || {}), ...fresh.role } }));
    return changed;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }
};
