import { z } from 'zod';

// Create Post
export const createPostSchema = z.object({
  body: z.object({
    title: z.string().nonempty({ message: 'Title is required' }),
    content: z.string().nonempty({ message: 'Content is required' }),
    image: z.string().optional(),
  }),
});

// Params schema for postId
const paramsSchema = z.object({
  postId: z.string(),
});

// Get Post
export const getPostSchema = z.object({
  params: paramsSchema,
});

// Update Post
export const updatePostSchema = z.object({
  params: paramsSchema,
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    image: z.string().optional(),
  }),
});

// Delete Post
export const deletePostSchema = z.object({
  params: paramsSchema,
});

// Feed query params
export const getFeedSchema = z.object({
  query: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).partial(),
});

// Types
export type CreatePostInput = z.infer<typeof createPostSchema>['body'];
export type GetPostInput = z.infer<typeof getPostSchema>['params'];
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>['params'];
export type GetFeedQuery = z.infer<typeof getFeedSchema>['query'];
