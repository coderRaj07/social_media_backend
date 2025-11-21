// src/services/post.service.ts
import { AppDataSource } from '../utils/data-source';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { FindOptionsWhere } from 'typeorm';

export const createPost = async (input: Partial<Post>, user: User) => {
  const repo = AppDataSource.getRepository(Post);
  const post = repo.create({
    ...input,
    user,
    userId: user.id,
  });
  return await repo.save(post);
};

export const getPost = async (id: string) => {
  return await AppDataSource.getRepository(Post).findOne({
    where: { id },
    relations: ['user', 'comments', 'likes'],
  });
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

  const findOptions: any = {
    relations: ['user', 'comments', 'likes'],
    order,
  };

  if (typeof where !== 'undefined') findOptions.where = where;
  if (options.skip) findOptions.skip = options.skip;
  if (options.take) findOptions.take = options.take;

  return await repo.find(findOptions);
};

/**
 * Feed query: accepts list of userIds and returns posts paginated
 */
export const getFeedForUserIds = async (userIds: string[], page = 1, limit = 20) => {
  const repo = AppDataSource.getRepository(Post);
  const skip = (page - 1) * limit;

  const qb = repo
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.user', 'user')
    .leftJoinAndSelect('post.comments', 'comments')
    .leftJoinAndSelect('post.likes', 'likes')
    .where('post.userId IN (:...userIds)', { userIds })
    .orderBy('post.created_at', 'DESC')
    .skip(skip)
    .take(limit);

  return await qb.getMany();
};

export const getPostsByUserId = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return await findPosts({ userId } as FindOptionsWhere<Post>, { created_at: 'DESC' }, { skip, take: limit });
};
