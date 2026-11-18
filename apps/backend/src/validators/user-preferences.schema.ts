import z from 'zod';
import {
    themeColors,
    transitionSpeeds,
    supportedLanguages,
    homeAppPaths,
    homeWidgetPositions,
    homeWidgetSizes,
    homeAppsAlignments,
    homeWallpaperModes,
    isHomeWallpaperId,
    maxWallpaperBlur
} from '@nodus/shared';

const widgetLayoutSchema = z.strictObject({
    position: z.enum(homeWidgetPositions),
    size: z.enum(homeWidgetSizes)
});

export const updateUserPreferencesSchema = z
    .strictObject({
        language: z.enum(supportedLanguages).optional(),
        themeColor: z.enum(themeColors).optional(),
        themeFromWallpaper: z.boolean().optional(),
        transitionDuration: z.union(transitionSpeeds.map((value) => z.literal(value))).optional(),
        homeWallpaper: z.string().refine(isHomeWallpaperId).nullable().optional(),
        homeWallpaperMode: z.enum(homeWallpaperModes).optional(),
        homeWallpaperDesktop: z.string().refine(isHomeWallpaperId).nullable().optional(),
        homeWallpaperTablet: z.string().refine(isHomeWallpaperId).nullable().optional(),
        homeWallpaperMobile: z.string().refine(isHomeWallpaperId).nullable().optional(),
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
        homeClockLayout: widgetLayoutSchema.optional(),
        homeWeatherLayout: widgetLayoutSchema.optional(),
        homeAppsAlignment: z.enum(homeAppsAlignments).optional(),
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
