import z from 'zod'

export const passwordSchema = process.env.NODE_ENV === 'DEV' ? z.string() : z.string().min(8)

export const loginSchema = z.object({
    email: z.email(),
    password: passwordSchema
});

export type LoginInput = z.infer<typeof loginSchema>;