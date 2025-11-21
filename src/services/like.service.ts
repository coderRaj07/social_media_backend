import { AppDataSource } from '../utils/data-source';
import { Like } from '../entities/like.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import redisClient, { getRedisClient } from '../utils/connectRedis';
import config from 'config';

const CACHE_EX = config.get<number>('redisCacheExpiresIn') * 60;

export const toggleLike = async (user: User, post: Post) => {
  const repo = AppDataSource.getRepository(Like);
  const existing = await repo.findOne({ where: { userId: user.id, postId: post.id } });
  const redisClient = getRedisClient();

  if (existing) {
    await repo.remove(existing);
    await redisClient.del(`postLikes:${post.id}`);
    await redisClient.del(`post:${post.id}`); // Invalidate post cache
    return { liked: false };
  }

  const like = repo.create({ userId: user.id, postId: post.id, user, post });
  await repo.save(like);
  await redisClient.del(`postLikes:${post.id}`);
  await redisClient.del(`post:${post.id}`);
  return { liked: true };
};

export const countLikesForPost = async (postId: string) => {
  const cacheKey = `postLikes:${postId}`;
  const redisClient = getRedisClient();
  const cached = await redisClient.get(cacheKey);
  if (cached) return Number(cached);

  const count = await AppDataSource.getRepository(Like).count({ where: { postId } });
  await redisClient.set(cacheKey, count, { EX: CACHE_EX });
  return count;
};
