import z from 'zod';
import {
    themeColors,
    transitionSpeeds,
    supportedLanguages,
    homeAppPaths,
    isHomeWallpaperId,
    maxWallpaperBlur
} from '@todo/shared';

export const updateUserPreferencesSchema = z
    .strictObject({
        language: z.enum(supportedLanguages).optional(),
        themeColor: z.enum(themeColors).optional(),
        themeFromWallpaper: z.boolean().optional(),
        transitionDuration: z.union(transitionSpeeds.map((value) => z.literal(value))).optional(),
        homeWallpaper: z.string().refine(isHomeWallpaperId).nullable().optional(),
        homeWallpaperBlur: z.number().int().min(0).max(maxWallpaperBlur).optional(),
        homeShowClock: z.boolean().optional(),
        homeShowWeather: z.boolean().optional(),
        homeWeatherLocation: z
            .strictObject({
                name: z.string().trim().min(1).max(200),
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180)
            })
            .nullable()
            .optional(),
        appOrder: z
            .array(z.enum(homeAppPaths))
            .max(homeAppPaths.length)
            .refine((paths) => new Set(paths).size === paths.length)
            .optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
        error: 'ONE_FIELD_REQUIRED'
    });

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
