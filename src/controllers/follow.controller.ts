// src/controllers/follow.controller.ts
import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';
import {
  followUser,
  unfollowUser,
  findFollowersIds,
  findFollowingIds,
  isFollowing,
} from '../services/follow.service';
import { findUserById } from '../services/user.service';

export const followUserHandler = async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
  try {
    const followerId = res.locals.user.id;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return next(new AppError(400, "You can't follow yourself"));
    }

    const targetUser = await findUserById(followingId);
    if (!targetUser) return next(new AppError(404, 'User to follow not found'));

    const result = await followUser(followerId, followingId);

    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const unfollowUserHandler = async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
  try {
    const followerId = res.locals.user.id;
    const followingId = req.params.userId;

    const result = await unfollowUser(followerId, followingId);

    if (!result) return next(new AppError(404, 'Follow relationship not found'));

    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

export const getFollowingHandler = async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
  // returns list of userIds that given userId follows
  try {
    const userId = req.params.userId;
    const ids = await findFollowersIds(userId); // existing service returns followingIds for followerId
    res.status(200).json({ status: 'success', results: ids.length, data: { following: ids } });
  } catch (err) {
    next(err);
  }
};

export const getFollowersHandler = async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
  // returns list of userIds that follow given userId
  try {
    const userId = req.params.userId;
    const ids = await findFollowingIds(userId); // existing service returns followerIds for followingId
    res.status(200).json({ status: 'success', results: ids.length, data: { followers: ids } });
  } catch (err) {
    next(err);
  }
};

// Helper endpoint (optional) to check if current user is following target
export const isFollowingHandler = async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
  try {
    const followerId = res.locals.user.id;
    const followingId = req.params.userId;
    const val = await isFollowing(followerId, followingId);
    res.status(200).json({ status: 'success', data: { isFollowing: val } });
  } catch (err) {
    next(err);
  }
};
