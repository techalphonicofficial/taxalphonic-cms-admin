import api from './api';

export const ProfileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },
  changePassword: async (data) => {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  }
};
