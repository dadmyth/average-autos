import express from 'express';
import {
  getStatistics,
  getProfitLoss,
  getExpiryAlerts,
  getMonthlySales
} from '../controllers/dashboardController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/stats', getStatistics);
router.get('/profit-loss', getProfitLoss);
router.get('/expiry-alerts', getExpiryAlerts);
router.get('/monthly-sales', getMonthlySales);

export default router;
