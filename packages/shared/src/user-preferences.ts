export const themeColors = ['green', 'blue', 'purple', 'amber', 'white', 'black'] as const;

export type ThemeColor = (typeof themeColors)[number];

export const supportedLanguages = ['fr', 'en'] as const;

export type Language = (typeof supportedLanguages)[number];

export const homeAppPaths = ['/admin', '/todos', '/settings'] as const;

export type HomeAppPath = (typeof homeAppPaths)[number];

export const maxWallpaperBlur = 40;

export const transitionSpeeds = [0.5, 1, 2] as const;

export type TransitionSpeed = (typeof transitionSpeeds)[number];

export interface WeatherLocation {
    name: string;
    latitude: number;
    longitude: number;
}

export interface UserPreferences {
    language: Language;
    themeColor: ThemeColor;
    themeFromWallpaper: boolean;
    transitionDuration: number;
    homeWallpaper: string | null;
    homeWallpaperBlur: number;
    homeShowClock: boolean;
    homeShowWeather: boolean;
    homeWeatherLocation: WeatherLocation | null;
    appOrder: HomeAppPath[];
}

export const defaultUserPreferences: Readonly<UserPreferences> = {
    language: 'fr',
    themeColor: 'green',
    themeFromWallpaper: false,
    transitionDuration: 1,
    homeWallpaper: null,
    homeWallpaperBlur: 0,
    homeShowClock: true,
    homeShowWeather: false,
    homeWeatherLocation: null,
    appOrder: [...homeAppPaths]
};

export const maxTransitionDuration = 5;

export function normalizeTransitionDuration(value: unknown): TransitionSpeed {
    const duration =
        typeof value === 'number' && Number.isFinite(value) ? value : defaultUserPreferences.transitionDuration;

    return transitionSpeeds.reduce((closest, candidate) =>
        Math.abs(candidate - duration) < Math.abs(closest - duration) ? candidate : closest
    );
}

export function isHomeWallpaperId(value: unknown): value is string {
    return typeof value === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/.test(value);
}

export function normalizeUserPreferences(preferences?: Partial<UserPreferences> | null): UserPreferences {
    const order = Array.isArray(preferences?.appOrder) ? preferences.appOrder : defaultUserPreferences.appOrder;

    return {
        ...defaultUserPreferences,
        ...preferences,
        transitionDuration: normalizeTransitionDuration(preferences?.transitionDuration),
        appOrder: [...new Set(order.filter((path) => homeAppPaths.includes(path)))],
        homeWallpaper: isHomeWallpaperId(preferences?.homeWallpaper) ? preferences.homeWallpaper : null
    };
}
