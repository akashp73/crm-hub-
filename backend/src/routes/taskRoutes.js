import express from 'express';
import { getMyTasks, createTask, completeTask } from '../controllers/taskController.js';

const router = express.Router();

router.get('/my-tasks', getMyTasks);
router.post('/', createTask);
router.put('/:id/complete', completeTask);

export default router;
