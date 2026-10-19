import api from './api';

export const AuditLogService = {
  getAll: async (params) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },
  getFilters: async () => {
    const response = await api.get('/audit-logs/filters');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  }
};
