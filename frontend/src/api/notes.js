import api from './axios';

export const getNotesByCarId = async (carId) => {
  const response = await api.get(`/notes/car/${carId}`);
  return response.data.data;
};

export const createNote = async (carId, note) => {
  const response = await api.post(`/notes/car/${carId}`, { note });
  return response.data.data;
};

export const updateNote = async (id, note) => {
  const response = await api.put(`/notes/${id}`, { note });
  return response.data.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data.data;
};

export default {
  getNotesByCarId,
  createNote,
  updateNote,
  deleteNote
};
