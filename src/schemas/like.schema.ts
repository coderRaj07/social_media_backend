import { z } from 'zod';

export const toggleLikeSchema = z.object({
  body: z.object({
    postId: z.string().nonempty({ message: 'postId is required' }),
  }),
});

// Type
export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>['body'];
