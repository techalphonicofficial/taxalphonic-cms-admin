import api from './api';

export const PortfolioItemService = {
  getAll: async (params = {}) => {
    const response = await api.get('/portfolio-items', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/portfolio-items/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/portfolio-items', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/portfolio-items/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/portfolio-items/${id}`);
    return response.data;
  }
};
