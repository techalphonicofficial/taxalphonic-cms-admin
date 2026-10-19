import api from './api';
export const BlogCategoriesService = {
  getAll: async (params) => (await api.get('/blog-categories', { params })).data,
  getById: async (id) => (await api.get('/blog-categories/' + id)).data,
  create: async (data) => (await api.post('/blog-categories', data)).data,
  update: async (id, data) => (await api.put('/blog-categories/' + id, data)).data,
  delete: async (id) => (await api.delete('/blog-categories/' + id)).data
};