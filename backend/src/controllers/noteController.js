import {
  createNote,
  getNoteById,
  getNotesByCarId,
  deleteNote,
  updateNote
} from '../models/Note.js';

export const getNotes = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const notes = await getNotesByCarId(carId);

    res.json({
      success: true,
      data: notes,
      count: notes.length
    });
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await getNoteById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

export const addNote = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note text is required'
      });
    }

    const newNote = await createNote(carId, note.trim());

    res.status(201).json({
      success: true,
      data: newNote,
      message: 'Note added successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const editNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note text is required'
      });
    }

    const existingNote = await getNoteById(id);
    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    const updatedNote = await updateNote(id, note.trim());

    res.json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const removeNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingNote = await getNoteById(id);
    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    await deleteNote(id);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotes,
  getNote,
  addNote,
  editNote,
  removeNote
};
