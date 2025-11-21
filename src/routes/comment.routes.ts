// src/routes/comment.routes.ts
import express from 'express';
import { createCommentHandler, deleteCommentHandler } from '../controllers/comment.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import { validate } from '../middleware/validate';
import { createCommentSchema, deleteCommentSchema } from '../schemas/comment.schema';

const router = express.Router();

router.post('/', deserializeUser, requireUser, validate(createCommentSchema), createCommentHandler);
router.delete('/:commentId', deserializeUser, requireUser, validate(deleteCommentSchema), deleteCommentHandler);

export default router;
