import api from './api';

export const ServiceCategoryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/service-categories', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/service-categories/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/service-categories', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/service-categories/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/service-categories/${id}`);
    return response.data;
  }
};
