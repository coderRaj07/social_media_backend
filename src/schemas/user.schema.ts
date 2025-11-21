import { z } from 'zod';
import { RoleEnumType } from '../entities/user.entity';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().nonempty('Name is required'),
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be more than 8 characters')
      .max(32, 'Password must be less than 32 characters'),
    passwordConfirm: z.string().nonempty('Please confirm your password'),
    role: z.optional(z.enum(RoleEnumType)),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords do not match',
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Invalid email or password'),
  }),
});

export const verifyEmailSchema = z.object({
  params: z.object({
    verificationCode: z.string(),
  }),
});

// Types
export type CreateUserInput = Omit<
  z.infer<typeof createUserSchema>['body'],
  'passwordConfirm'
>;

export type LoginUserInput = z.infer<typeof loginUserSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['params'];
