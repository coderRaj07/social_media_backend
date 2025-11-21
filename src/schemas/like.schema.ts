// src/schemas/like.schema.ts
import { object, string, TypeOf } from 'zod';

export const toggleLikeSchema = object({
  body: object({
    postId: string({
      required_error: 'postId is required',
    }),
  }),
});

export type ToggleLikeInput = TypeOf<typeof toggleLikeSchema>['body'];
   