import express from 'express';
import { addPurchase, getPurchase, removePurchase } from '../controllers/purchaseController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', addPurchase);
router.get('/car/:carId', getPurchase);
router.delete('/:id', removePurchase);

export default router;
