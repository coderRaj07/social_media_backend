// src/controllers/post.controller.ts
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import AppError from '../utils/appError';
import {
  CreatePostInput,
  // GetFeedQuery, // not strictly necessary here
  UpdatePostInput,
  DeletePostInput,
} from '../schemas/post.schema';
import { createPost, getPost, getFeedForUserIds, getPostsByUserId, findPosts } from '../services/post.service';
import { findUserById } from '../services/user.service';
import { findFollowersIds } from '../services/follow.service';

// ---------- multer + resize ----------
const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith('image')) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
  }
  cb(null, true);
};

export const uploadPostImage = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5_000_000, files: 1 },
}).single('image');

export const resizePostImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) return next();

    const user = res.locals.user;
    if (!user) return next(new AppError(401, 'User not authenticated'));

    const fileName = `post-${user.id}-${Date.now()}.jpeg`;
    await sharp(file.buffer)
      .resize(1200, 675, { fit: 'cover' })
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`${__dirname}/../../public/posts/${fileName}`);

    // Attach filename to body for service layer to persist
    (req.body as any).image = fileName;
    next();
  } catch (err: any) {
    next(err);
  }
};

// ---------- CRUD handlers ----------
export const createPostHandler = async (req: Request<{}, {}, CreatePostInput>, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(res.locals.user.id as string);
    if (!user) return next(new AppError(404, 'User not found'));

    const post = await createPost(req.body, user);
    res.status(201).json({ status: 'success', data: { post } });
  } catch (err) {
    next(err);
  }
};

export const getPostHandler = async (req: Request<{ postId: string }>, res: Response, next: NextFunction) => {
  try {
    const post = await getPost(req.params.postId);
    if (!post) return next(new AppError(404, 'Post not found'));
    res.status(200).json({ status: 'success', data: { post } });
  } catch (err) {
    next(err);
  }
};

export const getPostsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const posts = await findPosts(undefined, { created_at: 'DESC' }, { skip, take: limit });
    res.status(200).json({ status: 'success', results: posts.length, data: { posts } });
  } catch (err) {
    next(err);
  }
};

export const updatePostHandler = async (
  req: Request<UpdatePostInput['params'], {}, UpdatePostInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    const post = await getPost(req.params.postId);
    if (!post) return next(new AppError(404, 'Post not found'));

    // Only owner can update
    if (post.userId !== res.locals.user.id) {
      return next(new AppError(403, 'You do not have permission to update this post'));
    }

    Object.assign(post, req.body);
    const updated = await post.save();

    res.status(200).json({ status: 'success', data: { post: updated } });
  } catch (err) {
    next(err);
  }
};

export const deletePostHandler = async (req: Request<DeletePostInput>, res: Response, next: NextFunction) => {
  try {
    const post = await getPost(req.params.postId);
    if (!post) return next(new AppError(404, 'Post not found'));

    // Only owner can delete
    if (post.userId !== res.locals.user.id) {
      return next(new AppError(403, 'You do not have permission to delete this post'));
    }

    await post.remove();
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};

// MY POSTS (existing)
export const getMyPostsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const posts = await getPostsByUserId(res.locals.user.id, page, limit);
    res.status(200).json({ status: 'success', results: posts.length, data: { posts } });
  } catch (err) {
    next(err);
  }
};

// FEED (existing)
export const getFeedHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const userId = res.locals.user.id; // single user
    console.log({userId})
    const feed = await getFeedForUserIds(userId, page, limit);

    res.status(200).json({
      status: 'success',
      results: feed.length,
      data: { feed },
    });
  } catch (err) {
    next(err);
  }
};
