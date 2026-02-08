import api from './axios';

export const getStatistics = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getProfitLoss = async () => {
  const response = await api.get('/dashboard/profit-loss');
  return response.data;
};

export const getExpiryAlerts = async () => {
  const response = await api.get('/dashboard/expiry-alerts');
  return response.data;
};

export const getAgingStock = async () => {
  const response = await api.get('/dashboard/aging-stock');
  return response.data;
};

export const getMonthlySales = async () => {
  const response = await api.get('/dashboard/monthly-sales');
  return response.data;
};

export default {
  getStatistics,
  getProfitLoss,
  getExpiryAlerts,
  getMonthlySales
};
