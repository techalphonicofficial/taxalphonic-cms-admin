import api from './api';

export const BlogService = {
  getAll: async (params) => {
    const response = await api.get('/blogs', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/blogs/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/blogs', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/blogs/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data;
  },

  bulkAction: async (data) => {
    const response = await api.post('/blogs/bulk-action', data);
    return response.data;
  }
};
