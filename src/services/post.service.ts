import { AppDataSource } from '../utils/data-source';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { FindOptionsWhere } from 'typeorm';
import redisClient from '../utils/connectRedis';
import config from 'config';

const CACHE_EX = config.get<number>('redisCacheExpiresIn') * 60;

export const createPost = async (input: Partial<Post>, user: User) => {
  const repo = AppDataSource.getRepository(Post);
  const post = repo.create({ ...input, user, userId: user.id });
  const savedPost = await repo.save(post);

  // Invalidate user feed cache
  await redisClient.del(`userPosts:${user.id}:*`);
  return savedPost;
};

export const getPost = async (id: string) => {
  const cacheKey = `post:${id}`;
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
 * Feed query: accepts list of userIds and returns posts paginated
 */
export const getFeedForUserIds = async (userIds: string[], page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const cacheKey = `feed:${userIds.join(',')}:page:${page}:limit:${limit}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const repo = AppDataSource.getRepository(Post);
  const posts = await repo
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.user', 'user')
    .leftJoinAndSelect('post.comments', 'comments')
    .leftJoinAndSelect('post.likes', 'likes')
    .where('post.userId IN (:...userIds)', { userIds })
    .orderBy('post.created_at', 'DESC')
    .skip(skip)
    .take(limit)
    .getMany();

  await redisClient.set(cacheKey, JSON.stringify(posts), { EX: CACHE_EX });
  return posts;
};

export const getPostsByUserId = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const cacheKey = `userPosts:${userId}:page:${page}:limit:${limit}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const posts = await findPosts({ userId } as FindOptionsWhere<Post>, { created_at: 'DESC' }, { skip, take: limit });
  await redisClient.set(cacheKey, JSON.stringify(posts), { EX: CACHE_EX });
  return posts;
};
