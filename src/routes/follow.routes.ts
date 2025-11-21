// src/routes/follow.routes.ts
import express from 'express';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import {
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  isFollowingHandler,
} from '../controllers/follow.controller';

const router = express.Router();

router.post('/:userId', deserializeUser, requireUser, followUserHandler);
router.delete('/:userId', deserializeUser, requireUser, unfollowUserHandler);

// public endpoints
router.get('/followers/:userId', getFollowersHandler);
router.get('/following/:userId', getFollowingHandler);

// optional helper to check if current user follows userId
router.get('/is-following/:userId', deserializeUser, requireUser, isFollowingHandler);

export default router;
