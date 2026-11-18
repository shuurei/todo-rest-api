import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultUserPreferences, type UserPreferences } from '@nodus/shared'
import { useAuth } from '@/contexts/AuthContext'
import { useGateway } from '@/hooks/useGateway'
import { extractImagePalette, type ImagePalette } from '@/utils/image-palette'
import { getWallpaperUrl } from '@/utils/wallpaper'
import { useWallpaperField } from '@/hooks/useWallpaperField'

type ThemePreview = Partial<Pick<UserPreferences,
    'themeColor' | 'themeFromWallpaper' | 'homeWallpaper' | 'homeWallpaperMode'
    | 'homeWallpaperDesktop' | 'homeWallpaperTablet' | 'homeWallpaperMobile'
>> & {
    wallpaperPreviewUrl?: string | null;
};

type DynamicStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

interface ThemeContextValue {
    setPreview: (preview: ThemePreview | null) => void;
    dynamicStatus: DynamicStatus;
    claimWallpaperReveal: (source: string) => boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { unavailable } = useGateway();

    const [preview, setPreview] = useState<ThemePreview | null>(null);

    const preferences = {
        ...(user?.preferences ?? defaultUserPreferences),
        ...preview
    };

    const wallpaperField = useWallpaperField(preferences.homeWallpaperMode);
    const wallpaperSource = preview?.wallpaperPreviewUrl !== undefined
        ? preview.wallpaperPreviewUrl : getWallpaperUrl(preferences[wallpaperField]);
    const source = preferences.themeFromWallpaper ? wallpaperSource : null;
    const revealState = useMemo(() => ({ source: wallpaperSource, revealed: false }), [user?.id, wallpaperSource]);
    const claimWallpaperReveal = useCallback((nextSource: string) => {
        if (nextSource !== revealState.source) return true;
        const shouldReveal = !revealState.revealed;
        revealState.revealed = true;
        return shouldReveal;
    }, [revealState]);

    const [result, setResult] = useState<{
        source: string;
        palette: ImagePalette | null;
    } | null>(null);

    useEffect(() => {
        if (!source) return;

        extractImagePalette(source).then((palette) => {
            setResult({ source, palette });
        });
    }, [source]);

    const palette = source && result?.source === source ? result.palette : null;
    const dynamicStatus: DynamicStatus = !source
        ? 'idle'
        : result?.source !== source
            ? 'loading'
            : palette
                ? 'ready'
                : 'unavailable';

    useLayoutEffect(() => {
        const root = document.documentElement;

        const activePalette = unavailable ? { hue: 25, saturation: 1 } : palette;

        root.dataset.theme = activePalette ? 'dynamic' : preferences.themeColor;

        if (activePalette) {
            root.style.setProperty('--dynamic-hue', String(activePalette.hue));
            root.style.setProperty('--dynamic-saturation', String(activePalette.saturation));
        } else {
            root.style.removeProperty('--dynamic-hue');
            root.style.removeProperty('--dynamic-saturation');
        }
    }, [preferences.themeColor, palette, unavailable]);

    const value = useMemo(() => ({
        setPreview,
        dynamicStatus,
        claimWallpaperReveal
    }), [dynamicStatus, claimWallpaperReveal]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return context;
};

export const useThemePreview = (preview: ThemePreview | null) => {
    const { setPreview } = useTheme();

    const enabled = preview !== null;
    const color = preview?.themeColor;
    const dynamic = preview?.themeFromWallpaper;
    const wallpaper = preview?.homeWallpaper;
    const wallpaperMode = preview?.homeWallpaperMode;
    const wallpaperDesktop = preview?.homeWallpaperDesktop;
    const wallpaperTablet = preview?.homeWallpaperTablet;
    const wallpaperMobile = preview?.homeWallpaperMobile;
    const wallpaperPreviewUrl = preview?.wallpaperPreviewUrl;

    useLayoutEffect(() => {
        if (!enabled) return;

        const override: ThemePreview = {};

        if (color !== undefined) {
            override.themeColor = color;
        }

        if (dynamic !== undefined) {
            override.themeFromWallpaper = dynamic;
        }

        if (wallpaper !== undefined) {
            override.homeWallpaper = wallpaper;
        }

        if (wallpaperMode !== undefined) override.homeWallpaperMode = wallpaperMode;
        if (wallpaperDesktop !== undefined) override.homeWallpaperDesktop = wallpaperDesktop;
        if (wallpaperTablet !== undefined) override.homeWallpaperTablet = wallpaperTablet;
        if (wallpaperMobile !== undefined) override.homeWallpaperMobile = wallpaperMobile;

        if (wallpaperPreviewUrl !== undefined) {
            override.wallpaperPreviewUrl = wallpaperPreviewUrl;
        }

        setPreview(override);

        return () => setPreview(null);
    }, [enabled, color, dynamic, wallpaper, wallpaperMode, wallpaperDesktop, wallpaperTablet, wallpaperMobile, wallpaperPreviewUrl, setPreview]);
};
