import config from 'config';
import { omit } from 'lodash';
import { User } from '../entities/user.entity';
import redisClient from '../utils/connectRedis';
import { AppDataSource } from '../utils/data-source';
import { signJwt } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);
const CACHE_EX = config.get<number>('redisCacheExpiresIn') * 60;

export const createUser = async (input: Partial<User>) => {
  const user = await userRepository.save(userRepository.create(input));

  // Invalidate cache for this user
  await redisClient.del(`user:${user.id}`);
  await redisClient.del(`user:email:${user.email}`);

  return user;
};

export const findUserByEmail = async ({ email }: { email: string }) => {
  const cacheKey = `user:email:${email}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const user = await userRepository.findOneBy({ email });
  if (user) await redisClient.set(cacheKey, JSON.stringify(user), { EX: CACHE_EX });
  console.log(user)
  return user;
};

export const findUserById = async (userId: string) => {
  const cacheKey = `user:${userId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await userRepository.findOneBy({ id: userId });
  if (user) await redisClient.set(cacheKey, JSON.stringify(user), { EX: CACHE_EX });
  return user;
};

export const findUser = async (query: Object) => {
  return await userRepository.findOneBy(query);
};

export const signTokens = async (user: User) => {
  // 1. Create Session
  redisClient.set(user.id, JSON.stringify(user), {
    EX: config.get<number>('redisCacheExpiresIn') * 60,
  });

  // 2. Create Access and Refresh tokens
  const access_token = signJwt({ sub: user.id }, 'accessTokenPrivateKey', {
    expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
  });

  const refresh_token = signJwt({ sub: user.id }, 'refreshTokenPrivateKey', {
    expiresIn: `${config.get<number>('refreshTokenExpiresIn')}m`,
  });

  return { access_token, refresh_token };
};

export const invalidateUserCache = async (user: User) => {
  await redisClient.del(`user:${user.id}`);
  await redisClient.del(`user:email:${user.email}`);
};