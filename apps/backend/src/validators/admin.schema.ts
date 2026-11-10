import z from 'zod'
import { UserFlags } from '@todo/shared'
import { updateUserSchema } from './user.schema'

const knownFlags = Object.values(UserFlags).reduce((mask, flag) => mask | flag, 0);

export const searchUsersSchema = z.strictObject({
    q: z.string().trim().max(100).default(''),
    status: z.enum(['all', 'active', 'disabled', 'deleted']).default('all'),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Only this admin schema accepts flags. Profile updates cannot grant roles.
export const adminUpdateUserSchema = updateUserSchema.safeExtend({
    isDisabled: z.boolean().optional(),
    flags: z.number().int().min(0).max(0x7fffffff)
        .refine(flags => (flags & ~knownFlags) === 0, { error: 'INVALID_FLAGS' })
        .optional(),
}).strict();

export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
