import api from './api';
export const BlogTagsService = {
  getAll: async (params) => (await api.get('/blog-tags', { params })).data,
  getById: async (id) => (await api.get('/blog-tags/' + id)).data,
  create: async (data) => (await api.post('/blog-tags', data)).data,
  update: async (id, data) => (await api.put('/blog-tags/' + id, data)).data,
  delete: async (id) => (await api.delete('/blog-tags/' + id)).data
};