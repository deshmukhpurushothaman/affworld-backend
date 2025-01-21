import express from 'express';
import {
  createTaskHandler,
  getTasksHandler,
  updateTaskStatusHandler,
  deleteTaskHandler,
} from '../controllers/task.controller';
import authenticate from '../middlewares/authenticate';

const router = express.Router();

router.use(authenticate()); // Protect all routes below

// Create Task
router.post('/', createTaskHandler);

// Get Tasks
router.get('/', getTasksHandler);

// Update Task Status
router.put('/:taskId/status', updateTaskStatusHandler);

// Delete Task
router.delete('/:taskId', deleteTaskHandler);

export default router;
