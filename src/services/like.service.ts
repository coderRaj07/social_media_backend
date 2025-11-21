// src/services/like.service.ts
import { AppDataSource } from '../utils/data-source';
import { Like } from '../entities/like.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';

export const toggleLike = async (user: User, post: Post) => {
  const repo = AppDataSource.getRepository(Like);
  const existing = await repo.findOne({ where: { userId: user.id, postId: post.id } });
  if (existing) {
    await repo.remove(existing);
    return { liked: false };
  } else {
    const like = repo.create({ userId: user.id, postId: post.id, user, post });
    await repo.save(like);
    return { liked: true };
  }
};

export const countLikesForPost = async (postId: string) => {
  return await AppDataSource.getRepository(Like).count({ where: { postId } });
};
