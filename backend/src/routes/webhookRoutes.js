import express from 'express';
import { recordActivity } from '../controllers/webhookController.js';
import { apiKeyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/activity', apiKeyAuth, recordActivity);

export default router;
