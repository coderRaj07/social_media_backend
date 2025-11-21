// src/utils/connectRedis.ts
import { createClient } from 'redis';
import config from 'config';

export const redisConfig = {
  host: config.get<string>('redis.host'),
  port: Number(config.get<string>('redis.port')),
  username: config.get<string>('redis.username'),
  password: config.get<string>('redis.password'),
};

// Singleton client
let redisClient: ReturnType<typeof createClient> | null = null;
// Track connection state
let isConnecting = false;
let isConnected = false;

export const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) throw new Error('Redis client not initialized. Call connectRedis() first.');
  return redisClient;
};

export const connectRedis = async () => {
  if (isConnected || isConnecting) return; // already connected or connecting

  isConnecting = true;

  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      username: redisConfig.username,
      password: redisConfig.password,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
      isConnecting = false;
      // Retry after 5s if connection fails
      setTimeout(connectRedis, 5000);
    });
  }

  try {
    await redisClient.connect();
    isConnected = true;
    isConnecting = false;
    console.log('✅ Redis client connected successfully');
    await redisClient.set('try', 'Hello Welcome to Express with TypeORM');
  } catch (err) {
    console.error('Redis connection failed:', err);
    isConnected = false;
    isConnecting = false;
    setTimeout(connectRedis, 5000);
  }
};

// Call once at startup
connectRedis();

export default getRedisClient;
