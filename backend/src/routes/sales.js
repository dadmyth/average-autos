import express from 'express';
import {
  getSales,
  getSale,
  addSale,
  editSale,
  getSaleByCarIdController
} from '../controllers/saleController.js';
import authenticateToken from '../middleware/auth.js';
import { validateSaleData } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', validateSaleData, addSale);
router.put('/:id', editSale);
router.get('/car/:carId', getSaleByCarIdController);

export default router;
