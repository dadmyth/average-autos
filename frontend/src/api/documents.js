import api from './axios';

export const uploadDocuments = async (carId, files, documentType) => {
  const formData = new FormData();
  files.forEach(file => formData.append('documents', file));
  formData.append('documentType', documentType);

  const response = await api.post(`/documents/${carId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getDocuments = async (carId) => {
  const response = await api.get(`/documents/${carId}`);
  return response.data;
};

export const deleteDocument = async (carId, filename) => {
  const response = await api.delete(`/documents/${carId}/${filename}`);
  return response.data;
};

export default {
  uploadDocuments,
  getDocuments,
  deleteDocument
};
