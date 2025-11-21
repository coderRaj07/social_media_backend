import { createClient } from 'redis';
import config from 'config';

const redisConfig = {
  host: config.get<string>('redis.host'),
  port: Number(config.get<string>('redis.port')),
  username: config.get<string>('redis.username'),
  password: config.get<string>('redis.password'),
};

const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  username: redisConfig.username,
  password: redisConfig.password,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connect successfully');
    redisClient.set('try', 'Hello Welcome to Express with TypeORM');
  } catch (error) {
    console.log(error);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();

export default redisClient;
