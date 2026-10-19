import api from './api';
export const BlogAuthorsService = {
  getAll: async (params) => (await api.get('/blog-authors', { params })).data,
  getById: async (id) => (await api.get('/blog-authors/' + id)).data,
  create: async (data) => (await api.post('/blog-authors', data)).data,
  update: async (id, data) => (await api.put('/blog-authors/' + id, data)).data,
  delete: async (id) => (await api.delete('/blog-authors/' + id)).data
};