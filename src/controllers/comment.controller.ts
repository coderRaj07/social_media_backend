// src/controllers/comment.controller.ts
import { NextFunction, Request, Response } from 'express';
import { CreateCommentInput, DeleteCommentInput } from '../schemas/comment.schema';
import { createComment, deleteComment } from '../services/comment.service';
import { getPost } from '../services/post.service';
import { findUserById } from '../services/user.service';
import AppError from '../utils/appError';

export const createCommentHandler = async (req: Request<{}, {}, CreateCommentInput>, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(res.locals.user.id);
    const post = await getPost(req.body.postId);

    if (!post) return next(new AppError(404, 'Post not found'));
    if (!user) return next(new AppError(404, 'User not found'));

    const comment = await createComment(req.body.text, post, user);
    res.status(201).json({ status: 'success', data: { comment } });
  } catch (err) {
    next(err);
  }
};

export const deleteCommentHandler = async (req: Request<DeleteCommentInput>, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteComment(req.params.commentId);
    if (!deleted) return next(new AppError(404, 'Comment not found'));
    res.status(204).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};
