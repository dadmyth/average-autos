import api from './axios';

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data.data;
};

export const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.put('/settings/password', passwordData);
  return response.data;
};
