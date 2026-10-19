import api from './api';

export const PortfolioCategoryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/portfolio-categories', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/portfolio-categories/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/portfolio-categories', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/portfolio-categories/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/portfolio-categories/${id}`);
    return response.data;
  }
};
