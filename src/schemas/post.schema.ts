// src/schemas/post.schema.ts
import { object, string, TypeOf, number } from 'zod';

export const createPostSchema = object({
  body: object({
    title: string({
      required_error: 'Title is required',
    }),
    content: string({
      required_error: 'Content is required',
    }),
    image: string().optional(),
  }),
});

const params = {
  params: object({
    postId: string(),
  }),
};

export const getPostSchema = object({
  ...params,
});

export const updatePostSchema = object({
  ...params,
  body: object({
    title: string().optional(),
    content: string().optional(),
    image: string().optional(),
  }),
});

export const deletePostSchema = object({
  ...params,
});

// Feed query params
export const getFeedSchema = object({
  query: object({
    page: number().optional(),
    limit: number().optional(),
  }).partial(),
});

export type CreatePostInput = TypeOf<typeof createPostSchema>['body'];
export type GetPostInput = TypeOf<typeof getPostSchema>['params'];
export type UpdatePostInput = TypeOf<typeof updatePostSchema>;
export type DeletePostInput = TypeOf<typeof deletePostSchema>['params'];
export type GetFeedQuery = TypeOf<typeof getFeedSchema>['query'];
