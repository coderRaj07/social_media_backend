import { createClient } from 'redis';
import config from 'config';

export const redisConfig = {
  host: config.get<string>('redis.host'),
  port: Number(config.get<string>('redis.port')),
  username: config.get<string>('redis.username'),
  password: config.get<string>('redis.password'),
};

export const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  username: redisConfig.username,
  password: redisConfig.password,
});

let isConnected = false; // track connection status

export const connectRedis = async () => {
  if (isConnected) return; // do not reconnect if already connected

  try {
    await redisClient.connect();
    isConnected = true;
    console.log('✅ Redis client connected successfully');
    await redisClient.set('try', 'Hello Welcome to Express with TypeORM');
  } catch (error) {
    console.error('Redis connection failed:', error);
    setTimeout(connectRedis, 5000); // retry safely
  }
};

// call it once at startup
connectRedis();

export default redisClient;
