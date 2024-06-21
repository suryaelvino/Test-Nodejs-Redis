import { Router } from 'express';
import { createTask, getAllTasks, getTaskById, updateTaskById, deleteTaskById } from '../controller/tasksController';

const router: Router = Router();

router.post('/', createTask);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTaskById);
router.delete('/:id', deleteTaskById);

export default router;
