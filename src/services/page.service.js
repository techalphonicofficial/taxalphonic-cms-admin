import api from './api';

export const PageService = {
  getAll: async (params = {}) => {
    const response = await api.get('/pages', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/pages/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/pages', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/pages/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/pages/${id}`);
    return response.data;
  }
};
