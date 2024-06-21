import express from 'express';
import * as tasks from '../controller/tasksController';

const router = express.Router();

router.post('/tasks', tasks.createTask);
router.get('/tasks', tasks.getAllTasks);
router.get('/tasks/:id', tasks.getTaskById);
router.put('/tasks/:id', tasks.updateTaskById);
router.delete('/tasks/:id', tasks.deleteTaskById);

export default router;
