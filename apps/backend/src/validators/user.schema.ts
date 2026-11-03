import z from 'zod'
import { passwordSchema } from './auth.schema'

export const usernameSchema = z.string()
    .regex(/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]*$/, { error: 'INVALID_USERNAME' })
    .min(2)
    .max(22);

export const createUserSchema = z.object({
    displayName: z.string().min(3).max(22).nullable().optional(),
    username: usernameSchema,
    email: z.email(),
    password: passwordSchema
});

export const updateUserSchema = z.object({
    displayName: z.string().min(2).nullable().optional(),
    username: usernameSchema.optional(),
    email: z.email().optional(),
}).refine((data) => Object.keys(data).length > 0, { error: 'ONE_FIELD_REQUIRED' });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;