import z from 'zod'

export const createTodoSchema = z.object({ title: z.string().min(3) });
export const updateTodoSchema = z.object({
    isCompleted: z.boolean().optional(),
    title: z.string().min(3).optional()
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
