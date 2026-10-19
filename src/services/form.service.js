import api from './api';

export const FormService = {
  getAll: async (params) => (await api.get('/forms', { params })).data,
  getById: async (id) => (await api.get('/forms/' + id)).data,
  create: async (data) => (await api.post('/forms', data)).data,
  update: async (id, data) => (await api.put('/forms/' + id, data)).data,
  duplicate: async (id) => (await api.post(`/forms/${id}/duplicate`)).data,
  delete: async (id, force = false) => (await api.delete('/forms/' + id, { params: force ? { force: true } : {} })).data
};
