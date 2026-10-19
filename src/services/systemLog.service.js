import api from './api';

// type: 'general' | 'error'
export const SystemLogService = {
  getEntries: async (type, params) => (await api.get(`/system-logs/${type}`, { params })).data,
  clear: async (type) => (await api.delete(`/system-logs/${type}`)).data,
  download: async (type) => {
    // Fetched through axios so the auth header is sent, then saved as a file
    const response = await api.get(`/system-logs/${type}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'error' ? 'errorlogs' : 'generallogs'}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
