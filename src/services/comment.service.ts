import { AppDataSource } from '../utils/data-source';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import redisClient, { getRedisClient } from '../utils/connectRedis';
import config from 'config';

const CACHE_EX = config.get<number>('redisCacheExpiresIn') * 60;

export const createComment = async (text: string, post: Post, user: User) => {
  const repo = AppDataSource.getRepository(Comment);
  const comment = repo.create({ text, post, postId: post.id, user, userId: user.id });
  const saved = await repo.save(comment);
  const redisClient = getRedisClient();
  await redisClient.del(`post:${post.id}`); // invalidate post cache to include new comment
  return saved;
};

export const deleteComment = async (id: string) => {
  const repo = AppDataSource.getRepository(Comment);
  const comment = await repo.findOne({ where: { id } });
  if (!comment) return null;
  await repo.remove(comment);
  const redisClient = getRedisClient();
  await redisClient.del(`post:${comment.postId}`); // invalidate post cache
  return comment;
};
