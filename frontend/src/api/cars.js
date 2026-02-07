import api from './axios';

export const getCars = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);

  const response = await api.get(`/cars?${params.toString()}`);
  return response.data;
};

export const getCar = async (id) => {
  const response = await api.get(`/cars/${id}`);
  return response.data;
};

export const createCar = async (carData) => {
  const response = await api.post('/cars', carData);
  return response.data;
};

export const updateCar = async (id, carData) => {
  const response = await api.put(`/cars/${id}`, carData);
  return response.data;
};

export const deleteCar = async (id) => {
  const response = await api.delete(`/cars/${id}`);
  return response.data;
};

export const uploadPhotos = async (carId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('photos', file));

  const response = await api.post(`/cars/${carId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deletePhoto = async (carId, filename) => {
  const response = await api.delete(`/cars/${carId}/photos/${filename}`);
  return response.data;
};

export const addServiceRecord = async (carId, serviceData) => {
  const response = await api.post(`/cars/${carId}/services`, serviceData);
  return response.data;
};

export const updateServiceRecord = async (serviceId, serviceData) => {
  const response = await api.put(`/cars/services/${serviceId}`, serviceData);
  return response.data;
};

export const deleteServiceRecord = async (serviceId) => {
  const response = await api.delete(`/cars/services/${serviceId}`);
  return response.data;
};

export default {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  uploadPhotos,
  deletePhoto,
  addServiceRecord,
  updateServiceRecord,
  deleteServiceRecord
};
