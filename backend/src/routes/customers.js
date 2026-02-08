import express from 'express';
import {
  getCustomers,
  getCustomer,
  addCustomer,
  editCustomer,
  removeCustomer
} from '../controllers/customerController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Customer routes
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', addCustomer);
router.put('/:id', editCustomer);
router.delete('/:id', removeCustomer);

export default router;
