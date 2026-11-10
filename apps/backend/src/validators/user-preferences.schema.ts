import z from 'zod'
import { themeColors, maxTransitionDuration, supportedLanguages } from '@todo/shared'

export const updateUserPreferencesSchema = z.strictObject({
    language: z.enum(supportedLanguages).optional(),
    themeColor: z.enum(themeColors).optional(),
    transitionDuration: z.number().min(0).max(maxTransitionDuration).optional(),
}).refine(data => Object.keys(data).length > 0, { error: 'ONE_FIELD_REQUIRED' });

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
