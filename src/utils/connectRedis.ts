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

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully');
    await redisClient.set('try', 'Hello Welcome to Express with TypeORM');
  } catch (error) {
    console.error(error);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();

export default redisClient;
