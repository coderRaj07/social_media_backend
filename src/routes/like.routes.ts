// src/routes/like.routes.ts
import express from 'express';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import { likePostHandler, unlikePostHandler } from '../controllers/like.controller';

const router = express.Router();

router.post('/:postId', deserializeUser, requireUser, likePostHandler);
router.delete('/:postId', deserializeUser, requireUser, unlikePostHandler);

export default router;
