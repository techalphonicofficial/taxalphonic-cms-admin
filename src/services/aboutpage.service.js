import api from './api';

class AboutPageService {
  async getSettings() {
    try {
      const response = await api.get('/about-page');
      return response.data;
    } catch (error) {
      console.error('Error fetching about page settings:', error);
      throw error;
    }
  }

  async updateSettings(data) {
    try {
      let config = {};
      if (data instanceof FormData) {
        config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      }
      const response = await api.put('/about-page', data, config);
      return response.data;
    } catch (error) {
      console.error('Error updating about page settings:', error);
      throw error;
    }
  }
}

export default new AboutPageService();
