import { Request, Response } from 'express';
import {createClient} from 'redis';
import { v4 as uuidv4 } from 'uuid';
import code from 'http-status-codes';
import { client } from '../redis/redis';

export const createTask = async (req: Request, res: Response): Promise<void> => {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(code.BAD_REQUEST).json({ message: 'Title is required and must be a non-empty string' });
        return;
    }
    if (!description || typeof description !== 'string') {
        res.status(code.BAD_REQUEST).json({ message: 'Description is required and must be a string' });
        return;
    }
    try {
        let id = uuidv4();
        // Lakukan perulangan untuk mendapatkan ID yang unik
        let idExists = true;
        while (idExists) {
            const existingTask = await client.get(id);
            idExists = !!existingTask;
            if (idExists) { id = uuidv4(); }
        }
        const task = { id, title, description };
        await client.set(id, JSON.stringify(task));
        res.status(code.CREATED).json({ message : 'Successfully create new task', data : task });
        return;
    } catch (err) {
        console.error('Failed to create task:', err);
        res.status(code.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create task' });
        return;
    }
};

export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const keys = await client.keys('*');
        if (keys.length === 0) {
            res.status(code.NOT_FOUND).json({message: 'All tasks not found', data: null });
            return;
        }
        const tasks = await client.mGet(keys);
        res.status(code.OK).json({ message : 'Success get all task', data : tasks.map((task: string | null) => task ? JSON.parse(task) : null) });
    } catch (err) {
        console.error('Failed to retrieve tasks:', err);
        res.status(code.INTERNAL_SERVER_ERROR).json({ message: 'Failed to retrieve all tasks' });
    }
};

// Fungsi untuk mendapatkan task berdasarkan ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const task = await client.get(id);
        if (!task) {
            res.status(code.NOT_FOUND).json({ message: `Task id ${id} not found`, data : null });
            return;
        }
        res.status(code.OK).json({message: `Successfully get detail by id ${id}`, data : JSON.parse(task) });
    } catch (err) {
        console.error(`Failed to retrieve task with id ${id}:`, err);
        res.status(code.INTERNAL_SERVER_ERROR).json({ message: `Failed to retrieve task id ${id}` });
    }
};

// Fungsi untuk memperbarui task berdasarkan ID
export const updateTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(code.BAD_REQUEST).json({ message: 'Title is required and must be a non-empty string' });
        return;
    }
    if (!description || typeof description !== 'string') {
        res.status(code.BAD_REQUEST).json({ message: 'Description is required and must be a string' });
        return;
    }
    try {
        const task = await client.get(id);
        if (!task) {
            res.status(code.NOT_FOUND).json({ message: `Task id ${id} not found`, data : null });
            return;
        }
        const updatedTask = { ...JSON.parse(task), title, description };
        await client.set(id, JSON.stringify(updatedTask));
        res.status(code.OK).json({message: `Sucessfully update task id ${id}`, data : updatedTask });
        return;
    } catch (err) {
        console.error(`Failed to update task with id ${id}:`, err);
        res.status(code.INTERNAL_SERVER_ERROR).json({ message: `Failed to update task id ${id}` });
        return;
    }
};

// Fungsi untuk menghapus task berdasarkan ID
export const deleteTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const reply = await client.del(id);
        if (reply === 0) {
            res.status(code.NOT_FOUND).json({ message: `Task id ${id} not found` });
            return;
        }
        res.status(code.OK).json({ message: `Successfully deleted task id ${id}` });
        return;
    } catch (err) {
        console.error(`Failed to delete task with id ${id}:`, err);
        res.status(code.INTERNAL_SERVER_ERROR).json({ message: `Failed to delete task id ${id}` });
        return;
    }
};