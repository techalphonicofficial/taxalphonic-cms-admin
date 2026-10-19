import api from './api';

export const InquiryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/inquiries', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/inquiries/stats');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/inquiries/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/inquiries/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/inquiries/${id}`);
    return response.data;
  }
};
