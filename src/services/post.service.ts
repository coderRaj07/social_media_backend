import { AppDataSource } from '../utils/data-source';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { FindOptionsWhere, In } from 'typeorm';
import redisClient, { getRedisClient } from '../utils/connectRedis';
import config from 'config';
import { feedQueue } from '../utils/redisQueue';
import { findFollowersIds } from './follow.service';

const CACHE_EX = config.get<number>('redisCacheExpiresIn') * 60;

export const createPost = async (input: Partial<Post>, user: User) => {
  const repo = AppDataSource.getRepository(Post);
  const post = repo.create({
    ...input,
    user,
    userId: user.id,
  });
  const savedPost = await repo.save(post);

  // Push feed update to queue for all followers
  const followers = await findFollowersIds(user.id);
  await feedQueue.add('feedGeneration', {
    postId: savedPost.id,
    userId: user.id,
    followers,
  });

  return savedPost;
};

export const getPost = async (id: string) => {
  const cacheKey = `post:${id}`;
  const redisClient = getRedisClient();
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const post = await AppDataSource.getRepository(Post).findOne({
    where: { id },
    relations: ['user', 'comments', 'likes'],
  });

  if (post) await redisClient.set(cacheKey, JSON.stringify(post), { EX: CACHE_EX });
  return post;
};

/**
 * findPosts: find with optional where clause
 * - where: optional FindOptionsWhere<Post> or array of those
 * - order: an object like { created_at: 'DESC' } (use your Model's timestamp field names)
 * - options: optional skip/take
 */
export const findPosts = async (
  where?: FindOptionsWhere<Post> | FindOptionsWhere<Post>[],
  order: Record<string, 'ASC' | 'DESC'> = { created_at: 'DESC' },
  options: { skip?: number; take?: number } = { skip: 0, take: 20 }
) => {
  const repo = AppDataSource.getRepository(Post);
  const findOptions: any = { relations: ['user', 'comments', 'likes'], order };
  if (where) findOptions.where = where;
  if (options.skip) findOptions.skip = options.skip;
  if (options.take) findOptions.take = options.take;

  return await repo.find(findOptions);
};

/**
 * Queue-enabled feed: paginated posts for a user
 */
export const getFeedForUserIds = async (userId: string, page = 1, limit = 20) => {
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const cacheKey = `feed:${userId}`;
  const redisClient = getRedisClient();
  // Fetch from Redis (may return loose types)
  const rawPostIds = await redisClient.lRange(cacheKey, start, end);

  // Filter to only strings
  const postIds: string[] = Array.isArray(rawPostIds)
    ? rawPostIds.filter((id): id is string => typeof id === 'string')
    : [];

  console.log(postIds)
  // inside getFeedForUserIds
  if (postIds.length) {
    const posts = await AppDataSource.getRepository(Post).findBy({
      id: In(postIds),
    });

    const postMap = new Map(posts.map(p => [p.id, p]));
    console.log(postMap)
    return postIds.map(id => postMap.get(id)).filter(Boolean);
  }

  // Fallback DB query
  const followingIds = await findFollowersIds(userId);
  if (followingIds.length === 0) {
    return []; // no posts to fetch
  }
  const skip = (page - 1) * limit;
  const posts = await AppDataSource.getRepository(Post).find({
    where: { userId: In(followingIds.length ? followingIds : ['']) },
    relations: ['user', 'comments', 'likes'],
    order: { created_at: 'DESC' },
    skip,
    take: limit,
  });

  if (page === 1 && posts.length) {
    const ids = posts.map(p => p.id);
    await redisClient.rpush(cacheKey, ...ids);
    await redisClient.ltrim(cacheKey, 0, 99);
  }

  return posts;
};


export const getPostsByUserId = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const cacheKey = `userPosts:${userId}:page:${page}:limit:${limit}`;
  const redisClient = getRedisClient();
  const cached = await redisClient.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const posts = await findPosts({ userId } as FindOptionsWhere<Post>, { created_at: 'DESC' }, { skip, take: limit });
  await redisClient.set(cacheKey, JSON.stringify(posts), { EX: CACHE_EX });

  return posts;
};
