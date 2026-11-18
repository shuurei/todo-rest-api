export const themeColors = ['green', 'blue', 'purple', 'amber', 'white', 'black'] as const;

export type ThemeColor = (typeof themeColors)[number];

export const supportedLanguages = ['fr', 'en'] as const;

export type Language = (typeof supportedLanguages)[number];

export const homeAppPaths = ['/admin', '/todos', '/settings'] as const;

export type HomeAppPath = (typeof homeAppPaths)[number];

export const homeWidgetPositions = ['top-left', 'top-center', 'top-right'] as const;
export const homeWidgetSizes = ['2x2', '3x2', '4x2'] as const;
export const homeAppsAlignments = ['left', 'center'] as const;

export type HomeWidgetPosition = (typeof homeWidgetPositions)[number];
export type HomeWidgetSize = (typeof homeWidgetSizes)[number];
export type HomeAppsAlignment = (typeof homeAppsAlignments)[number];

export interface HomeWidgetLayout {
    position: HomeWidgetPosition;
    size: HomeWidgetSize;
}

export const homeWallpaperModes = ['everywhere', 'split'] as const;
export type HomeWallpaperMode = (typeof homeWallpaperModes)[number];
export const homeWallpaperFields = ['homeWallpaper', 'homeWallpaperDesktop', 'homeWallpaperTablet', 'homeWallpaperMobile'] as const;
export type HomeWallpaperField = (typeof homeWallpaperFields)[number];

export const maxWallpaperBlur = 30;

export const transitionSpeeds = [2.2, 1.2, 0.8] as const;

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
    homeWallpaperMode: HomeWallpaperMode;
    homeWallpaperDesktop: string | null;
    homeWallpaperTablet: string | null;
    homeWallpaperMobile: string | null;
    homeWallpaperBlur: number;
    homeShowClock: boolean;
    homeShowWeather: boolean;
    homeWeatherLocation: WeatherLocation | null;
    appOrder: HomeAppPath[];
    homeClockLayout: HomeWidgetLayout;
    homeWeatherLayout: HomeWidgetLayout;
    homeAppsAlignment: HomeAppsAlignment;
}

export const defaultUserPreferences: Readonly<UserPreferences> = {
    language: 'fr',
    themeColor: 'green',
    themeFromWallpaper: true,
    transitionDuration: 1,
    homeWallpaper: null,
    homeWallpaperMode: 'everywhere',
    homeWallpaperDesktop: null,
    homeWallpaperTablet: null,
    homeWallpaperMobile: null,
    homeWallpaperBlur: 0,
    homeShowClock: true,
    homeShowWeather: false,
    homeWeatherLocation: null,
    appOrder: [...homeAppPaths],
    homeClockLayout: { position: 'top-center', size: '3x2' },
    homeWeatherLayout: { position: 'top-right', size: '2x2' },
    homeAppsAlignment: 'center'
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

export function normalizeHomeWidgetLayout(value: Partial<HomeWidgetLayout> | null | undefined, fallback: HomeWidgetLayout): HomeWidgetLayout {
    const previousPosition = value?.position as string | undefined;
    const position = previousPosition?.replace(/^(middle|bottom)-/, 'top-') as HomeWidgetPosition | undefined;
    return {
        position: position && homeWidgetPositions.includes(position) ? position : fallback.position,
        size: value?.size && homeWidgetSizes.includes(value.size) ? value.size : fallback.size
    };
}

export function getHomeWallpaperField(mode: HomeWallpaperMode, width: number): HomeWallpaperField {
    if (mode !== 'split') return 'homeWallpaper';
    return width >= 1024 ? 'homeWallpaperDesktop' : width >= 640 ? 'homeWallpaperTablet' : 'homeWallpaperMobile';
}

export function normalizeUserPreferences(preferences?: Partial<UserPreferences> | null): UserPreferences {
    const order = Array.isArray(preferences?.appOrder) ? preferences.appOrder : defaultUserPreferences.appOrder;
    const current = { ...preferences } as Partial<UserPreferences> & Record<string, unknown>;
    delete current.homeLayout;
    delete current.homeLayoutSize;

    return {
        ...defaultUserPreferences,
        ...current,
        transitionDuration: normalizeTransitionDuration(preferences?.transitionDuration),
        appOrder: [...new Set(order.filter((path) => homeAppPaths.includes(path)))],
        homeClockLayout: normalizeHomeWidgetLayout(preferences?.homeClockLayout, defaultUserPreferences.homeClockLayout),
        homeWeatherLayout: normalizeHomeWidgetLayout(preferences?.homeWeatherLayout, defaultUserPreferences.homeWeatherLayout),
        homeAppsAlignment: preferences?.homeAppsAlignment && homeAppsAlignments.includes(preferences.homeAppsAlignment)
            ? preferences.homeAppsAlignment : defaultUserPreferences.homeAppsAlignment,
        homeWallpaperMode: preferences?.homeWallpaperMode === 'split' ? 'split' : 'everywhere',
        homeWallpaper: isHomeWallpaperId(preferences?.homeWallpaper) ? preferences.homeWallpaper : null,
        homeWallpaperDesktop: isHomeWallpaperId(preferences?.homeWallpaperDesktop) ? preferences.homeWallpaperDesktop : null,
        homeWallpaperTablet: isHomeWallpaperId(preferences?.homeWallpaperTablet) ? preferences.homeWallpaperTablet : null,
        homeWallpaperMobile: isHomeWallpaperId(preferences?.homeWallpaperMobile) ? preferences.homeWallpaperMobile : null
    };
}
