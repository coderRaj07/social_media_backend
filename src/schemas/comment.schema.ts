import { z } from 'zod';

// Create Comment
export const createCommentSchema = z.object({
  body: z.object({
    text: z.string().nonempty({ message: 'Comment text is required' }),
    postId: z.string().nonempty({ message: 'postId is required' }),
  }),
});

// Delete Comment
export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.string().nonempty({ message: 'commentId is required' }),
  }),
});

// Types
export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>['params'];
