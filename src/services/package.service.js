import api from './api';

export const PackageService = {
  getAll: async (params) => (await api.get('/packages', { params })).data,
  getById: async (id) => (await api.get('/packages/' + id)).data,
  delete: async (id, force = false) => (await api.delete('/packages/' + id, { params: force ? { force: true } : {} })).data
};
