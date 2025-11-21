// src/services/comment.service.ts
import { AppDataSource } from '../utils/data-source';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

export const createComment = async (text: string, post: Post, user: User) => {
  const repo = AppDataSource.getRepository(Comment);
  const comment = repo.create({
    text,
    post,
    postId: post.id,
    user,
    userId: user.id,
  });
  return await repo.save(comment);
};

export const deleteComment = async (id: string) => {
  const repo = AppDataSource.getRepository(Comment);
  const comment = await repo.findOne({ where: { id } });
  if (!comment) return null;
  await repo.remove(comment);
  return comment;
};
