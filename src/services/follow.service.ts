import { AppDataSource } from '../utils/data-source';
import { Follow } from '../entities/follow.entity';
import redisClient from '../utils/connectRedis';
import config from 'config';

const CACHE_EX = config.get<number>('redisCacheExpiresIn') * 60;
const repo = () => AppDataSource.getRepository(Follow);

export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) throw new Error("You can't follow yourself");

  const repository = repo();
  // Check if already following
  const existing = await repository.findOne({ where: { followerId, followingId } });
  if (existing) return existing;

  const follow = repository.create({ followerId, followingId });
  const saved = await repository.save(follow);

  // Invalidate caches
  await redisClient.del(`followers:${followingId}`);
  await redisClient.del(`following:${followerId}`);

  return saved;
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const repository = repo();
  const existing = await repository.findOne({ where: { followerId, followingId } });
  if (!existing) return null;

  await repository.remove(existing);

  // Invalidate caches
  await redisClient.del(`followers:${followingId}`);
  await redisClient.del(`following:${followerId}`);

  return existing;
};

/**
 * Return array of userIds that `userId` is following (i.e., the people this user follows)
 * NOTE: name kept to match earlier usage `findFollowersIds` which returned following IDs.
 */
export const findFollowersIds = async (userId: string): Promise<string[]> => {
  const cacheKey = `followers:${userId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const records = await repo().find({ where: { followingId: userId } });
  const followerIds = records.map((r) => r.followerId);

  await redisClient.set(cacheKey, JSON.stringify(followerIds), { EX: CACHE_EX });
  return followerIds;
};

export const findFollowingIds = async (userId: string): Promise<string[]> => {
  const cacheKey = `following:${userId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const records = await repo().find({ where: { followerId: userId } });
  const followingIds = records.map((r) => r.followingId);

  await redisClient.set(cacheKey, JSON.stringify(followingIds), { EX: CACHE_EX });
  return followingIds;
};

export const isFollowing = async (followerId: string, followingId: string) => {
  const existing = await repo().findOne({ where: { followerId, followingId } });
  return !!existing;
};
