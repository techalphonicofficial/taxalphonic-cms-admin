import api from './api';

const SettingService = {
  getGroupSettings: async (group) => {
    try {
      const response = await api.get(`/settings/${group}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateGroupSettings: async (group, data) => {
    try {
      const response = await api.put(`/settings/${group}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default SettingService;
