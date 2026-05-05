import express from 'express';
import { getStats, getHotLeads } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getStats);
router.get('/hot-leads', getHotLeads);

export default router;
