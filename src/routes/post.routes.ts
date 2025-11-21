// src/routes/post.routes.ts
import express from 'express';
import {
  createPostHandler,
  getPostsHandler,
  getPostHandler,
  updatePostHandler,
  deletePostHandler,
  uploadPostImage,
  resizePostImage,
  getMyPostsHandler,
  getFeedHandler,
} from '../controllers/post.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import { validate } from '../middleware/validate';
import {
  createPostSchema,
  getPostSchema,
  updatePostSchema,
  deletePostSchema,
} from '../schemas/post.schema';

const router = express.Router();

router.get('/', getPostsHandler);
router.get('/feed', deserializeUser, requireUser, getFeedHandler);
router.get('/me', deserializeUser, requireUser, getMyPostsHandler);
router.get('/:postId', validate(getPostSchema), getPostHandler);

router.post(
  '/',
  deserializeUser,
  requireUser,
  uploadPostImage,
  resizePostImage,
  validate(createPostSchema),
  createPostHandler
);

router.patch(
  '/:postId',
  deserializeUser,
  requireUser,
  uploadPostImage,
  resizePostImage,
  validate(updatePostSchema),
  updatePostHandler
);

router.delete(
  '/:postId',
  deserializeUser,
  requireUser,
  validate(deletePostSchema),
  deletePostHandler
);

export default router;
