// src/schemas/comment.schema.ts
import { object, string, TypeOf } from 'zod';

export const createCommentSchema = object({
  body: object({
    text: string({
      required_error: 'Comment text is required',
    }),
    postId: string({
      required_error: 'postId is required',
    }),
  }),
});

export const deleteCommentSchema = object({
  params: object({
    commentId: string(),
  }),
});

export type CreateCommentInput = TypeOf<typeof createCommentSchema>['body'];
export type DeleteCommentInput = TypeOf<typeof deleteCommentSchema>['params'];
