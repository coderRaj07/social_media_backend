// src/controllers/like.controller.ts
import { NextFunction, Request, Response } from 'express';
import { findUserById } from '../services/user.service';
import { getPost } from '../services/post.service';
import { toggleLike, countLikesForPost } from '../services/like.service';
import AppError from '../utils/appError';

/**
 * POST /likes/:postId
 * Toggle like (will like if not liked, unlike if already liked)
 */
export const likePostHandler = async (req: Request<{ postId: string }>, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(res.locals.user.id);
    const post = await getPost(req.params.postId);

    if (!post) return next(new AppError(404, 'Post not found'));
    if (!user) return next(new AppError(404, 'User not found'));

    const result = await toggleLike(user, post);
    const count = await countLikesForPost(post.id);

    res.status(200).json({ status: 'success', data: { ...result, likesCount: count } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /likes/:postId
 * Also toggles (will unlike if currently liked, otherwise it's idempotent)
 */
export const unlikePostHandler = async (req: Request<{ postId: string }>, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(res.locals.user.id);
    const post = await getPost(req.params.postId);

    if (!post) return next(new AppError(404, 'Post not found'));
    if (!user) return next(new AppError(404, 'User not found'));

    // toggleLike will remove if exists
    const result = await toggleLike(user, post);
    const count = await countLikesForPost(post.id);

    res.status(200).json({ status: 'success', data: { ...result, likesCount: count } });
  } catch (err) {
    next(err);
  }
};
