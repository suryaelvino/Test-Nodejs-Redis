import { createClient, RedisClientType } from 'redis';

export const client: RedisClientType = createClient({
    url: 'redis://localhost:6379'
});

export const initRedisClient = async () => {
    try {
        await client.connect();
        console.log('Redis client connected');
    } catch (err) {
        console.error('Redis error:', err);
    }
};