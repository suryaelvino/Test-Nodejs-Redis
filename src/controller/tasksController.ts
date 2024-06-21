import { Request, Response } from 'express';
import {createClient} from 'redis';
import { v4 as uuidv4 } from 'uuid';

// Inisialisasi klien Redis
const client = createClient({
    url: 'redis://localhost:6379'
});

client.connect();

client.on('connect', () => {
    console.log('Redis client connected');
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

export const createTask = async (req: Request, res: Response): Promise<void> => {
    const { title, description } = req.body;
    if (!title || !description) {
        res.status(400).json({ message: 'Title and Description are required' });
        return;
    }

    try {
        // Buat UUID v4 baru
        let id = uuidv4();
        // Lakukan perulangan untuk mendapatkan ID yang unik
        let idExists = true;
        while (idExists) {
            const existingTask = await client.get(id);
            idExists = !!existingTask;
            if (idExists) {
                id = uuidv4();
            }
        }
        // Buat objek task
        const task = { id, title, description };
        // Simpan objek task sebagai JSON
        await client.set(id, JSON.stringify(task));
        res.status(201).json(task);
        return;
    } catch (err) {
        console.error('Failed to create task:', err);
        res.status(500).json({ error: 'Failed to create task' });
        return;
    }
};

export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const keys = await client.keys('*');
        if (keys.length === 0) {
            res.status(404).json({message: 'Not Foud All Tasks', data: null});
            return;
        }
        const tasks = await client.mGet(keys);
        res.status(200).json(tasks.map((task: string | null) => task ? JSON.parse(task) : null));
    } catch (err) {
        console.error('Failed to retrieve tasks:', err);
        res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
};

// Fungsi untuk mendapatkan task berdasarkan ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const task = await client.get(id);
        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(200).json(JSON.parse(task));
    } catch (err) {
        console.error(`Failed to retrieve task with id ${id}:`, err);
        res.status(500).json({ error: 'Failed to retrieve task' });
    }
};

// Fungsi untuk memperbarui task berdasarkan ID
export const updateTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
        res.status(400).json({ message: 'Title and Description are required' });
        return;
    }
    
    try {
        const task = await client.get(id);
        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        const updatedTask = { ...JSON.parse(task), title, description };
        await client.set(id, JSON.stringify(updatedTask));
        res.status(200).json(updatedTask);
    } catch (err) {
        console.error(`Failed to update task with id ${id}:`, err);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Fungsi untuk menghapus task berdasarkan ID
export const deleteTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const reply = await client.del(id);
        if (reply === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(`Failed to delete task with id ${id}:`, err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};