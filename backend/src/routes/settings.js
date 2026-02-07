import express from 'express';
import { getBusinessSettings, updateBusinessSettings, changePassword } from '../controllers/settingsController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getBusinessSettings);
router.put('/', updateBusinessSettings);
router.put('/password', changePassword);

export default router;
