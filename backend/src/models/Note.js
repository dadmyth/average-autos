import { dbRun, dbAll, dbGet } from '../config/database.js';

export const createNote = async (carId, note) => {
  const result = await dbRun(
    'INSERT INTO activity_notes (car_id, note) VALUES (?, ?)',
    [carId, note]
  );
  return getNoteById(result.lastID);
};

export const getNoteById = async (id) => {
  return dbGet('SELECT * FROM activity_notes WHERE id = ?', [id]);
};

export const getNotesByCarId = async (carId) => {
  return dbAll(
    'SELECT * FROM activity_notes WHERE car_id = ? ORDER BY created_at DESC',
    [carId]
  );
};

export const deleteNote = async (id) => {
  const note = await getNoteById(id);
  if (!note) {
    throw new Error('Note not found');
  }
  await dbRun('DELETE FROM activity_notes WHERE id = ?', [id]);
  return note;
};

export const updateNote = async (id, note) => {
  await dbRun(
    'UPDATE activity_notes SET note = ? WHERE id = ?',
    [note, id]
  );
  return getNoteById(id);
};
