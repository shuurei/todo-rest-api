import z from 'zod';

export const createTodoSchema = z.object({
    title: z.string().trim().min(3).max(200)
});

export const updateTodoSchema = z.object({
    isCompleted: z.boolean().optional(),
    title: z.string().trim().min(3).max(200).optional()
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
