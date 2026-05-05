import express from 'express';
import { getScoreRules, createScoreRule, updateScoreRule } from '../controllers/scoreController.js';

const router = express.Router();

router.get('/', getScoreRules);
router.post('/', createScoreRule);
router.put('/:id', updateScoreRule);

export default router;
