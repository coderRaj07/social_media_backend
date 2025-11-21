// src/services/follow.service.ts
import { AppDataSource } from '../utils/data-source';
import { Follow } from '../entities/follow.entity';
import { User } from '../entities/user.entity';

const repo = () => AppDataSource.getRepository(Follow);

/**
 * Create a follow relationship
 */
export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) throw new Error("You can't follow yourself");

  const repository = repo();
  // Check if already following
  const existing = await repository.findOne({ where: { followerId, followingId } });
  if (existing) return existing;

  const follow = repository.create({ followerId, followingId });
  return await repository.save(follow);
};

/**
 * Remove a follow relationship
 */
export const unfollowUser = async (followerId: string, followingId: string) => {
  const repository = repo();
  const existing = await repository.findOne({ where: { followerId, followingId } });
  if (!existing) return null;
  await repository.remove(existing);
  return existing;
};

/**
 * Return array of userIds that `userId` is following (i.e., the people this user follows)
 * NOTE: name kept to match earlier usage `findFollowersIds` which returned following IDs.
 */
export const findFollowersIds = async (userId: string): Promise<string[]> => {
  const repository = repo();
  const records = await repository.find({ where: { followerId: userId } });
  return records.map((r) => r.followingId);
};

/**
 * Return array of userIds that follow `userId` (i.e., followers of userId)
 */
export const findFollowingIds = async (userId: string): Promise<string[]> => {
  const repository = repo();
  const records = await repository.find({ where: { followingId: userId } });
  return records.map((r) => r.followerId);
};

/**
 * Optional helper: check if followerId follows followingId
 */
export const isFollowing = async (followerId: string, followingId: string) => {
  const repository = repo();
  const existing = await repository.findOne({ where: { followerId, followingId } });
  return !!existing;
};
