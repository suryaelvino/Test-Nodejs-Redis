import { Request, Response } from 'express';
import { promisify } from 'util';
import { createClient, RedisClientType } from 'redis';

// Buat klien Redis
const client: RedisClientType = createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.connect().catch(err => {
    console.error('Redis connection error:', err);
});

// Promisify Redis metode
const setAsync = promisify(client.set).bind(client);
const getAsync = promisify(client.get).bind(client);
const keysAsync = promisify(client.keys).bind(client);
const mgetAsync = promisify(client.mGet).bind(client);
const delAsync = promisify(client.del).bind(client);

// Fungsi untuk membuat task
export const createTask = async (req: Request, res: Response): Promise<void> => {
    const { title, description } = req.body;
    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    try {
        const id = Date.now().toString();
        const task = { id, title, description };
        await setAsync(id, JSON.stringify(task));
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};

// Fungsi untuk mendapatkan semua task
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const keys = await keysAsync('*');
        if (keys.length === 0) {
            res.status(200).json([]);
            return;
        }

        const tasks = await mgetAsync(keys);
        res.status(200).json(tasks.map((task: string) => JSON.parse(task!)));
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
};

// Fungsi untuk mendapatkan task berdasarkan ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const task = await getAsync(id);
        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(200).json(JSON.parse(task));
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve task' });
    }
};

// Fungsi untuk memperbarui task berdasarkan ID
export const updateTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
        const task = await getAsync(id);
        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        const updatedTask = { ...JSON.parse(task), title, description };
        await setAsync(id, JSON.stringify(updatedTask));
        res.status(200).json(updatedTask);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Fungsi untuk menghapus task berdasarkan ID
export const deleteTaskById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const reply = await delAsync(id);
        if (reply === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
