import api from './api';

export const PermissionService = {
  getAll: async (params) => {
    const response = await api.get('/permissions', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/permissions', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/permissions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
  }
};
