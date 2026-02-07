import express from 'express';
import { uploadDoc, uploadDocuments, getDocuments, deleteDocument } from '../controllers/documentController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Upload documents for a car
router.post('/:carId', uploadDoc.array('documents', 10), uploadDocuments);

// Get documents for a car
router.get('/:carId', getDocuments);

// Delete a document
router.delete('/:carId/:filename', deleteDocument);

export default router;
