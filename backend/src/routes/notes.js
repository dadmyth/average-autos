import express from 'express';
import {
  getNotes,
  getNote,
  addNote,
  editNote,
  removeNote
} from '../controllers/noteController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes for notes on a specific car
router.get('/car/:carId', getNotes);
router.post('/car/:carId', addNote);
router.get('/:id', getNote);
router.put('/:id', editNote);
router.delete('/:id', removeNote);

export default router;
