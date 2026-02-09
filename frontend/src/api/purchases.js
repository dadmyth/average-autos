import api from './axios';

export const createPurchase = async (purchaseData) => {
  const response = await api.post('/purchases', purchaseData);
  return response.data.data;
};

export const getPurchaseByCarId = async (carId) => {
  const response = await api.get(`/purchases/car/${carId}`);
  return response.data.data;
};

export const deletePurchase = async (id) => {
  const response = await api.delete(`/purchases/${id}`);
  return response.data.data;
};

export default {
  createPurchase,
  getPurchaseByCarId,
  deletePurchase
};
