import express from 'express';
import {
  getCars,
  getCar,
  addCar,
  editCar,
  removeCar,
  uploadPhotos,
  deletePhoto,
  upload
} from '../controllers/carController.js';
import {
  addServiceRecord,
  getCarServices,
  editServiceRecord,
  removeServiceRecord
} from '../controllers/serviceController.js';
import authenticateToken from '../middleware/auth.js';
import { validateCarData, validateServiceData } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Car routes
router.get('/', getCars);
router.get('/:id', getCar);
router.post('/', validateCarData, addCar);
router.put('/:id', editCar);
router.delete('/:id', removeCar);

// Photo routes
router.post('/:id/photos', upload.array('photos', 10), uploadPhotos);
router.delete('/:id/photos/:filename', deletePhoto);

// Service record routes
router.get('/:id/services', getCarServices);
router.post('/:id/services', validateServiceData, addServiceRecord);
router.put('/services/:id', validateServiceData, editServiceRecord);
router.delete('/services/:id', removeServiceRecord);

export default router;
